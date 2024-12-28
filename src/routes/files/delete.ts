import cache from '@services/cache';
import { db } from '@services/mongodb';
import prisma from '@services/prisma';
import type { Elysia } from 'elysia';

export const deleteFile = (app: Elysia) =>
  app.delete('/:gameId', async ({ params: { gameId } }) => {
    await Promise.all([
      cache.del(gameId),
      prisma.game.delete({ where: { id: gameId } }),
      db.UncivGame.deleteOne({ _id: gameId }),
    ]);
    return 'Done!';
  });
