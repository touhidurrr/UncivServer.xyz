// import env vars
import 'dotenv/config';

// import dependencies
// import * as bytes from 'bytes';
import Fastify, { type RouteShorthandOptions } from 'fastify';
import { readdir, rm, stat } from 'fs/promises';

// import plugins
import Auth from './plugins/Auth';
import Constants, { isAliveText } from './plugins/Constants';
import FileServer from './plugins/FileServer';
import MongoDB from './plugins/MongoDB';
import Redis from './plugins/Redis';

// import routes
import getAuth from './routes/auth/get';
import patchAuth from './routes/auth/patch';
import putAuth from './routes/auth/put';
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

export type FileRouteType = {
  Params: { id: string };
  Body: string;
  Response: string;
};

const FileRouteOpts: RouteShorthandOptions = {
  schema: {
    body: { type: 'string' },
  },
};

export type AuthPatchType = {
  Body: { userId: string; hash: string };
  Response: string;
};

const AuthPatchOpts: RouteShorthandOptions = {
  schema: {
    body: { type: 'object', properties: { userId: { type: 'string' }, hash: { type: 'string' } } },
  },
};

// register plugins
server.register(Constants);
server.register(MongoDB);
server.register(Redis);
server.register(FileServer);
server.register(Auth);

// register routes
server.get('/files/:id', getFile);
server.get('/isalive', async () => isAliveText);
server.put<FileRouteType>('/files/:id', FileRouteOpts, putFile);
server.patch<FileRouteType>('/files/:id', FileRouteOpts, patchFile);
// server.delete<FileRouteTypes>('/files/:id', FileRouteOpts, deleteFile);
server.get('/auth', getAuth);
server.put('/auth', putAuth);
server.patch<AuthPatchType>('/auth', AuthPatchOpts, patchAuth);

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
process.on('error', e => e && console.error(e?.stack));

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
