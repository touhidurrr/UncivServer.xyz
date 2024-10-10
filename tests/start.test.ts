import { describe, expect, test } from 'bun:test';
import { getAppBaseURL } from '@lib/getAppBaseURL';
import { START_TEST_FETCH_TIMEOUT, START_TEST_TIMEOUT } from '@constants';

describe('App Start Test', () => {
  const proc = Bun.spawn(['bun', 'start']);
  const baseURL = getAppBaseURL();
  const url = `${baseURL}/isalive` as const;

  test(
    'wait till GET /isalive is true',
    async () => {
      while (!proc.killed) {
        try {
          const isAlive = await fetch(url, {
            signal: AbortSignal.timeout(START_TEST_FETCH_TIMEOUT),
          }).then(res => res.text());
          if (isAlive) {
            expect(isAlive).toBeString();
            expect(isAlive).toBe('true');
            break;
          }
        } catch {}
      }
    },
    START_TEST_TIMEOUT
  );

  test('GET / is found', async () => {
    const res = await fetch(baseURL);
    expect(res.ok).toBeTrue();
    expect(res.status).not.toBe(404);
  });

  test('App is still running', () => {
    expect(proc.killed).toBeFalse();
    proc.kill();
  });
});
