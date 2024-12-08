import { describe, expect, test } from 'bun:test';
import { isSecureURL } from '@services/uncivGameSecurity';
import { promotion } from '@data/notifications';

describe('uncivGameSecurity', () => {
  test('isSecureURL', () => {
    // all promotion URLs should be secure
    promotion.forEach(({ url }) => {
      expect(isSecureURL(url)).toBeTrue();
    });

    // base case
    expect(isSecureURL('https://uncivserver.xyz')).toBeTrue();

    // protocol not https:
    expect(isSecureURL('http://uncivserver.xyz')).toBeFalse();
    expect(isSecureURL('ftp://uncivserver.xyz')).toBeFalse();

    // valid but not allowed
    expect(isSecureURL('https://example.com')).toBeFalse();

    // invalid urls
    expect(isSecureURL('')).toBeFalse();
    expect(isSecureURL('uncivserver.xyz')).toBeFalse();
    expect(isSecureURL('https://')).toBeFalse();
  });
});
