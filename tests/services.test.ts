import { DISCORD_INVITE, SUPPORT_URL } from '@constants';
import { promotions } from '@data/notifications';
import { isAllowedURL } from '@services/gameDataSecurity';
import { pack, unpack } from '@services/uncivJSON';
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
    promotions.forEach(({ url }) => {
      expect(isAllowedURL(url)).toBeTrue();
    });

    // base case
    expect(isAllowedURL(DISCORD_INVITE)).toBeTrue();
    expect(isAllowedURL(SUPPORT_URL)).toBeTrue();

    // protocol not https:
    expect(isAllowedURL('http://uncivserver.xyz/discord')).toBeFalse();
    expect(isAllowedURL('ftp://uncivserver.xyz/discord')).toBeFalse();

    // some random url
    expect(isAllowedURL('https://example.com')).toBeFalse();

    // invalid urls
    expect(isAllowedURL('')).toBeFalse();
    expect(isAllowedURL('uncivserver.xyz')).toBeFalse();
    expect(isAllowedURL('https://')).toBeFalse();
  });
});
