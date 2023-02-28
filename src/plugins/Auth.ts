import * as argon2 from 'argon2';
import fp from 'fastify-plugin';
import UncivParser from '../modules/UncivParser';
import type { UncivJSON } from '../types/UncivJSON';

// declare types
declare module 'fastify' {
  interface FastifyRequest {
    game?: UncivJSON;
    userId?: string;
    playerId?: string;
  }
}

export default fp(async function (server) {
  async function getHashWithCache(userId: string) {
    let cachedHash = await server.cache.auth.get(userId);
    if (!cachedHash) {
      const dbHash = await server.db.Auth.findOne({ _id: userId });
      await server.cache.auth.set(userId, dbHash?.hash ?? '');
      return dbHash?.hash ?? null;
    }
    return cachedHash;
  }

  server.addHook('preValidation', async function (req, reply) {
    const isAuthRoute = req.url.startsWith('/auth');
    const isFilesRoute = req.url.startsWith('/files');

    // return if not /auth or /files
    if (isAuthRoute || isFilesRoute) return;

    // if /files, parse game and get playerId
    if (isFilesRoute) {
      const game = UncivParser.parse(req.body as string);
      const { currentPlayer, civilizations } = game;
      const { playerId } = civilizations.find(civ => civ.civName === currentPlayer)!;
      req.game = game;
      req.playerId = playerId;
    }

    if (!req.headers.authorization) {
      // an /auth request without authorization header will fail
      if (isAuthRoute) return reply.code(401).send('401 Unauthorized!');
      else {
        const hash = await getHashWithCache(req.playerId!);
        // if no auth header but hash is found, validation fails
        if (hash) return reply.code(401).send('401 Unauthorized!');
      }
      // not /auth and no hash is found auth header, validation success
      return;
    }

    const [type, auth] = req.headers.authorization.split(' ');
    if (type === 'Basic') {
      const userPass = Buffer.from(auth, 'base64').toString('utf8');
      const colonIdx = userPass.indexOf(':');
      const userId = userPass.slice(0, colonIdx);
      const password = userPass.slice(colonIdx + 1);

      // no userId == error!
      if (!userId || (isFilesRoute && userId !== req.playerId)) {
        return reply.code(401).send('401 Unauthorized!');
      }

      let hash = await getHashWithCache(userId);

      // if no hash is found, validation done
      if (!hash) return;

      if (await argon2.verify(hash, password)) {
        req.userId = userId;
        return;
      } else {
        return reply.code(401).send('401 Unauthorized!');
      }
    }

    // cannot recognize auth type
    return reply.code(400).send('400 Bad Request!');
  });

  console.log('Loaded Auth Plugin!');
});
