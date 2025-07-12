import {
  START_TEST_FETCH_RETRY_INTERVAL,
  START_TEST_FETCH_TIMEOUT,
  START_TEST_TIMEOUT,
} from '@constants';
import { getAppBaseURL } from '@lib/getAppBaseURL';
import { describe, expect, test } from 'bun:test';

describe('App Start Test', () => {
  const port = 10_000 + Math.floor(Math.random() * (65535 - 10_000));
  const proc = Bun.spawn(['bun', 'start'], {
    stdout: Bun.stdout,
    env: { PORT: port.toString() },
  });
  const baseURL = getAppBaseURL();

  test(
    'wait till GET /isalive is { authVersion: 1 }',
    async () => {
      const isAliveURL = `${baseURL}/isalive` as const;
      while (!proc.killed) {
        try {
          const isAlive = await fetch(isAliveURL, {
            signal: AbortSignal.timeout(START_TEST_FETCH_TIMEOUT),
          }).then(res => res.json());
          if (isAlive) {
            expect(isAlive).toStrictEqual({ authVersion: 1 });
            break;
          }
          await Bun.sleep(START_TEST_FETCH_RETRY_INTERVAL);
        } catch {}
      }
    },
    START_TEST_TIMEOUT
  );

  test('GET / is found', async () => {
    const res = await fetch(baseURL, {
      signal: AbortSignal.timeout(START_TEST_FETCH_TIMEOUT),
    });
    expect(res.ok).toBeTrue();
    expect(res.status).not.toBe(404);
  });

  //! Disabled because cannot be reliably tested across different environments
  // describe('maxRequestBodySize', async () => {
  //   const putRandomBody = (size: number) => {
  //     const body = getRandomSave(size);
  //     return fetch(`${baseURL}/files/${TEST_GAME_ID}`, {
  //       body,
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'text/plain' },
  //     });
  //   };

  //   test('pass on smaller payloads', async () => {
  //     let res: Response | null = null;
  //     try {
  //       res = await putRandomBody(MAX_CONTENT_LENGTH);
  //       expect(res.headers.get('connection')).not.toBe('close');
  //     } catch {
  //       expect(res).not.toBeNull();
  //     }
  //   });

  //   test('fail on larger payloads', async () => {
  //     let res: Response | null = null;
  //     try {
  //       res = await putRandomBody(MAX_CONTENT_LENGTH * 1.3);
  //       expect(res.headers.get('connection')).toBe('close');
  //     } catch {
  //       expect(res).toBeNull();
  //     }
  //   });
  // });

  test('App is still running', () => {
    expect(proc.killed).toBeFalse();
    proc.kill();
  });
});
