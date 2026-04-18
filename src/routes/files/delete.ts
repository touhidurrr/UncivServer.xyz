import filesCache from '@cache/filesCache';
import { UncivGame } from '@models/UncivGame';
import type { Elysia } from 'elysia';

export const deleteFile = (app: Elysia) =>
  app.delete(':gameId', async ({ params: { gameId } }) => {
    filesCache.delete(gameId);
    await UncivGame.deleteOne({ _id: gameId });
    return 'Done!';
  });
