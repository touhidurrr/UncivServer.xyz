// import env vars
import * as dotenv from 'dotenv';
dotenv.config();

// import dependencies
// import * as bytes from 'bytes';
import Fastify, { type RouteShorthandOptions } from 'fastify';
import { readdir, rm, stat } from 'fs/promises';

// import plugins
import Constants from './plugins/Constants';
import FileServer from './plugins/FileServer';
import MongoDB from './plugins/MongoDB';
import Redis from './plugins/Redis';
import UncivDropbox from './plugins/UncivDropbox';

// import routes
import getFile from './routes/files/get';
import patchFile from './routes/files/patch';
import putFile from './routes/files/put';
// import deleteFile from './routes/files/delete';

// initialize fastify
const server = Fastify({
  logger: process.env.PRODUCTION !== 'true',
  // the default is 1 MB
  // bodyLimit: bytes.parse('1MB')!,
});

type FileRouteTypes = {
  Params: { id: string };
  Body: string;
  Response: string;
};

const FileRouteOpts: RouteShorthandOptions = {
  schema: {
    response: { type: 'string' },
    body: { type: 'string' },
  },
};

// register plugins
server.register(Constants);
server.register(UncivDropbox);
server.register(MongoDB);
server.register(Redis);
server.register(FileServer);

// register routes
server.get('/files/:id', { schema: { response: { type: 'string' } } }, getFile);
server.get('/isalive', async () => 'true');
server.put<FileRouteTypes>('/files/:id', FileRouteOpts, putFile);
server.patch<FileRouteTypes>('/files/:id', FileRouteOpts, patchFile);
// server.delete<FileRouteTypes>('/files/:id', FileRouteOpts, deleteFile);

// start server
const port: number = (process.env.PORT ?? 8080) as number;
const host: string = process.env.HOST ?? '0.0.0.0';
server.listen({ port, host }, function (err, address) {
  if (err) {
    server.errorLogger(err);
    process.exit(1);
  }
  console.log(`Server started on: ${address}`);
});

// global error handler
process.on('error', server.errorLogger);

// Periodical File Cleaner
server.ready(err => {
  const { publicDir, expireAfter, errorLogger } = server;
  if (err) errorLogger(err);
  const interval = 1000 * expireAfter;
  const filesDir = `${publicDir}/files`;
  setInterval(async () => {
    readdir(filesDir)
      .then(files => {
        console.log('Cached Files:', files.length);
        files.forEach(fileName => {
          const path = `${filesDir}/${fileName}`;
          stat(path)
            .then(({ mtimeMs }) => {
              if (Date.now() - mtimeMs > interval) {
                console.log('Removing cache for:', fileName);
                rm(path).catch(errorLogger);
              }
            })
            .catch(errorLogger);
        });
      })
      .catch(errorLogger);
  }, interval / 3);
});
