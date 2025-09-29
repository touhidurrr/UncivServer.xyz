import { getAppBaseURL } from '@lib';
import axios from 'axios';
import { expect, test } from 'bun:test';

import '@index';

const api = axios.create({
  baseURL: getAppBaseURL(),
  validateStatus: null,
});

const name = 'test';
const syncToken = process.env.SYNC_TOKEN ?? '';

await Bun.sleep(3_000);

test.concurrent('Validation error on no SYNC_TOKEN', () =>
  api
    .get(`/jwt/${name}`, {
      headers: { Authorization: `Bearer ` },
    })
    .then(({ status, data }) => {
      expect(status).toBe(422);
      expect(data).toMatchObject({
        type: 'validation',
        on: 'headers',
        property: 'authorization',
      });
    })
);

test.concurrent('JWT unobtainable on incorrect SYNC_TOKEN', () =>
  api
    .get(`/jwt/${name}`, {
      headers: { Authorization: `Bearer SomeToken` },
    })
    .then(({ status, data }) => {
      expect(status).toBe(401);
      expect(data).toBe('Unauthorized');
    })
);

let jwtToken = '';

test('JWT obtainable on correct SYNC_TOKEN', () =>
  api
    .get(`/jwt/${name}`, {
      headers: { Authorization: `Bearer ${syncToken}` },
    })
    .then(({ status, data }) => {
      expect(status).toBe(200);
      expect(data).toBeString();
      jwtToken = data;
    }));

const postAPI = api.create({ headers: { 'Content-Type': 'text/plain' } });

test('200 on valid token', () =>
  postAPI.post(`/jwt/verify`, jwtToken).then(({ status, data }) => {
    expect(status).toBe(200);
    expect(data).toBe('OK');
    jwtToken = data;
  }));

test.concurrent('Validation error on no token', () =>
  postAPI.post(`/jwt/verify`, '').then(({ status, data }) => {
    expect(status).toBe(422);
    expect(data).toMatchObject({
      type: 'validation',
      on: 'body',
      property: 'root',
    });
  })
);

test.concurrent('400 on invalid tokens', () =>
  postAPI.post(`/jwt/verify`, 'abcd').then(({ status, data }) => {
    expect(status).toBe(400);
    expect(data).toBe('Bad Request');
  })
);

test.concurrent('401 on none type token', () => {
  const [, payload] = jwtToken.split('.');
  const noneTypeHeader = Buffer.from(`{"alg":"none"}`).toBase64({ alphabet: 'base64url' });
  const noneTypeToken = `${noneTypeHeader}.${payload}.`;

  return postAPI.post(`/jwt/verify`, noneTypeToken).then(({ status, data }) => {
    expect(status).toBe(401);
    expect(data).toBe('Unauthorized');
  });
});
