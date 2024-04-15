import { expect, test } from 'bun:test';
import { getAppBaseURL } from '@lib/getAppBaseURL';
import { START_TEST_FETCH_TIMEOUT, START_TEST_TIMEOUT } from '@constants';

test(
  'App Start Test',
  async () => {
    const proc = Bun.spawn(['bun', 'start']);
    const baseURL = getAppBaseURL();
    const url = `${baseURL}/isalive` as const;

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

    expect(proc.killed).not.toBeTrue();
    proc.kill();
  },
  START_TEST_TIMEOUT
);
