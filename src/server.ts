// import env vars
import * as dotenv from 'dotenv';
dotenv.config();

// import dependencies
import Fastify from 'fastify';
import * as bytes from 'bytes';
import { readdir, rm, stat } from 'fs';

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
const errorLogger = e => console.error(e.stack);

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
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server running on; ${address}`);
});

// Periodical File Cleaner
const interval = 15 * 60 * 1000; // 15 minutes
setInterval(async () => {
  readdir('files', async (err, files) => {
    if (err) errorLogger(err);
    console.log('Cached Files:', files.length);
    files.forEach(async fileName => {
      const path = `files/${fileName}`;
      stat(path, async (err, { mtimeMs }) => {
        if (err) errorLogger(err);
        if (Date.now() - mtimeMs > interval) {
          console.log('Removing cache for:', fileName);
          rm(path, async err => err && errorLogger(err));
        }
      });
    });
  });
}, interval / 3);

// error handler
process.on('error', errorLogger);
