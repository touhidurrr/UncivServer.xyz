import type { FastifyReply } from 'fastify/types/reply';
import type { FastifyRequest } from 'fastify/types/request';
import { tryLogSenderInfo } from '../../modules/Validation';
import type { AuthPatchType } from '../../server';
const { PATCH_KEY } = process.env;

const patchAuth = async (req: FastifyRequest<AuthPatchType>, reply: FastifyReply) => {
  const {
    headers,
    server,
    body: { userId, hash },
  } = req;

  if (headers['uncivserver-patch-key'] !== PATCH_KEY) {
    tryLogSenderInfo(req, 'InvalidPatchKey');
    return reply.code(403).send('403 Forbidden!');
  }

  await server.cache.auth.set(userId, hash);
  return '200 OK!';
};

export default patchAuth;
