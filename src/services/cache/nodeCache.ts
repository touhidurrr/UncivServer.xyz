import { CACHE_TTL_CHECK_INTERVAL_SECONDS, CACHE_TTL_SECONDS } from '@constants';
import type { CacheService } from '@models/cache';
import { format } from 'bytes';
import NodeCache from 'node-cache';

const nodeCache = new NodeCache({
  stdTTL: CACHE_TTL_SECONDS,
  checkperiod: CACHE_TTL_CHECK_INTERVAL_SECONDS,
  useClones: false,
  deleteOnExpire: true,
});

setInterval(
  () => {
    const stats = nodeCache.getStats();
    console.info('[Cache] Stats:', {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      ksize: format(stats.ksize),
      vsize: format(stats.vsize),
    });
  },
  1000 * 60 * 5
);

class NodeCacheService implements CacheService {
  ready(): Promise<void> {
    return Promise.resolve();
  }

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(nodeCache.get<string>(key));
  }

  set(key: string, value: string): Promise<boolean> {
    return Promise.resolve(nodeCache.set(key, value));
  }

  del(key: string): Promise<number> {
    return Promise.resolve(nodeCache.del(key));
  }
}

export default new NodeCacheService();
