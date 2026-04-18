import { DEFAULT_FILES_CACHE_MAX_ITEMS, DEFAULT_FILES_CACHE_MAX_SIZE } from '@constants';
import { parseEnv } from '@lib/parseEnv';
import { format, parse } from 'bytes';
import { LRUCache } from 'lru-cache';

const lruCache = new LRUCache<string, string>({
  max: parseEnv('FILES_CACHE_MAX_ITEMS', DEFAULT_FILES_CACHE_MAX_ITEMS, val => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) {
      throw new Error(`Invalid FILES_CACHE_MAX_ITEMS: ${val}`);
    }
    return parsed;
  }),
  maxSize: parseEnv('FILES_CACHE_MAX_SIZE', DEFAULT_FILES_CACHE_MAX_SIZE, val => {
    const parsed = parse(val);
    if (parsed === null) {
      throw new Error(`Invalid FILES_CACHE_MAX_SIZE: ${val}`);
    }
    return parsed;
  }),
  sizeCalculation: (val, key) => Buffer.byteLength(key, 'ucs2') + Buffer.byteLength(val, 'ucs2'),
});

setInterval(
  () => {
    const { max, size, maxSize, calculatedSize } = lruCache;
    console.info('[FilesCache] Stats:', {
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

export default lruCache;
