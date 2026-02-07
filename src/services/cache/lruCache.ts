import { FILES_CACHE_MAX_ITEMS, FILES_CACHE_MAX_SIZE } from '@constants';
import type { CacheService } from '@models/cache';
import { format, parse } from 'bytes';
import { LRUCache } from 'lru-cache';

const { MAX_CACHE_SIZE, MAX_CACHE_ITEMS = FILES_CACHE_MAX_ITEMS } = process.env;

let maxCacheSize = FILES_CACHE_MAX_SIZE;

if (MAX_CACHE_SIZE) {
  console.info('[Cache] MAX_CACHE_SIZE:', MAX_CACHE_SIZE);
  const parsedMaxCacheSize = parse(MAX_CACHE_SIZE);
  if (parsedMaxCacheSize === null) {
    throw new Error(`Invalid MAX_CACHE_SIZE: ${MAX_CACHE_SIZE}`);
  }
  maxCacheSize = parsedMaxCacheSize;
}

const lruCache = new LRUCache<string, string>({
  max: +MAX_CACHE_ITEMS,
  maxSize: maxCacheSize,
  // according to stackoverflow, any character is stored as utf-16
  // utf-16 is 2 bytes per character
  sizeCalculation: (val, key) => 2 * (key.length + val.length),
});

setInterval(
  () => {
    const { max, size, maxSize, calculatedSize } = lruCache;
    console.info('[Cache] Stats:', {
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

class LRUCacheService implements CacheService {
  ready(): Promise<void> {
    return Promise.resolve();
  }

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(lruCache.get(key));
  }

  set(key: string, value: string): Promise<void> {
    lruCache.set(key, value);
    return Promise.resolve();
  }

  del(key: string): Promise<boolean> {
    return Promise.resolve(lruCache.delete(key));
  }
}

export default new LRUCacheService();
