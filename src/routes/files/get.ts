import type { FastifyRequest } from 'fastify/types/request';
import type { RouteHandlerMethod } from 'fastify/types/route';
import { writeFile } from 'fs';

async function saveFile(req: FastifyRequest, data: string) {
  const { fileName, server, url } = req;

  writeFile(fileName, data, server.errorLogger);
  await server.redis.set(url, data, { EX: server.expireAfter }).catch(server.errorLogger);
}

//@ts-ignore
const getFile: RouteHandlerMethod = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply
) => {
  const { fileName, params, server } = req;
  const gameFileName = params.id;

  if (!server.gameFileRegex.test(gameFileName)) {
    reply.status(400);
    return 'Invalid game ID!';
  }

  // try getting the file from mongodb
  let fileData: any = await server.db.UncivServer.findOne(
    { _id: gameFileName },
    { projection: { _id: 0, text: 1 } }
  ).catch(server.errorLogger);

  if (fileData) {
    saveFile(req, fileData.text);
    return fileData.text;
  }

  // Dropbox
  fileData = await server.UncivDropbox.download(fileName);
  if (fileData === null) {
    reply.status(404);
    return '404 Not Found!';
  }
  saveFile(req, fileData);
  return fileData;
};

export default getFile;
