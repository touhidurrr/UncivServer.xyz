import { promotion } from '@data/notifications';
import { isAllowedURL } from '@services/gameDataSecurity';
import { pack, unpack } from '@services/uncivGame';
import { describe, expect, test } from 'bun:test';

describe('uncivGame', () => {
  test('Pack and Unpack', () => {
    const object = { hello: 'world' };

    const packed = pack(object);
    expect(packed).toBeString();

    const unpacked = unpack(packed) as object;
    expect(unpacked).toBeObject();
    expect(unpacked).toStrictEqual(object);
  });
});

describe('gameDataSecurity', () => {
  test(isAllowedURL.name, () => {
    // all promotion URLs should be valid
    promotion.forEach(({ url }) => {
      expect(isAllowedURL(url)).toBeTrue();
    });

    // base case
    expect(isAllowedURL('https://uncivserver.xyz')).toBeTrue();

    // protocol not https:
    expect(isAllowedURL('http://uncivserver.xyz')).toBeFalse();
    expect(isAllowedURL('ftp://uncivserver.xyz')).toBeFalse();

    // valid but not allowed
    expect(isAllowedURL('https://example.com')).toBeFalse();

    // invalid urls
    expect(isAllowedURL('')).toBeFalse();
    expect(isAllowedURL('uncivserver.xyz')).toBeFalse();
    expect(isAllowedURL('https://')).toBeFalse();
  });
});
