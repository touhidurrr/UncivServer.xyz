// import env vars
import * as dotenv from 'dotenv';
dotenv.config();

// import dependencies
import Fastify from 'fastify';
import * as bytes from 'bytes';
import { readdir, rm, stat } from 'fs/promises';

// import plugins
import Redis from './plugins/Redis';
import MongoDB from './plugins/MongoDB';
import Constants from './plugins/Constants';
import FileServer from './plugins/FileServer';
import UncivDropbox from './plugins/UncivDropbox';

// import routes
import getFile from './routes/files/get';
import putFile from './routes/files/put';
import patchFile from './routes/files/patch';
import deleteFile from './routes/files/delete';

// errorLogger
const errorLogger = e => e && console.error(e?.stack);

// initialize fastify
const server = Fastify({
  logger: process.env.PRODUCTION !== 'true',
  // the default is 1 MB
  // bodyLimit: bytes.parse('1MB')!,
});

// register plugins
server.register(Constants);
server.register(UncivDropbox);
server.register(MongoDB);
server.register(Redis);
server.register(FileServer);

// register routes
server.get('/files/:id', getFile);
server.get('/isalive', async () => 'true');
server.put('/files/:id', putFile);
server.patch('/files/:id', patchFile);
server.delete('/files/:id', deleteFile);

// start server
const port: number = (process.env.PORT || 8080) as number;
const host: string = process.env.HOST || '0.0.0.0';
server.listen({ port, host }, function (err, address) {
  if (err) {
    server.errorLogger(err);
    process.exit(1);
  }
  console.log(`Server started on: ${address}`);
});

// global error handler
process.on('error', errorLogger);

// Periodical File Cleaner
server.ready(err => {
  if (err) errorLogger(err);
  const interval = 1000 * server.expireAfter;
  const filesDir = `${server.publicDir}/files`;
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
