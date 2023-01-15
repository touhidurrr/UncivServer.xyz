import type { FastifyRequest } from 'fastify/types/request';
import { writeFile } from 'fs';

async function saveFile(req: FastifyRequest, data: string) {
  const { fileName, server, url } = req;

  writeFile(fileName, data, server.errorLogger);
  await server.redis.set(url, data, { EX: server.expireAfter }).catch(server.errorLogger);
}

type PatchFileRequest = FastifyRequest<{ Params: { id: string }; Body: string }>;

const patchFile = async (req: PatchFileRequest) => {
  saveFile(req, req.body);
  return '200 OK!';
};

export default patchFile;
