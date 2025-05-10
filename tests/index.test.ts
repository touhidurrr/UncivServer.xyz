import { MAX_FILE_SIZE, TEST_GAME_ID } from '@constants';
import { treaty } from '@elysiajs/eden';
import { app } from '@index';
import { getAppBaseURL, getRandomSave } from '@lib';
import cache from '@services/cache';
import db from '@services/mongodb';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { sep } from 'node:path';

const api = treaty(app, {
  onRequest: (_path, init) => {
    if (typeof init.body === 'string') {
      init.headers ??= {};
      //@ts-ignore
      init.headers['content-length'] = init.body.length;
    }
  },
});

const options = {
  headers: {
    authorization: `Basic ${Buffer.from(`${TEST_GAME_ID}:${Bun.env.SYNC_TOKEN}`).toString('base64')}`,
  },
};

test('GET /isalive', async () => {
  await api.isalive.get().then(({ status, data }) => {
    expect(status).toBe(200);
    expect(data).toStrictEqual({ authVersion: 1 });
  });
});

describe('GET /files', () => {
  test('Fail on Bad ID', async () => {
    await api
      .files({ gameId: 'bad-id' })
      .get()
      .then(({ status }) => {
        expect(status).toBe(422);
      });
  });

  test('Fail on Nonexistent ID', async () => {
    await api
      .files({ gameId: randomUUID() })
      .get()
      .then(({ status }) => {
        expect(status).toBe(404);
      });
  });
});

describe('PUT /files', () => {
  beforeAll(async () => {
    const result = await db.UncivGame.deleteMany({
      _id: { $in: [TEST_GAME_ID, `${TEST_GAME_ID}_Preview`] },
    });
    console.log('PUT /files beforeAll Result:', result);
  });

  test('Fail on Small File', async () => {
    await api
      .files({ gameId: TEST_GAME_ID })
      .put('test', options)
      .then(({ status }) => {
        expect(status).toBe(400);
      });
  });

  test('Fail on files larger than MAX_FILE_SIZE', async () => {
    await api
      .files({ gameId: TEST_GAME_ID })
      .put(getRandomSave(MAX_FILE_SIZE + 100), options)
      .then(({ status }) => {
        expect(status).toBe(413);
      });
  });

  describe('Good File', () => {
    const fileData = getRandomSave('100kb');

    test('Fail on Bad ID', async () => {
      await api
        .files({ gameId: 'bad-id' })
        .put(fileData, options)
        .then(({ status }) => {
          expect(status).toBe(422);
        });
    });

    test('Upload Success', async () => {
      await api
        .files({ gameId: TEST_GAME_ID })
        .put(fileData, options)
        .then(({ status, data }) => {
          expect(status).toBe(200);
          expect(data).toBeString();
          expect(data).toBe('Done!');
        });
    });

    test('Cache Hit', async () => {
      const cachedFile = await cache.get(TEST_GAME_ID);
      expect(cachedFile).toBeString();
      expect(cachedFile).toBe(fileData);
    });

    test('Can be found in GET /files', async () => {
      await api
        .files({ gameId: TEST_GAME_ID })
        .get()
        .then(({ status, data }) => {
          expect(status).toBe(200);
          expect(data).toBeString();
          expect(data).toBe(fileData);
        });
    });
  });
});

test('All static assets can be accessed', async () => {
  // make a list of paths
  const paths: string[] = [];
  const filenames = new Bun.Glob('public/**').scan({ onlyFiles: true });
  for await (const file of filenames) {
    const path = '/' + file.split(sep).slice(1).join('/');
    paths.push(path);
    if (path.endsWith('/index.html')) {
      paths.push(path.slice(0, -10));
    }
  }

  // test each path
  await Promise.all(
    paths.map(async path => {
      const res = await app.handle(new Request(`${getAppBaseURL()}${path}`));
      expect(res.status).toBe(200);
    })
  );
});

const getAuthHeaders = (uuid: string, password: string) => ({
  authorization: `Basic ${Buffer.from(`${uuid}:${password}`).toString('base64')}`,
});

describe('Auth', () => {
  const uuid = randomUUID();
  const password = '0'.repeat(6);

  afterAll(async () => {
    const result = await db.Auth.deleteOne({ _id: uuid });
    console.log('Auth afterAll Result:', result);
  });

  test('Initial GET /auth', async () => {
    const res = await api.auth.get({
      headers: getAuthHeaders(uuid, ''),
    });
    expect(res.status).toBe(204);
  });

  test('Initial PUT /auth', async () => {
    const res = await api.auth.put(password, {
      headers: getAuthHeaders(uuid, ''),
    });
    expect(res.status).toBe(200);
    expect(res.data).toBe('Successfully assigned a new password');
  });

  test('PUT /auth with no password', async () => {
    const res = await api.auth.put(password, {
      headers: getAuthHeaders(uuid, ''),
    });
    expect(res.status).toBe(401);
  });

  test('GET /auth with no password', async () => {
    const res = await api.auth.get({
      headers: getAuthHeaders(uuid, ''),
    });
    expect(res.status).toBe(401);
  });

  test('PUT /auth with wrong password', async () => {
    const res = await api.auth.put(password, {
      headers: getAuthHeaders(uuid, password + '1'),
    });
    expect(res.status).toBe(401);
  });

  test('GET /auth with wrong password', async () => {
    const res = await api.auth.get({
      headers: getAuthHeaders(uuid, password + '1'),
    });
    expect(res.status).toBe(401);
  });

  test('GET /auth with correct password', async () => {
    const res = await api.auth.get({
      headers: getAuthHeaders(uuid, password),
    });
    expect(res.status).toBe(200);
  });

  test('PUT /auth with correct password', async () => {
    const res = await api.auth.put(password + '1', {
      headers: getAuthHeaders(uuid, password),
    });
    expect(res.status).toBe(200);
    expect(res.data).toBe('Successfully updated password');
  });

  test('GET /auth with incorrect password after update', async () => {
    const res = await api.auth.get({
      headers: getAuthHeaders(uuid, password),
    });
    expect(res.status).toBe(401);
  });

  test('GET /auth with correct password after update', async () => {
    const res = await api.auth.get({
      headers: getAuthHeaders(uuid, password + '1'),
    });
    expect(res.status).toBe(200);
  });
});
