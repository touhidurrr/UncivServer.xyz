import { MAX_FILE_SIZE, MIN_FILE_SIZE, UNCIV_BASIC_AUTH_HEADER_SCHEMA } from '@constants';
import { UncivGame } from '@models/uncivGame';
import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import cache from '@services/cache';
import { isDiscordTokenValid, sendNewTurnNotification } from '@services/discord';
import { gameDataSecurityModifier } from '@services/gameDataSecurity';
import { db } from '@services/mongodb';
import { type } from 'arktype';
import type { Elysia } from 'elysia';
import { percentage } from 'randomcryp';

export const putFile = (app: Elysia) =>
  app.guard(
    {
      headers: UNCIV_BASIC_AUTH_HEADER_SCHEMA,
      body: type(`${MIN_FILE_SIZE}<= string <= ${MAX_FILE_SIZE}`),
    },
    app =>
      app
        .derive(({ body }) => ({ game: new UncivGame(body) }))
        .put(
          ':gameId',
          async ({ body, params: { gameId }, status, game, headers }) => {
            const [userId, password] = headers.authorization;

            const results = await Promise.all([
              db.Auth.findById(userId, { hash: 1 }),
              db.UncivGame.findById(game.previewId, { players: 1 }),
            ]);

            let dbGame = results[1];
            if (dbGame === null) {
              dbGame = await db.UncivGame.create({
                _id: game.previewId,
                turns: !game.getTurns(),
                players: game.players,
                text: game.packedPreview(),
              }).catch(() => db.UncivGame.findById(game.previewId, { players: 1 }));

              if (dbGame == null) return status(500, 'Failed to save game!');
            }

            // if a players list doesn't exist, regenerate it
            if (dbGame.players.length === 0) {
              dbGame.players = game.players;
              await dbGame.save();
            }

            const playersInGame =
              dbGame.players.includes(userId) &&
              game.data.civilizations.every(
                ({ playerId }) => !playerId || dbGame.players.includes(playerId)
              );

            if (!playersInGame) return status('Unauthorized');

            const dbAuth = results[0];
            if (dbAuth) {
              const verified = await Bun.password.verify(password, dbAuth.hash);
              if (!verified) return status('Unauthorized');
            }

            // for performance reasons, just store the file in cache and return ok
            // try to do everything else asynchronously in afterResponse
            await cache.set(gameId, body);
            return 'Done!';
          },
          {
            //@ts-expect-error it works but shows error
            afterResponse: async ({ body, server, params: { gameId }, game }) => {
              const isPreview = gameId.endsWith('_Preview');
              const [, name] = await Promise.allSettled([
                db.UncivGame.updateOne({ _id: gameId }, { $set: { text: body } }, { upsert: true }),
                db.UncivGame.findByIdAndUpdate(
                  game.previewId,
                  {
                    $set: {
                      currentPlayer: game.currentPlayer,
                      playerId: game.currentCiv?.playerId,
                      turns: game.getTurns(),
                    },
                    $addToSet: { players: { $each: game.players } },
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
                  } as typeof SYNC_RESPONSE_SCHEMA.infer),
                  true
                );
              } catch (err) {
                console.error(`[Sync] Error syncing game ${gameId}:`, err);
              }

              // send turn notification
              if (isPreview && isDiscordTokenValid) {
                await sendNewTurnNotification(
                  game,
                  name.status === 'fulfilled' ? name.value : null
                ).catch(err => console.error(`[Turn Notifier] Error:`, err));
              }
            },

            // used for notifications, security provider and discord notifications
            // in case an injection is possible, we need to repack the body to update it
            transform: ctx => {
              //@ts-expect-error it works but shows error
              const game: UncivGame = ctx.game;

              // run security modifier on game data
              const hasModifications = gameDataSecurityModifier(game);

              // notifications provider
              let hasNotifications = false;
              if (
                !ctx.params.gameId.endsWith('_Preview') &&
                game.isVersionAtLeast({ number: 4, createdWithNumber: 1075 }) &&
                // 52.5% chance of a notification being shown per turn
                // weighted average of a poll in Unciv the discord server
                // decreased to 10% at least for this year because yair thinks it's too much
                percentage(10)
              ) {
                hasNotifications = true;
                game.addRandomNotificationToCurrentCiv();
              }

              // repack game data if there are modifications or notifications
              if (hasModifications || hasNotifications) {
                ctx.body = game.packed();
              }
            },
          }
        )
  );
