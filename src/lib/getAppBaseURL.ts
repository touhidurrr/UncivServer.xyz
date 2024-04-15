import { hostname } from 'node:os';
import { DEFAULT_PORT } from '@constants';

export function getAppBaseURL() {
  return `http://${hostname()}:${DEFAULT_PORT}` as const;
}
