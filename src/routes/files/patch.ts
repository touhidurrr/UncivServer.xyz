import type { FastifyRequest } from 'fastify/types/request';
import type { RouteHandlerMethod } from 'fastify/types/route';
import { writeFile } from 'fs';

async function saveFile(req: FastifyRequest, data: string) {
  const { fileName, server, url } = req;

  writeFile(fileName, data, server.errorLogger);
  await server.redis.set(url, data, { EX: server.expireAfter }).catch(server.errorLogger);
}

//@ts-ignore
const patchFile: RouteHandlerMethod = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply
) => {
  saveFile(req, req.body as string);
  return '200 OK!';
};

export default patchFile;
