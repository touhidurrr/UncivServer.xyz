import {
  MAX_CONTENT_LENGTH,
  START_TEST_FETCH_TIMEOUT,
  START_TEST_TIMEOUT,
  TEST_GAME_ID,
} from '@constants';
import { getRandomBase64String } from '@lib';
import { getAppBaseURL } from '@lib/getAppBaseURL';
import { describe, expect, test } from 'bun:test';

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

  test('Pass on payloads than maxRequestBodySize', async () => {
    await expect(
      async () =>
        await fetch(`${baseURL}/files/${TEST_GAME_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'text/plain' },
          body: getRandomBase64String(MAX_CONTENT_LENGTH * 1.05),
        })
    ).not.toThrow();
  });

  test('Fail on payloads larger than maxRequestBodySize', async () => {
    await expect(
      async () =>
        await fetch(`${baseURL}/files/${TEST_GAME_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'text/plain' },
          body: getRandomBase64String(MAX_CONTENT_LENGTH * 1.5),
        })
    ).toThrow();
  });

  test('App is still running', () => {
    expect(proc.killed).toBeFalse();
    proc.kill();
  });
});
