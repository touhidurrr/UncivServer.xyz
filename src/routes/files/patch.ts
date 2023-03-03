import type { FastifyReply } from 'fastify/types/reply';
import type { FastifyRequest } from 'fastify/types/request';
import { writeFile } from 'fs/promises';
import { tryLogSenderInfo, validateBody } from '../../modules/Validation';
const { PATCH_KEY } = process.env;

if (!PATCH_KEY) {
  throw new Error('PATCH_KEY env var not provided!');
}

async function saveFile(req: FastifyRequest, data: string) {
  const { fileName, server, url } = req;

  writeFile(fileName, data).catch(server.errorLogger);
  await server.cache.files.set(url, data).catch(server.errorLogger);
}

type PatchFileRequest = FastifyRequest<{ Params: { id: string }; Body: string }>;

const patchFile = async (req: PatchFileRequest, reply: FastifyReply) => {
  const { headers, body } = req;

  if (headers['uncivserver-patch-key'] !== PATCH_KEY) {
    reply.status(403);
    tryLogSenderInfo(req, 'InvalidPatchKey');
    return '403 Forbidden!';
  }

  if (!validateBody(body)) {
    reply.status(400);
    tryLogSenderInfo(req, 'InvalidPatchBody');
    return 'Bad Request!';
  }

  saveFile(req, body);
  return '200 OK!';
};

export default patchFile;
