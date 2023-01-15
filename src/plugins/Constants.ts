import fp from 'fastify-plugin';
import * as mime from 'mime-types';

// declare types
declare module 'fastify' {
  interface FastifyInstance {
    publicDir: string;
    expireAfter: number;
    defaultType: string;
    gameFileRegex: RegExp;
    errorLogger: typeof errorLogger;
  }
}

// constants
const publicDir = 'public';
const expireAfter = 15 * 60; // expiration in seconds
const defaultType = mime.contentType('text/plain') as string;
const gameFileRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/;
const errorLogger = (e: any) => e && console.error(e?.stack);

export default fp(async function (server) {
  server.decorate('publicDir', publicDir);
  server.decorate('expireAfter', expireAfter);
  server.decorate('defaultType', defaultType);
  server.decorate('errorLogger', errorLogger);
  server.decorate('gameFileRegex', gameFileRegex);
});
