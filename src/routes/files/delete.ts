import type { FastifyReply } from 'fastify/types/reply';
import type { FastifyRequest } from 'fastify/types/request';
import { rm } from 'fs';

const deleteFile = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const { fileName, params, server, url } = req;
  const gameFileName = params.id;

  if (!server.gameFileRegex.test(gameFileName)) {
    reply.status(400);
    return 'Invalid game ID!';
  }

  rm(fileName, { force: true }, server.errorLogger);
  server.UncivDropbox.delete(gameFileName).catch(server.errorLogger);
  await server.redis.del(url).catch(server.errorLogger);
  await server.db.UncivServer.deleteOne({ _id: { equals: gameFileName } }).catch(
    server.errorLogger
  );
  return '200 OK!';
};

export default deleteFile;
