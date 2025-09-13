import {
  IS_ALIVE,
  START_TEST_FETCH_RETRY_INTERVAL,
  START_TEST_FETCH_TIMEOUT,
  START_TEST_TIMEOUT,
} from '@constants';
import { getAppBaseURL } from '@lib/getAppBaseURL';
import axios from 'axios';
import { describe, expect, test } from 'bun:test';
import { dirname } from 'node:path';
import { randInt } from 'randomcryp';

describe('App Start Test', () => {
  const port = randInt(10_000, 65_535);
  const proc = Bun.spawn(['bun', 'start'], {
    stdout: Bun.stdout,
    cwd: dirname(__dirname),
    env: {
      ...Bun.env,
      PORT: port.toString(),
      NODE_ENV: 'production',
    },
  });

  const api = axios.create({
    baseURL: getAppBaseURL({ port }),
    timeout: START_TEST_FETCH_TIMEOUT,
  });

  test(
    'wait till GET /isalive is { authVersion: 1, chatVersion: 1 }',
    async () => {
      while (!proc.killed) {
        try {
          const { data } = await api.get('/isalive');
          if (data) {
            expect(data).toStrictEqual(IS_ALIVE);
            break;
          }
          await Bun.sleep(START_TEST_FETCH_RETRY_INTERVAL);
        } catch {}
      }
    },
    START_TEST_TIMEOUT
  );

  test('GET / is found', async () => {
    let res = await api.get('');

    for (let i = 0; i < 10; ++i) {
      if (res.status === 200) break;
      await Bun.sleep(START_TEST_FETCH_RETRY_INTERVAL);

      res = await api.get('');
      console.log('status', res.status);
    }

    expect(res.status).toBe(200);
  });

  test('App is still running', () => {
    expect(proc.killed).toBeFalse();
    proc.kill();
  });
});
