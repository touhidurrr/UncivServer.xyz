import { UncivGame } from '@models/UncivGame';
import cache from '@services/cache';
import type { Elysia } from 'elysia';

export const deleteFile = (app: Elysia) =>
  app.delete(':gameId', async ({ params: { gameId } }) => {
    await Promise.all([cache.del(gameId), UncivGame.deleteOne({ _id: gameId })]);
    return 'Done!';
  });
