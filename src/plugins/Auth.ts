import * as argon2 from 'argon2';
import fp from 'fastify-plugin';
import type { FastifyRequest } from 'fastify/types/request';
import { writeFile } from 'fs';
import UncivParser from '../modules/UncivParser';
import type { UncivJSON } from '../types/UncivJSON';

// declare types
declare module 'fastify' {
  interface FastifyRequest {
    file?: string;
    game?: UncivJSON;
    userId?: string;
    playerId?: string;
  }
}

type FilesRequest = FastifyRequest<{ Params: { id: string }; Body?: string }>;

async function saveFile({ fileName, url, server }: FastifyRequest, data: string) {
  writeFile(fileName, data, server.errorLogger);
  await server.cache.files.set(url, data);
}

async function setGameAndplayerIdWithCache(req: FilesRequest) {
  const {
    server,
    params: { id: gameFileName },
  } = req;

  if (req.body) {
    const game = UncivParser.parse(req.body as string);
    const { currentPlayer, civilizations } = game;
    const { playerId } = civilizations.find(civ => civ.civName === currentPlayer)!;
    Object.assign(req, { game, playerId });
  }

  // look for cached file
  let file = await server.cache.files.get(req.url);
  const isCached = !!file;

  // if no cached file, look for file in MongoDB
  if (!file) {
    const mongoRes = await server.db.UncivServer.findOne(
      { _id: gameFileName },
      { projection: { _id: 0, text: 1 } }
    ).catch(server.errorLogger);

    if (mongoRes) {
      file = mongoRes.text;
      saveFile(req, file);
    }
  }

  // if no cached file or MongoDB file, look for file in UncivDropbox
  if (!file) {
    file = await server.UncivDropbox.download(gameFileName);
    if (file) saveFile(req, file);
  }

  // if no cached file, MongoDB file, or UncivDropbox file, return
  if (!file) return;

  let playerId: string | null = null;
  // if file is cached, look for if playerId in cache
  if (isCached) playerId = await server.cache.playerId.get(gameFileName);
  // if file not in cache, update playerId cache. recalculate if playerId if not cached
  if (!isCached || !playerId) {
    const game = UncivParser.parse(file as string);
    req.game = game;

    const { currentPlayer, civilizations } = game;
    playerId = civilizations.find(civ => civ.civName === currentPlayer)!.playerId!;
    await server.cache.playerId.set(gameFileName, playerId);
  }

  Object.assign(req, { file, playerId });
}

export default fp(
  async function (server) {
    async function getHashWithCache(userId: string) {
      let cachedHash = await server.cache.auth.get(userId);
      if (!cachedHash) {
        const dbHash = await server.db.Auth.findOne({ _id: userId });
        if (dbHash?.hash) {
          const { hash } = dbHash;
          await server.cache.auth.set(userId, hash);
          return hash;
        }
      }
      return cachedHash;
    }

    server.addHook('preValidation', async function (req, reply) {
      const isAuthRoute = req.url.startsWith('/auth');
      const isFilesRoute = req.url.startsWith('/files');

      // return if not /auth or /files or not a GET or PUT request
      if (!(isAuthRoute || isFilesRoute) || !['GET', 'PUT'].includes(req.method)) return;

      // if /files, parse game and get playerId
      if (isFilesRoute) {
        // if invalid gameId, return 400
        if (!server.gameFileRegex.test((req as FilesRequest).params.id)) {
          return reply.code(400).send('400 Bad Request!');
        }

        // if no body on PUT request, return 400
        if (req.method === 'PUT' && !req.body) return reply.code(400).send('400 Bad Request!');

        await setGameAndplayerIdWithCache(req as FilesRequest);
        if (req.method === 'GET' && !req.file) return reply.code(404).send('404 Not Found!');
      }

      if (!req.headers.authorization) {
        // an /auth request without authorization header will fail
        if (isAuthRoute) return reply.code(401).send('401 Unauthorized!');
        else {
          const hash = await getHashWithCache(req.playerId!);
          console.log(hash);
          // if no auth header but hash is found, validation fails
          if (hash) return reply.code(401).send('401 Unauthorized!');
        }
      }

      const [type, auth] = req.headers.authorization!.split(' ');
      if (type === 'Basic') {
        const userPass = Buffer.from(auth, 'base64').toString('utf8');
        const colonIdx = userPass.indexOf(':');
        const userId = userPass.slice(0, colonIdx);
        const password = userPass.slice(colonIdx + 1);

        // no userId or userId != playerId, validation fails
        if (
          !userId ||
          (isFilesRoute &&
            ((req.method === 'GET' && userId !== req.playerId) ||
              (req.method === 'PUT' &&
                req.game!.gameParameters.players.some(p => p.playerId === userId))))
        ) {
          return reply.code(401).send('401 Unauthorized!');
        }
        req.userId = userId;

        // if no hash is found, validation ok
        const hash = await getHashWithCache(userId);
        if (!hash) return;

        if (await argon2.verify(hash, password)) return;
        else return reply.code(401).send('401 Unauthorized!');
      }

      // cannot recognize auth type
      return reply.code(400).send('400 Bad Request!');
    });

    console.log('Loaded Auth Plugin!');
  },
  { name: 'Auth', dependencies: ['Constants', 'UncivDropbox', 'Redis', 'FileServer'] }
);
