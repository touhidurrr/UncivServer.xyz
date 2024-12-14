import cache from '@services/cache';
import { db } from '@services/mongodb';

export async function getGameDataWithCache(gameId: string): Promise<string | null> {
  const cachedData = await cache.get(gameId);
  if (cachedData) return cachedData;

  const game = await db.UncivServer.findOne({ _id: gameId }, { projection: { _id: 0, text: 1 } });
  if (!game) return null;

  await cache.set(gameId, game.text);
  return game.text;
}
