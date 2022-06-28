module.exports = {
  async download(fileName) {
    let res = fetch('https://content.dropboxapi.com/2/files/download', {
      headers: {
        'Dropbox-API-Arg': `{"path":"/MultiplayerGames/${fileName}"}`,
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
    }).catch(e => console.error(e.stack));

    const data = await res.text();

    // Log Dropbox Response
    console.log('Dropbox Status:', res.status);
    if (!res.ok) {
      console.log('Dropbox Data:', !data.startsWith('{') ? data : JSON.parse(data));
      res.sendStatus(404);
      return null;
    }

    return data;
  },
  async upload(fileName, fileData) {
    await fetch('https://content.dropboxapi.com/2/files/upload', {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': `{"mode":"overwrite","path":"/MultiplayerGames/${fileName}"}`,
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
      method: 'POST',
      data: fileData,
    })
      .then(async res => console.log(res.status, await res.text()))
      .catch(e => console.error(e.stack));
  },
  async delete(fileName) {
    await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer LTdBbopPUQ0AAAAAAAACxh4_Qd1eVMM7IBK3ULV3BgxzWZDMfhmgFbuUNF_rXQWb',
      },
      method: 'POST',
      data: `{"path":"/MultiplayerGames/${fileName}"}`,
    })
      .then(async res => console.log(res.status, await res.text()))
      .catch(e => console.error(e.stack));
  },
};
