import * as mime from 'mime-types';
import fp from 'fastify-plugin';

// declare types
declare module 'fastify' {
  interface FastifyInstance {
    filesDir: string;
    expireAfter: number;
    defaultType: string;
    gameFileRegex: RegExp;
    errorLogger: typeof errorLogger;
  }
}

// constants
const filesDir = 'public';
const expireAfter = 15 * 60; // expiration in seconds
const errorLogger = e => e && console.error(e?.stack);
const defaultType = mime.contentType('text/plain') as string;
const gameFileRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/;

export default fp(async function (server) {
  server.decorate('filesDir', filesDir);
  server.decorate('expireAfter', expireAfter);
  server.decorate('defaultType', defaultType);
  server.decorate('errorLogger', errorLogger);
  server.decorate('gameFileRegex', gameFileRegex);
});
