import { FILES_CACHE_MAX_ITEMS, FILES_CACHE_MAX_SIZE } from '@constants';
import { format, parse } from 'bytes';
import { LRUCache } from 'lru-cache';

let maxCacheSize = FILES_CACHE_MAX_SIZE;

if (process.env.MAX_CACHE_SIZE) {
  console.info('[Cache] MAX_CACHE_SIZE:', process.env.MAX_CACHE_SIZE);
  const parsedMaxCacheSize = parse(process.env.MAX_CACHE_SIZE);
  if (parsedMaxCacheSize === null) {
    throw new Error(`Invalid MAX_CACHE_SIZE: ${process.env.MAX_CACHE_SIZE}`);
  }
  maxCacheSize = parsedMaxCacheSize;
}

const lruCache = new LRUCache<string, string>({
  max: FILES_CACHE_MAX_ITEMS,
  maxSize: maxCacheSize,
  // according to stackoverflow, any character is stored as utf-16
  // utf-16 is 2 bytes per character
  sizeCalculation: (val, key) => 2 * (key.length + val.length),
});

setInterval(
  () => {
    console.info('[Cache] Stats:', {
      size: lruCache.size,
      maxSize: format(lruCache.maxSize),
      calculatedSize: format(lruCache.calculatedSize),
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
