import { db } from '@services/mongodb';
import { cache } from '@services/lrucache';
import type { Elysia } from 'elysia';

export const deleteFile = (app: Elysia) =>
  app.delete('/:gameId', async ({ params: { gameId } }) => {
    await Promise.all([cache.delete(gameId), db.UncivServer.deleteOne({ _id: gameId })]);
    return 'Done!';
  });
