import * as argon2 from 'argon2';
import type { FastifyRequest } from 'fastify/types/request';

const idRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;

const putAuth = async (req: FastifyRequest<{ Body: string }>) => {
  const { userId, body, server } = req;
  const newPassword = Buffer.from(body, 'base64').toString('utf8');
  const hash = await argon2.hash(newPassword);

  const isClientId = idRegex.test(userId!);
  await Promise.all([
    server.cache.auth.set(userId!, hash),
    server.db.Auth.updateOne(
      { _id: userId },
      { $set: { hash, type: isClientId ? 'client' : 'discord', timestamp: Date.now() } },
      { upsert: true }
    ),
  ]);
  return '200 OK!';
};

export default putAuth;
