import { MAX_FILE_SIZE, TEST_GAME_ID } from '@constants';
import { treaty } from '@elysiajs/eden';
import { app } from '@index';
import { getRandomBase64String } from '@lib/getRandomBase64String';
import cache from '@services/cache';
import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import type { CachedGame } from '../src/models/cache';

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

describe('PATCH /files', () => {
  const cachedGame: CachedGame = {
    text: getRandomBase64String('100kb'),
    timestamp: Date.now(),
  };
  const Authorization = `Bearer ${process.env.SYNC_TOKEN}`;

  test('Upload Success', async () => {
    await api
      .files({ gameId: TEST_GAME_ID })
      .patch(cachedGame, { headers: { Authorization } })
      .then(({ status, data }) => {
        expect(status).toBe(200);
        expect(data).toBeString();
        expect(data).toBe('Done!');
      });
  });

  test('Cache Hit', async () => {
    const game = await cache.get(TEST_GAME_ID);
    expect(game).toBeObject();
    expect(game).toEqual(cachedGame);
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

  test('Fail on Big File', async () => {
    await api
      .files({ gameId: TEST_GAME_ID })
      .put(getRandomBase64String(MAX_FILE_SIZE + 1))
      .then(({ status }) => {
        expect(status).toBe(413);
      });
  });

  describe('Good File', () => {
    const fileData = getRandomBase64String('100kb');

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
      const cachedGame = await cache.get(TEST_GAME_ID);
      expect(cachedGame).toBeObject();
      expect(cachedGame).toContainAllKeys(['text', 'timestamp']);
      expect(cachedGame!.timestamp).toBeNumber();
      expect(cachedGame!.text).toBe(fileData);
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
