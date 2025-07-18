import { DEFAULT_HOST, DEFAULT_PORT } from '@constants';
import { isIPv6 } from 'node:net';

export const getAppBaseURL = (config?: { host?: string; port?: string | number }) => {
  const host = config?.host ?? process.env.HOST ?? DEFAULT_HOST;
  const port = config?.port ?? process.env.PORT ?? DEFAULT_PORT;
  const name = isIPv6(host) ? `[${host}]` : host;
  return `http://${name}:${port}` as const;
};
