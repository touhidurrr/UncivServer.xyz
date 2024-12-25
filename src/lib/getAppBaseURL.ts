import { DEFAULT_PORT } from '@constants';
import { hostname } from 'node:os';

const host = process.env.HOST ?? hostname();
const port = process.env.PORT ?? DEFAULT_PORT;
export const getAppBaseURL = () => `http://${host}:${port}` as const;
