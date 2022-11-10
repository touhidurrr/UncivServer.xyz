import { type Response } from 'node-fetch';

export default {
  async download(gameFileName) {
    let res = (await fetch('https://content.dropboxapi.com/2/files/download', {
      headers: {
        'Dropbox-API-Arg': `{"path":"/MultiplayerGames/${gameFileName}"}`,
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
    }).catch(e => console.error(e.stack))) as Response;

    // Log Dropbox Response
    console.log('Dropbox Status:', res.status);
    if (!res.ok) {
      console.log('Dropbox Data:', await res.json());
      return null;
    }

    return await res.text();
  },
  async upload(gameFileName, data) {
    await fetch('https://content.dropboxapi.com/2/files/upload', {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': `{"mode":"overwrite","path":"/MultiplayerGames/${gameFileName}"}`,
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
      method: 'POST',
      body: data,
    })
      .then(async res => console.log(res.status, await res.json()))
      .catch(e => console.error(e.stack));
  },
  async delete(gameFileName) {
    await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
      method: 'POST',
      body: `{"path":"/MultiplayerGames/${gameFileName}"}`,
    })
      .then(async res => console.log(res.status, await res.json()))
      .catch(e => console.error(e.stack));
  },
};
