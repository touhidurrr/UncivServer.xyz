import glob = require('glob');
import fp from 'fastify-plugin';
import * as mime from 'mime-types';
import { mkdir, readFile, stat, rm } from 'fs/promises';

// declare types
declare module 'fastify' {
  interface FastifyRequest {
    fileName: string;
  }
}

export default fp(async function (server) {
  // populate cache from 'public' directory once
  (function populateFromDirectory() {
    const sliceLength = server.publicDir.length;

    glob(server.publicDir + '/**', { nodir: true }, async (err, fileList) => {
      if (err) server.errorLogger(err);

      fileList.forEach(fileSrc => {
        readFile(fileSrc)
          .then(fileBody => {
            stat(fileSrc)
              .then(({ mtimeMs }) => {
                const uriPath = fileSrc.slice(sliceLength);
                // calculate expireAfter in milliseconds
                const expireAfterMs = 1000 * server.expireAfter - (Date.now() - mtimeMs);
                if (expireAfterMs > 0) {
                  server.redis
                    .set(uriPath, fileBody, { PX: expireAfterMs })
                    .catch(server.errorLogger);
                } else {
                  const fileName = uriPath.slice(1);
                  console.log('Removing cache for:', fileName);
                  rm(fileSrc).catch(server.errorLogger);
                }
              })
              .catch(server.errorLogger);
          })
          .catch(server.errorLogger);
      });
    });
  })();

  // make directory 'files'
  mkdir(`${server.publicDir}/files`).catch(server.errorLogger);

  server.addHook('onRequest', async function (req, reply) {
    // set default contentType if none is available
    // or the app sends some silly header in PUT requests
    if (!req.raw.headers['content-type'] || req.method === 'PUT') {
      req.raw.headers['content-type'] = this.defaultType;
    }

    // set fileName & type
    // append 'index.html' if url ends with '/'
    req.fileName = this.publicDir + req.url;
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

      // this serves files from publicDir
      if (!req.url.startsWith('/files/')) {
        try {
          const fileBody = await readFile(req.fileName);
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
