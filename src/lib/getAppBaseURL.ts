import { DEFAULT_PORT } from '@constants';
import { hostname } from 'node:os';

export function getAppBaseURL() {
  return `http://${hostname()}:${DEFAULT_PORT}` as const;
}
