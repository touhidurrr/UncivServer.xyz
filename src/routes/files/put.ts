import { GAME_ID_REGEX, MAX_FILE_SIZE, MIN_FILE_SIZE } from '@constants';
import { parseBasicHeader } from '@lib/parseBasicHeader';
import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import cache from '@services/cache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';
import { gameDataSecurityModifier } from '@services/gameDataSecurity';
import { db } from '@services/mongodb';
import { pack } from '@services/uncivJSON';
import { type Elysia, type Static, t } from 'elysia';
import type { UpdateQuery } from 'mongoose';
import { UncivGame } from '../../models/uncivGame';

export const putFile = (app: Elysia) =>
  // ctx.game should contain parsed game data
  // ctx.game is null if parsing fails
  app.state('game', null as UncivGame | null).put(
    '/:gameId',
    async ({ body, params: { gameId }, status, store, headers }) => {
      const [userId, password] = parseBasicHeader(headers.authorization);
      if (!GAME_ID_REGEX.test(userId)) return status('Bad Request');

      let [dbAuth, dbGame] = await Promise.all([
        db.Auth.findById(userId, { hash: 1 }),
        db.UncivGame.findById(store.game!.previewId, { players: 1 }),
      ]);

      if (dbGame === null) {
        dbGame = await db.UncivGame.create({
          _id: store.game!.previewId,
          turns: !store.game!.getTurns(),
          players: store.game!.getPlayers(),
          text: pack(store.game!.getPreview()),
        });
      }

      // if a players list doesn't exist, regenerate it
      if (dbGame.players.length === 0) {
        dbGame.players = store.game!.getPlayers();
        await dbGame.save();
      }

      const playersInGame =
        dbGame.players.includes(userId) &&
        store.game!.data.civilizations.every(
          ({ playerId }) => !playerId || dbGame.players.includes(playerId)
        );

      if (!playersInGame) return status('Unauthorized');

      if (dbAuth) {
        const verified = await Bun.password.verify(password, dbAuth.hash);
        if (!verified) return status('Unauthorized');
      }

      // for performance reasons, just store the file in cache and return ok
      // try to do everything else asynchronously in afterResponse
      await cache.set(gameId, body as string);
      return 'Done!';
    },
    {
      // body schema
      body: t.String({
        minLength: MIN_FILE_SIZE,
        maxLength: MAX_FILE_SIZE,
      }),

      headers: t.Object({ authorization: t.String({ minLength: 56, maxLength: 512 }) }),

      afterResponse: async ({ body, server, params: { gameId }, store: { game } }) => {
        const isPreview = gameId.endsWith('_Preview');
        const [_, name] = await Promise.allSettled([
          db.UncivGame.updateOne(
            { _id: gameId },
            {
              $set: {
                text: body as string,
              },
            },
            {
              projection: { _id: 0, name: 1 },
              upsert: true,
            }
          ),
          db.UncivGame.findByIdAndUpdate(
            game!.previewId,
            {
              $set: {
                currentPlayer: game!.getCurrentPlayer(),
                playerId: game!.getCurrentPlayerId(),
                turns: game!.getTurns(),
              },
              $addToSet: { players: { $each: game!.getPlayers() } },
            },
            {
              projection: { _id: 0, name: 1 },
              upsert: true,
            }
          ).then(game => game?.name),
        ]);

        try {
          // sync with other servers
          server?.publish(
            'sync',
            JSON.stringify({
              type: 'SyncData',
              data: { gameId, content: body },
            } as Static<typeof SYNC_RESPONSE_SCHEMA>),
            true
          );
        } catch (err) {
          console.error(`[Sync] Error syncing game ${gameId}:`, err);
        }

        // send turn notification
        if (isPreview && isDiscordTokenValid) {
          await sendNewTurnNotification(
            game!,
            name.status === 'fulfilled' ? name.value : null
          ).catch(err => console.error(`[Turn Notifier] Error:`, err));
        }
      },

      // parsing game data to populate ctx.store.game
      // used for notifications, security provider and discord notifications
      // in case an injection is possible, we need to repack the body to update it
      transform: ctx => {
        ctx.store.game = new UncivGame(ctx.body as string);

        // run security modifier on game data
        const hasModifications = gameDataSecurityModifier(ctx.store.game);

        // notifications provider
        let hasNotifications = false;
        // if (
        //   !ctx.params.gameId.endsWith('_Preview') &&
        //   ctx.store.game.isVersionAtLeast({ number: 4, createdWithNumber: 1075 }) &&
        //   // 52.5% chance of a notification being shown per turn
        //   // weighted average of a poll in Unciv the discord server
        //   // decreased to 10% at least for this year because yair thinks it's too much
        //   percentage(10)
        // ) {
        //   hasNotifications = true;
        //   ctx.store.game.addRandomNotificationToCurrentCiv();
        // }

        // repack game data if there are modifications or notifications
        if (hasModifications || hasNotifications) {
          ctx.body = pack(ctx.store.game);
        }
      },
    }
  );
