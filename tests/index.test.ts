import { MAX_FILE_SIZE, TEST_GAME_ID } from '@constants';
import { getAppBaseURL, getRandomBase64String, getRandomSave } from '@lib';
import cache from '@services/cache';
import db from '@services/mongodb';
import { pack } from '@services/uncivJSON';
import axios from 'axios';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';

import '@index';

const api = axios.create({
  baseURL: getAppBaseURL(),
  validateStatus: null,
  auth: {
    username: TEST_GAME_ID,
    password: process.env.SYNC_TOKEN ?? '',
  },
});

test.concurrent('GET /isalive', () =>
  api.get('/isalive').then(({ status, data }) => {
    expect(status).toBe(200);
    expect(data).toBeObject();
    expect(data).toStrictEqual({ authVersion: 1, chatVersion: 1 });
  })
);

describe.concurrent('GET /files', () => {
  test('Validation Error on Bad ID', async () => {
    const gameId = 'bad-id';
    const { status, data } = await api.get(`/files/${gameId}`);
    expect(status).toBe(422);
    expect(data).toMatchObject({
      type: 'validation',
      on: 'params',
      property: 'gameId',
    });
  });

  test('Fail on Nonexistent ID', async () => {
    const gameId = Bun.randomUUIDv7();
    const { status } = await api.get(`/files/${gameId}`);
    expect(status).toBe(404);
  });
});

describe.concurrent('PUT /files', () => {
  beforeAll(async () => {
    const testIds = [];
    for (const c of '0123456789abcde') {
      const id = TEST_GAME_ID.replaceAll('0', c);
      testIds.push(id);
      testIds.push(`${id}_Preview`);
    }
    const result = await db.UncivGame.deleteMany({ _id: { $in: testIds } });
    console.log('PUT /files beforeAll Result:', result);
  });

  test('Fail on Small File', async () => {
    const gameId = TEST_GAME_ID;
    const payload = 'test';
    const { status } = await api.put(`/files/${gameId}`, payload);
    expect(status).toBe(400);
  });

  test('Fail on Random Base64 Body', async () => {
    const gameId = TEST_GAME_ID;
    const payload = getRandomBase64String('100kb');
    const { status } = await api.put(`/files/${gameId}`, payload);
    expect(status).toBe(500);
  });

  test('Fail on Random Invalid Game Data', async () => {
    const gameId = TEST_GAME_ID;
    const payload = pack({ data: getRandomBase64String('100kb') });
    const { status } = await api.put(`/files/${gameId}`, payload);
    expect(status).toBe(500);
  });

  test('Fail on files larger than MAX_FILE_SIZE', async () => {
    const gameId = TEST_GAME_ID;
    const payload = getRandomSave(MAX_FILE_SIZE + 100);
    const { status } = await api.put(`/files/${gameId}`, payload);
    expect(status).toBe(413);
  });

  describe('Good File', () => {
    const payload = getRandomSave('100kb');

    test('Validation Error on Bad ID', async () => {
      const gameId = 'bad-id';
      const { status, data } = await api.put(`/files/${gameId}`, payload);
      expect(status).toBe(422);
      expect(data).toMatchObject({
        type: 'validation',
        on: 'params',
        property: 'gameId',
      });
    });

    test('Upload Success', async () => {
      const gameId = TEST_GAME_ID;
      const { status, data } = await api.put(`/files/${gameId}`, payload);
      expect(status).toBe(200);
      expect(data).toBeString();
      expect(data).toBe('Done!');
    });

    test.serial('Cache Hit', async () => {
      const cachedFile = await cache.get(TEST_GAME_ID);
      expect(cachedFile).toBeString();
      expect(cachedFile).toBe(payload);
    });

    test.serial('Can be found in GET /files', async () => {
      const gameId = TEST_GAME_ID;
      const { status, data } = await api.get(`/files/${gameId}`);
      expect(status).toBe(200);
      expect(data).toBeString();
      expect(data).toBe(payload);
    });
  });
});

test.concurrent('All pages can be accessed', async () => {
  const paths: string[] = ['/', '/tools', '/docs/bot/terms-of-service', '/docs/bot/privacy-policy'];

  // test each path
  await Promise.all(
    paths.map(async path => {
      const { status } = await api.get(path);
      expect(status).toBe(200);
    })
  );
});

describe.concurrent('Auth', () => {
  const username = Bun.randomUUIDv7();
  const password = '0'.repeat(6);

  afterAll(async () => {
    const result = await db.Auth.deleteOne({ _id: username });
    console.log('Auth afterAll Result:', result);
  });

  test('Initial GET /auth', async () => {
    const { data, status, headers } = await api.get('/auth', {
      auth: { username, password: '' },
    });
    expect(status).toBe(204);
    expect(data).toBe('');
    expect(Number(headers['content-length'])).toBe(0);
  });

  test.serial('Initial PUT /auth', async () => {
    const { status, data } = await api.put('/auth', password, {
      auth: { username, password: '' },
    });
    expect(status).toBe(200);
    expect(data).toBe('Successfully assigned a new password');
  });

  test('PUT /auth with no password', async () => {
    const { status } = await api.put('/auth', password, {
      auth: { username, password: '' },
    });
    expect(status).toBe(401);
  });

  test('GET /auth with no password', async () => {
    const { status } = await api.get('/auth', {
      auth: { username, password: '' },
    });
    expect(status).toBe(401);
  });

  test('PUT /auth with wrong password', async () => {
    const { status } = await api.put('/auth', password, {
      auth: { username, password: password + '1' },
    });
    expect(status).toBe(401);
  });

  test('GET /auth with wrong password', async () => {
    const { status } = await api.get('/auth', {
      auth: { username, password: password + '1' },
    });
    expect(status).toBe(401);
  });

  test('GET /auth with correct password', async () => {
    const { status } = await api.get('/auth', {
      auth: { username, password },
    });
    expect(status).toBe(200);
  });

  test.serial('PUT /auth with correct password', async () => {
    const { status, data } = await api.put('/auth', password + '1', {
      auth: { username, password },
    });
    expect(status).toBe(200);
    expect(data).toBe('Successfully updated password');
  });

  test('GET /auth with incorrect password after update', async () => {
    const { status } = await api.get('/auth', {
      auth: { username, password },
    });
    expect(status).toBe(401);
  });

  test('GET /auth with correct password after update', async () => {
    const { status } = await api.get('/auth', {
      auth: { username, password: password + '1' },
    });
    expect(status).toBe(200);
  });
});

describe.concurrent('GET /jsons', () => {
  const gameId = Bun.randomUUIDv7();
  const payload = getRandomSave('100kb', { gameId });

  beforeAll(() => api.put(`/files/${gameId}`, payload));
  afterAll(() =>
    Promise.all([
      cache.del(gameId),
      cache.del(`${gameId}_Preview`),
      db.UncivGame.deleteMany({ _id: { $in: [gameId, `${gameId}_Preview`] } }),
    ])
  );

  test('404 Not Found on Nonexistent ID', async () => {
    const { status, data, headers } = await api.get(`/jsons/${Bun.randomUUIDv7()}`);
    expect(status).toBe(404);
    expect(data).toBe('Not Found');
    expect(headers['content-type']).toBe('text/plain');
  });

  test('Valid JSON on Existing ID', async () => {
    const { status, data, headers } = await api.get(`/jsons/${gameId}`);
    expect(status).toBe(200);
    expect(data).toBeObject();
    expect(data).toMatchObject({ gameId });
    expect(headers['content-type']).toBe('application/json');
  });
});
