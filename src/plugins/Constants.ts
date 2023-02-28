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
    authVersion: typeof authVersion;
    isAliveText: typeof isAliveText;
  }
}

// constants
export const publicDir = 'public';
export const expireAfter = 15 * 60; // expiration in seconds
export const defaultType = mime.contentType('text/plain') as string;
export const gameFileRegex = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/;
export const errorLogger = (e: any): void => e && console.error(e?.stack);

export const authVersion = 1 as const;
export const isAliveText = JSON.stringify({
  authVersion: 1,
}) as `{"authVersion":${typeof authVersion}}`;

export default fp(async function (server) {
  server.decorate('publicDir', publicDir);
  server.decorate('expireAfter', expireAfter);
  server.decorate('defaultType', defaultType);
  server.decorate('errorLogger', errorLogger);
  server.decorate('gameFileRegex', gameFileRegex);
  server.decorate('authVersion', authVersion);
  server.decorate('isAliveText', isAliveText);
});
