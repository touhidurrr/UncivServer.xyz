import { HMAC } from '@classes/HMAC';
import { DEFAULT_PASSWORDS_CACHE_MAX_ITEMS, DEFAULT_PASSWORDS_CACHE_MAX_SIZE } from '@constants';
import { parseEnv } from '@lib/parseEnv';
import { format, parse } from 'bytes';
import { randomBytes } from 'crypto';
import { LRUCache } from 'lru-cache';

const lruCache = new LRUCache<string, string>({
  max: parseEnv('PASSWORDS_CACHE_MAX_ITEMS', DEFAULT_PASSWORDS_CACHE_MAX_ITEMS, val => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error(`Invalid PASSWORDS_CACHE_MAX_ITEMS: ${val}`);
    }
    return parsed;
  }),
  maxSize: parseEnv('PASSWORDS_CACHE_MAX_SIZE', DEFAULT_PASSWORDS_CACHE_MAX_SIZE, val => {
    const parsed = parse(val);
    if (parsed === null) {
      throw new Error(`Invalid PASSWORDS_CACHE_MAX_SIZE: ${val}`);
    }
    return parsed;
  }),
  sizeCalculation: (val, key) => Buffer.byteLength(key, 'ucs2') + Buffer.byteLength(val, 'ucs2'),
});

setInterval(
  () => {
    const { max, size, maxSize, calculatedSize } = lruCache;
    console.info('[PasswordsCache] Stats:', {
      items: size,
      size: format(calculatedSize),
      limits: {
        items: max,
        size: format(maxSize),
      },
    });
  },
  1000 * 60 * 5
);

const hmac = new HMAC('blake2b512', 'base64', randomBytes(64));

/**
 * ## PasswordsCache
 *
 * Since argon2 is expensive, we use an in-memory LRU cache
 * to store HMAC digests of passwords for quick verification.
 *
 * This allows us to avoid expensive argon2 computations on every request
 * while still ensuring that we never store plaintext passwords
 * or even argon2 hashes in memory.
 *
 * **Algorithm:** `BLAKE2b-512`
 *
 * **Digest Encoding:** `Base64`
 *
 * **Secret:** `64` random bytes (`512` bits) generated at startup
 *
 * ### Algorithm choice requirements:
 * 1. Post Quantum Secure
 * 2. Provided by Bun's built-in CryptoHasher or Node's crypto module
 * 3. Fast to compute
 */
export default {
  set: (uuid: string, password: string) => {
    lruCache.set(uuid, hmac.hash(password));
  },
  has: (uuid: string) => lruCache.has(uuid),
  verify: (uuid: string, password: string) => {
    const digest = lruCache.get(uuid);
    if (!digest) return false;
    return hmac.verify(digest, password);
  },
};
