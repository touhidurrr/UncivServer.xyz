import { DEFAULT_PORT } from '@constants';
import { hostname } from 'node:os';

export const getAppBaseURL = () => `http://${hostname()}:${DEFAULT_PORT}` as const;
