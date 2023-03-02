import fp from 'fastify-plugin';
import { mkdir, readFile, stat } from 'fs/promises';
import glob from 'glob';
import * as mime from 'mime-types';

// declare types
declare module 'fastify' {
  interface FastifyRequest {
    fileName: string;
  }
}

export default fp(
  async function (server) {
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

                  if (!uriPath.startsWith('/files')) {
                    server.cache.files
                      .set(uriPath, fileBody, { sec: Infinity })
                      .catch(server.errorLogger);
                    return;
                  }

                  // calculate expireAfter in milliseconds
                  const expireAfterMs = 1000 * server.expireAfter - (Date.now() - mtimeMs);
                  if (expireAfterMs > 0) {
                    server.cache.files
                      .set(uriPath, fileBody, { ms: ~~expireAfterMs })
                      .catch(server.errorLogger);
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
      // return if request is for auth
      if (req.url.startsWith('/auth')) {
        req.raw.headers['content-type'] = this.defaultType;
        return;
      }

      console.log('FileServer', req.url);

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

      if (req.method === 'GET' && !req.url.startsWith('/files/')) {
        // return cached file if available
        const cachedBody = await this.cache.files.get(req.url);
        if (cachedBody) return reply.send(cachedBody);

        try {
          const fileBody = await readFile(req.fileName);
          await this.cache.files.set(req.url, fileBody);
          return reply.send(fileBody);
        } catch (err: any) {
          if (err?.code !== 'ENOENT') this.errorLogger(err);
          return;
        }
      }
    });

    console.log('Loaded FileServer Plugin!');
  },
  {
    name: 'FileServer',
    dependencies: ['Constants', 'Redis'],
  }
);
