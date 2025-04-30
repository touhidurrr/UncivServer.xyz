import { GAME_ID_REGEX, MAX_FILE_SIZE, MIN_FILE_SIZE } from '@constants';
import {
  generateRandomNotification,
  getCurrentPlayerCivilization,
  getPlayers,
  getPreview,
  parseBasicHeader,
} from '@lib';
import type { UncivJSON } from '@localTypes/unciv';
import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import cache from '@services/cache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';
import { gameDataSecurityModifier } from '@services/gameDataSecurity';
import { db } from '@services/mongodb';
import { pack, unpack } from '@services/uncivGame';
import { type Elysia, type Static, t } from 'elysia';
import { percentage } from 'randomcryp';

export const putFile = (app: Elysia) =>
  // ctx.game should contain parsed game data
  // ctx.game is null if parsing fails
  app.state('game', null as UncivJSON | null).put(
    '/:gameId',
    async ({ body, params: { gameId }, error, store, headers }) => {
      const previewId = gameId.endsWith('_Preview') ? gameId : `${gameId}_Preview`;
      const [userId, password] = parseBasicHeader(headers.authorization);
      if (!GAME_ID_REGEX.test(userId)) error('Bad Request');

      let [dbAuth, dbGame] = await Promise.all([
        db.Auth.findById(userId, { hash: 1 }),
        db.UncivGame.findById(previewId, { players: 1 }),
      ]);

      if (dbGame === null) {
        dbGame = await db.UncivGame.create({
          _id: previewId,
          turns: !store.game!.turns || 0,
          players: getPlayers(store.game!),
          text: pack(getPreview(store.game!)),
        });
      }

      // if a players list doesn't exist, regenerate it
      if (dbGame.players.length === 0) {
        dbGame.players = getPlayers(store.game!);
        await dbGame.save();
      }

      if (!dbGame.players.includes(userId)) return error('Unauthorized');

      if (dbAuth) {
        const verified = await Bun.password.verify(password, dbAuth.hash);
        if (!verified) return error('Unauthorized');
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
        // save on mongodb
        await db.UncivGame.updateOne(
          { _id: gameId },
          { $set: { text: body as string, timestamp: Date.now() } },
          { upsert: true }
        ).catch(err => console.error(`[MongoDB] Error saving game ${gameId}:`, err));

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
        if (game !== null && isDiscordTokenValid && gameId.endsWith('_Preview')) {
          await sendNewTurnNotification(game!).catch(err =>
            console.error(`[Turn Notifier] Error:`, err)
          );
        }
      },

      // parsing game data to populate ctx.store.game
      // used for notifications, security provider and discord notifications
      // in case an injection is possible, we need to repack the body to update it
      transform: ctx => {
        ctx.store.game = unpack(ctx.body as string);

        // run security modifier on game data
        const hasModifications = gameDataSecurityModifier(ctx.store.game);

        // notifications provider
        let hasNotifications = false;
        if (
          !ctx.params.gameId.endsWith('_Preview') &&
          ctx.store.game.version.number >= 4 &&
          ctx.store.game.version.createdWith.number > 1074 &&
          // 52.5% chance of a notification being shown per turn
          // weighted average of a poll in Unciv the discord server
          // decreased to 10% at least for this year because yair thinks it's too much
          percentage(10)
        ) {
          hasNotifications = true;
          const targetCiv = getCurrentPlayerCivilization(ctx.store.game);
          if (targetCiv) {
            const newNotification = generateRandomNotification(ctx.store.game);
            if (targetCiv.notifications) targetCiv.notifications.push(newNotification);
            else targetCiv.notifications = [newNotification];
          }
        }

        // repack game data if there are modifications or notifications
        if (hasModifications || hasNotifications) {
          ctx.body = pack(ctx.store.game);
        }
      },
    }
  );
