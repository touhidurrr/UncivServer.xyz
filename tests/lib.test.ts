import { describe, expect, test } from 'bun:test';
import { isAllowedURL } from '@services/gameDataSecurity';
import { promotion } from '@data/notifications';

describe('uncivGameSecurity', () => {
  test('isSecureURL', () => {
    // all promotion URLs should be secure
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
