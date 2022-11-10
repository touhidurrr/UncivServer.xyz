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
  const { redis, filesDir, defaultType, expireAfter } = server;

  function populateFromDirectory(dirName: string, cache) {
    const sliceLength = dirName.length;

    glob(dirName + '/**', { nodir: true }, async (err, fileList) => {
      if (err) this.errorLogger(err);

      for (let fileName of fileList) {
        try {
          const fileBody = readFileSync(fileName);
          const uriPath = fileName.slice(sliceLength);
          await cache.set(uriPath, fileBody, { EX: expireAfter });
        } catch (err) {
          this.errorLogger(err);
        }
      }
    });
  }

  populateFromDirectory(filesDir, redis);

  // make directory 'files'
  mkdir(`${filesDir}/files`, err => err && server.errorLogger(err));

  server.addHook('onRequest', async function (req, reply) {
    // set default contentType if none is available
    if (!req.raw.headers['content-type']) {
      req.raw.headers['content-type'] = defaultType;
    }

    // set fileName & type
    // append 'index.html' if url ends with '/'
    req.fileName = filesDir + req.url;
    if (req.url.at(-1) === '/') {
      req.fileName += 'index.html';
    }

    // determine contentType from fileName
    reply.type(mime.lookup(req.fileName) || defaultType);

    if (req.method === 'GET') {
      // lookup in redis cache
      const cachedBody = await redis.get(req.url).catch(console.error);

      // if cache is found then return it
      if (cachedBody) {
        reply.send(cachedBody);
        return reply;
      }

      // if cache is in the local files
      if (existsSync(req.fileName)) {
        try {
          const fileBody = readFileSync(req.fileName);
          await this.redis.set(req.url, fileBody, { EX: expireAfter });
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
