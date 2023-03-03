import type { FastifyRequest } from 'fastify/types/request';
import isBase64 from 'is-base64';
import { gunzipSync } from 'zlib';

export function validateBody(body: string) {
  if (!body || body.length < 50 || !isBase64(body)) {
    return false;
  }
  try {
    const jsonText = gunzipSync(Buffer.from(body, 'base64')).toString();
    return jsonText.startsWith('{');
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function tryLogSenderInfo(
  req: FastifyRequest,
  type: 'InvalidPatchBody' | 'InvalidPatchKey'
) {
  const { server, ip, hostname, protocol, url, fileName, headers } = req;
  await server.db.ErrorLogs.insertOne({
    type,
    timestamp: Date.now(),
    data: {
      ip,
      url,
      protocol,
      hostname,
      fileName,
      headers,
    },
  }).catch(server.errorLogger);
}
