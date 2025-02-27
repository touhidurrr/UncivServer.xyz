import { MAX_FILE_SIZE, TEST_GAME_ID } from '@constants';
import { treaty } from '@elysiajs/eden';
import { app } from '@index';
import { getAppBaseURL, getRandomSave } from '@lib';
import cache from '@services/cache';
import { describe, expect, test } from 'bun:test';
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

test('GET /isalive', async () => {
  await api.isalive.get().then(({ status, data }) => {
    expect(status).toBe(200);
    expect(data).toBe(true);
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
  test('Fail on Small File', async () => {
    await api
      .files({ gameId: TEST_GAME_ID })
      .put('test')
      .then(({ status }) => {
        expect(status).toBe(400);
      });
  });

  test('Fail on files larger than MAX_FILE_SIZE', async () => {
    await api
      .files({ gameId: TEST_GAME_ID })
      .put(getRandomSave(MAX_FILE_SIZE + 1))
      .then(({ status }) => {
        expect(status).toBe(413);
      });
  });

  describe('Good File', () => {
    const fileData = getRandomSave('100kb');

    test('Fail on Bad ID', async () => {
      await api
        .files({ gameId: 'bad-id' })
        .put(fileData)
        .then(({ status }) => {
          expect(status).toBe(422);
        });
    });

    test('Upload Success', async () => {
      await api
        .files({ gameId: TEST_GAME_ID })
        .put(fileData)
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
