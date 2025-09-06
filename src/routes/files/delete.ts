import cache from '@services/cache';
import { db } from '@services/mongodb';
import type { Elysia } from 'elysia';

export const deleteFile = (app: Elysia) =>
  app.delete(':gameId', async ({ params: { gameId } }) => {
    await Promise.all([cache.del(gameId), db.UncivGame.deleteOne({ _id: gameId })]);
    return 'Done!';
  });
