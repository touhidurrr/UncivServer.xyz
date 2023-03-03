import * as argon2 from 'argon2';
import type { FastifyReply } from 'fastify/types/reply';
import type { FastifyRequest } from 'fastify/types/request';
import { errorLogger } from '../../plugins/Constants';
const { Servers, PATCH_KEY } = process.env;

const idRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;

const ServerList = Servers!.split(/[\n\s]+/);
function sendHashToOtherServers(userId: string, hash: string) {
  ServerList.length &&
    ServerList.forEach(api => {
      fetch(`${api}/auth`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'uncivserver-patch-key': PATCH_KEY!,
        },
        body: JSON.stringify({ userId, hash }),
      }).catch(errorLogger);
    });
}

const putAuth = async (req: FastifyRequest<{ Body: string }>, reply: FastifyReply) => {
  const userAgent = req.headers['user-agent'] ?? "";
  const buildNumber = +userAgent.match(/(?<=\(build )\d+/i);
  if (buildNumber < 825) {
    return reply.code(426).send('426 Upgrade Required!'
           + '\nYou need Unciv 4.5.2 or above to set passwords.');
  }

  const { userId, body, server } = req;
  const newPassword = Buffer.from(body, 'base64').toString('utf8');
  const hash = await argon2.hash(newPassword);
  sendHashToOtherServers(userId!, hash);

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
