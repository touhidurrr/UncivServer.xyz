import Dropbox from '../modules/Dropbox';
// import { Dropbox } from 'dropbox';
import fp from 'fastify-plugin';

// declare types
declare module 'fastify' {
  interface FastifyInstance {
    UncivDropbox: typeof Dropbox;
  }
}

// Experimentail Dropbox SDK Usage
/*
const dropbox = new Dropbox({
  accessToken: 'LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
});

const UncivDropbox = {
  delete(gameFileName: string) {
    dropbox
      .filesDeleteV2({ path: `/MultiplayerGames/${gameFileName}` })
      .then(res => console.log('Dropbox Response:', res))
      .catch(err => console.log('Dropbox Error:', err));
  },
  // because I couldn't figure out dropbox sdk
  upload(gameFileName: string, data: string) {
    //@ts-ignore
    fetch('https://content.dropboxapi.com/2/files/upload', {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': `{"mode":"overwrite","path":"/MultiplayerGames/${gameFileName}"}`,
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
      method: 'POST',
      
      data,
    })
      .then(res => res.json())
      .then(json => console.log('Dropbox Response:', json))
      .catch(e => console.error(e.stack));
  },
  download(gameFileName: string) {
    return new Promise((res, rej) => {
      dropbox
        .filesDownload({ path: `/MultiplayerGames/${gameFileName}` })
        .then(res => {
          //@ts-ignore
          console.dir(res.result.fileBinary.toString('utf8'), { depth: null });
        })
        .catch(err => {
          console.error(err);
          res(null);
        });
    });
  },
};
*/

export default fp(async function (server) {
  server.decorate('UncivDropbox', Dropbox);
});
