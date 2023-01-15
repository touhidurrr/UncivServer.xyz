import type _fetch from 'node-fetch';

declare global {
  var fetch: typeof _fetch;
}
