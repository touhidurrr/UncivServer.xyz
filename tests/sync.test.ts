import { TEST_GAME_ID } from '@constants';
import '@index';
import { getAppBaseURL } from '@lib';
import { getRandomBase64String } from '@lib/getRandomBase64String';
import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import { describe, expect, test } from 'bun:test';
import { parse as parseCacheControl } from 'cache-control-parser';
import type { Static } from 'elysia';

const { SYNC_TOKEN } = process.env;
if (!SYNC_TOKEN) {
  throw 'No Sync Token Found!';
}

const getSyncWSClient = (token: string) =>
  new WebSocket(`${getAppBaseURL()}/sync`, {
    headers: { Authorization: `Bearer ${token}` },
    //@ts-ignore
    perMessageDeflate: true,
  });

test('Cache Control', async () =>
  await fetch(`${getAppBaseURL()}/sync`, {
    headers: {
      connection: 'upgrade',
      upgrade: 'websocket',
      authorization: `Bearer Test`,
    },
  }).then(res => {
    const ccHeaders = res.headers.get('cache-control');
    expect(ccHeaders).not.toBeNull();
    const cacheControl = parseCacheControl(ccHeaders!);
    expect(cacheControl).toBeObject();
    expect(cacheControl['no-store']).toBeTrue();
    expect(cacheControl['no-cache']).toBeTrue();
  }));

describe('Token', () => {
  test('Rejects No Token', async () => {
    const promise = new Promise((res, rej) => {
      try {
        const ws = getSyncWSClient('');
        ws.addEventListener('open', () => Bun.sleep(1000).then(() => res('Done')));
        ws.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data.toString('utf8')) as Static<typeof SYNC_RESPONSE_SCHEMA>;
          if (msg.type === 'AuthError') {
            rej('AuthError');
            ws.close();
          } else res('Done!');
        });
        ws.addEventListener('close', rej);
      } catch (err) {
        rej(err);
      }
    });
    await expect(promise).rejects.toThrow();
  });

  test('Rejects Empty Token', async () => {
    const promise = new Promise((res, rej) => {
      try {
        const ws = getSyncWSClient('Bearer ');
        ws.addEventListener('open', () => Bun.sleep(1000).then(() => res('Done')));
        ws.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data.toString('utf8')) as Static<typeof SYNC_RESPONSE_SCHEMA>;
          if (msg.type === 'AuthError') {
            rej('AuthError');
            ws.close();
          } else res('Done!');
        });
        ws.addEventListener('close', rej);
      } catch (err) {
        rej(err);
      }
    });
    await expect(promise).rejects.toThrow();
  });

  test('Rejects Token on Mismatch', async () => {
    const promise = new Promise((res, rej) => {
      try {
        const ws = getSyncWSClient('Bearer Mismatch');
        ws.addEventListener('open', () => Bun.sleep(1000).then(() => res('Done')));
        ws.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data.toString('utf8')) as Static<typeof SYNC_RESPONSE_SCHEMA>;
          if (msg.type === 'AuthError') {
            rej('AuthError');
            ws.close();
          } else res('Done!');
        });
        ws.addEventListener('close', rej);
      } catch (err) {
        rej(err);
      }
    });
    await expect(promise).rejects.toThrow();
  });

  test('Accepts Good Token', async () => {
    const promise = new Promise((res, rej) => {
      try {
        const ws = getSyncWSClient(SYNC_TOKEN);
        ws.addEventListener('open', () => Bun.sleep(1000).then(() => res('Done')));
        ws.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data.toString('utf8')) as Static<typeof SYNC_RESPONSE_SCHEMA>;
          if (msg.type === 'AuthError') {
            rej('AuthError');
            ws.close();
          } else res('Done!');
        });
        ws.addEventListener('close', rej);
      } catch (err) {
        rej(err);
      }
    });
    await expect(promise).resolves.toBeTruthy();
  });
});

test('Uploaded files are relayed properly', async () => {
  const url = `${getAppBaseURL()}/files/${TEST_GAME_ID}`;
  const fileData = getRandomBase64String('1kb');

  const putFile = (isPreview: boolean = false) =>
    fetch(url + (isPreview ? '_Preview' : ''), {
      method: 'PUT',
      body: fileData,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': fileData.length.toString(),
      },
    }).catch(console.error);

  let receivedData = false;
  let receivedPreview = false;

  const promise = new Promise((resolve, reject) => {
    const ws = getSyncWSClient(SYNC_TOKEN);

    ws.addEventListener('open', () => {
      putFile();
      putFile(true);
      Bun.sleep(5_000).then(() => reject('Timeout'));
    });

    ws.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data.toString('utf8')) as Static<typeof SYNC_RESPONSE_SCHEMA>;

      if (msg.type === 'SyncData') {
        if (msg.data.content !== fileData) {
          expect(msg.data.content).toBe(fileData);
          reject('Data Mismatch');
          return;
        }

        if (msg.data.gameId === TEST_GAME_ID) {
          receivedData = true;
        } else if (msg.data.gameId === TEST_GAME_ID + '_Preview') {
          receivedPreview = true;
        } else reject('Unknown Game ID');

        if (receivedData && receivedPreview) resolve('Done!');
      } else reject('Unknown Message Type');
    });

    ws.addEventListener('close', () => reject('Connection Closed'));
    ws.addEventListener('error', reject);
  });

  await expect(promise).resolves.toBeTruthy();
  expect(receivedData).toBeTrue();
  expect(receivedPreview).toBeTrue();
});
