import { DEFAULT_PORT } from '@constants';
import { hostname } from 'node:os';
import { isIPv6 } from 'node:net';

const host = process.env.HOST ?? hostname();
const port = process.env.PORT ?? DEFAULT_PORT;
const name = isIPv6(host) ? `[${host}]` : host;
export const getAppBaseURL = () => `http://${name}:${port}` as const;
