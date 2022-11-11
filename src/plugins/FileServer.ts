import glob = require('glob');
import fp from 'fastify-plugin';
import * as mime from 'mime-types';
import { existsSync, mkdir, readFileSync } from 'fs';

// declare types
declare module 'fastify' {
  interface FastifyRequest {
    fileName: string;
  }
}

export default fp(async function (server) {
  // populate cache from 'public' directory once
  (function populateFromDirectory() {
    const sliceLength = server.filesDir.length;

    glob(server.filesDir + '/**', { nodir: true }, async (err, fileList) => {
      if (err) server.errorLogger(err);

      for (let fileName of fileList) {
        try {
          const fileBody = readFileSync(fileName);
          const uriPath = fileName.slice(sliceLength);
          await server.redis.set(uriPath, fileBody, { EX: server.expireAfter });
        } catch (err) {
          server.errorLogger(err);
        }
      }
    });
  })();

  // make directory 'files'
  mkdir(`${server.filesDir}/files`, err => err && server.errorLogger(err));

  server.addHook('onRequest', async function (req, reply) {
    // set default contentType if none is available
    // or the app sends some silly header in PUT requests
    if (!req.raw.headers['content-type'] || req.method === 'PUT') {
      req.raw.headers['content-type'] = this.defaultType;
    }

    // set fileName & type
    // append 'index.html' if url ends with '/'
    req.fileName = this.filesDir + req.url;
    if (req.url.at(-1) === '/') {
      req.fileName += 'index.html';
    }

    // determine contentType from fileName
    reply.type(mime.lookup(req.fileName) || this.defaultType);

    if (req.method === 'GET') {
      // lookup in redis cache
      const cachedBody = await this.redis.get(req.url).catch(this.errorLogger);

      // if cache is found then return it
      if (cachedBody) {
        reply.send(cachedBody);
        return reply;
      }

      // if cache is in the local files
      if (!req.url.startsWith('/files/') && existsSync(req.fileName)) {
        try {
          const fileBody = readFileSync(req.fileName);
          await this.redis.set(req.url, fileBody, { EX: this.expireAfter });
          reply.send(fileBody);
          return reply;
        } catch (err) {
          this.errorLogger(err);
        }
      }
    }
  });

  console.log('Loaded FileServer Plugin!');
});
