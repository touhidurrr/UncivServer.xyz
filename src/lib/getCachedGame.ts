import cache from '@services/cache';
import { db } from '@services/mongodb';
import type { CachedGame } from '../models/cache';

export async function getCachedGame(gameId: string): Promise<CachedGame | null> {
  let cachedGame = await cache.get(gameId);
  if (cachedGame) return cachedGame;

  cachedGame = (await db.UncivServer.findOne(
    { _id: gameId },
    { projection: { _id: 0, text: 1, timestamp: 1 } }
  )) as CachedGame;
  if (!cachedGame) return null;

  await cache.set(gameId, cachedGame);
  return cachedGame;
}
