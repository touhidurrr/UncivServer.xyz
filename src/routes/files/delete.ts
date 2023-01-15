import type { FastifyRequest } from 'fastify/types/request';
import type { RouteHandlerMethod } from 'fastify/types/route';
import { rm } from 'fs';

//@ts-ignore
const deleteFile: RouteHandlerMethod = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply
) => {
  const { fileName, params, server, url } = req;
  const gameFileName = params.id;

  if (!server.gameFileRegex.test(gameFileName)) {
    reply.status(400);
    return 'Invalid game ID!';
  }

  rm(fileName, { force: true }, server.errorLogger);
  server.UncivDropbox.delete(gameFileName).catch(server.errorLogger);
  await server.redis.del(url).catch(server.errorLogger);
  await server.db.UncivServer.deleteOne({ _id: gameFileName }).catch(server.errorLogger);
  return '200 OK!';
};

export default deleteFile;
