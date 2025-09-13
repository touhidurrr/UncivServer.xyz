import { getAppBaseURL, getRandomSave } from '@lib';
import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import db from '@services/mongodb';
import axios from 'axios';
import { afterAll, describe, expect, test } from 'bun:test';
import { parse as parseCacheControl } from 'cache-control-parser';
import { z } from 'zod';

import '@index';

const api = axios.create({
  baseURL: getAppBaseURL(),
  validateStatus: null,
});

const { SYNC_TOKEN } = process.env;
if (!SYNC_TOKEN) {
  throw 'No Sync Token Found!';
}

const getSyncWSClient = (token: string) =>
  //@ts-ignore: perMessageDeflate pull request is pending
  new WebSocket(`${getAppBaseURL()}/sync`, {
    headers: { Authorization: `Bearer ${token}` },
    perMessageDeflate: true,
  });

test('Cache Control', async () => {
  const { headers } = await api.get('/sync', {
    headers: {
      connection: 'upgrade',
      upgrade: 'websocket',
      authorization: `Bearer Test`,
    },
  });

  expect.hasAssertions();
  const ccHeaders = headers['cache-control'];
  if (typeof ccHeaders !== 'string') return;

  expect(ccHeaders).toBeString();
  const cacheControl = parseCacheControl(ccHeaders);
  expect(cacheControl).toBeObject();
  expect(cacheControl['no-store']).toBeTrue();
  expect(cacheControl['no-cache']).toBeTrue();
});

describe('Token', () => {
  test('Rejects No Token', async () => {
    const promise = new Promise((res, rej) => {
      try {
        const ws = getSyncWSClient('');
        ws.addEventListener('open', () => Bun.sleep(1000).then(() => res('Done')));
        ws.addEventListener('message', ({ data }) => {
          const msg = JSON.parse(data.toString('utf8')) as z.infer<typeof SYNC_RESPONSE_SCHEMA>;
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
          const msg = JSON.parse(data.toString('utf8')) as z.infer<typeof SYNC_RESPONSE_SCHEMA>;
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
          const msg = JSON.parse(data.toString('utf8')) as z.infer<typeof SYNC_RESPONSE_SCHEMA>;
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
          const msg = JSON.parse(data.toString('utf8')) as z.infer<typeof SYNC_RESPONSE_SCHEMA>;
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
  const gameId = Bun.randomUUIDv7();
  const userId = Bun.randomUUIDv7();
  const payload = getRandomSave('1kb', { gameId, userId });

  afterAll(() =>
    db.UncivGame.deleteMany({
      _id: { $in: [gameId, `${gameId}_Preview`] },
    })
  );

  const putFile = (isPreview: boolean = false) =>
    api
      .put(`/files/${gameId + (isPreview ? '_Preview' : '')}`, payload, {
        auth: {
          username: userId,
          password: '',
        },
      })
      .then(({ status }) => expect(status).toBe(200));

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
      const msg = JSON.parse(data.toString('utf8')) as z.infer<typeof SYNC_RESPONSE_SCHEMA>;

      if (msg.type === 'SyncData') {
        switch (msg.data.gameId) {
          case gameId:
            receivedData = true;
            break;
          case `${gameId}_Preview`:
            receivedPreview = true;
            break;
          default:
            return;
        }

        expect(msg.data.content).toBe(payload);
        if (receivedData && receivedPreview) resolve('Done!');
      }
    });

    ws.addEventListener('close', () => reject('Connection Closed'));
    ws.addEventListener('error', reject);
  });

  await expect(promise).resolves.toBeTruthy();
  expect(receivedData).toBeTrue();
  expect(receivedPreview).toBeTrue();
});
