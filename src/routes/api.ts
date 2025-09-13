import { BEARER_JWT_SCHEMA, NUMERIC_REGEX, UUID_SCHEMA } from '@constants';
import db from '@services/mongodb';
import { calculateRating } from '@services/rating';
import { Elysia, t } from 'elysia';
import type { AnyBulkWriteOperation } from 'mongoose';
import { z } from 'zod';
import { jwtPlugin } from './jwt';

export const apiPlugin = new Elysia({ name: 'api', prefix: 'api' }).use(jwtPlugin).guard(
  {
    cookie: t.Cookie({ auth: t.Optional(t.String()) }),
    headers: z.object({ authorization: BEARER_JWT_SCHEMA.optional() }),
    beforeHandle: async ({ status, jwt, headers: { authorization }, cookie: { auth } }) => {
      const token = auth.value ?? authorization;
      if (!token) return status(400, 'You must provide one of bearer token or auth cookie!');
      const verified = await jwt.verify(token);
      if (!verified) return status('Unauthorized');
    },
  },
  app =>
    app
      .guard({ params: z.object({ gameId: UUID_SCHEMA }) }, app =>
        app
          .get('games/:gameId/name', async ({ status, params: { gameId } }) => {
            const game = await db.UncivGame.findById(`${gameId}_Preview`, { _id: 0, name: 1 });
            if (!game || !game.name) return status('Not Found');
            return game.name;
          })
          .post(
            'games/:gameId/name',
            async ({ status, params: { gameId }, body: { name } }) => {
              if (name.length === 0) return status('Bad Request');
              const { matchedCount } = await db.UncivGame.updateOne(
                { _id: `${gameId}_Preview` },
                { $set: { name } }
              );
              return status(matchedCount > 0 ? 'OK' : 'Not Found');
            },
            { body: z.object({ name: z.string().max(100) }) }
          )
          .delete('games/:gameId/name', async ({ status, params: { gameId } }) => {
            const { matchedCount } = await db.UncivGame.updateOne(
              { _id: `${gameId}_Preview` },
              { $unset: { name: '' } }
            );
            return status(matchedCount > 0 ? 'OK' : 'Not Found');
          })
      )

      .guard({ params: z.object({ _id: z.string().regex(NUMERIC_REGEX) }) }, app =>
        app
          .get('profiles/:_id', ({ params: { _id } }) =>
            db.PlayerProfile.findById(_id)
              .then(p => p || db.PlayerProfile.create({ _id }))
              .then(p => p.toObject())
          )

          .post(
            'profiles/:_id/notifications',
            ({ params: { _id }, body: { status } }) =>
              db.PlayerProfile.updateOne({ _id }, { $set: { notifications: status } }),
            { body: z.object({ status: z.literal(['enabled', 'disabled']) }) }
          )

          .post(
            'profiles/:_id/uncivUserIds',
            ({ params: { _id }, body: { userId } }) =>
              db.PlayerProfile.updateOne({ _id }, { $addToSet: { uncivUserIds: userId } }),
            { body: z.object({ userId: UUID_SCHEMA }) }
          )

          .delete(
            'profiles/:_id/uncivUserIds',
            ({ params: { _id }, body: { userId } }) =>
              db.PlayerProfile.updateOne({ _id }, { $pull: { uncivUserIds: userId } }),
            { body: z.object({ userId: UUID_SCHEMA }) }
          )

          .get(
            'profiles/:_id/games',
            async ({ status, params: { _id }, query }) => {
              //! temporary fix
              const { playing, limit } = z
                .object({
                  playing: z.stringbool().readonly().default(false),
                  limit: z.coerce.number().min(1).max(25).default(25),
                })
                .parse(query);

              const profile = await db.PlayerProfile.findById(_id, { uncivUserIds: 1 });
              if (!profile) return status(404);
              if (profile.uncivUserIds.length < 1) return status(204);

              const filter =
                `${playing}` === 'true'
                  ? { playerId: profile.uncivUserIds }
                  : { players: { $in: profile.uncivUserIds } };

              const games = await db.UncivGame.find(
                filter,
                { createdAt: 1, updatedAt: 1, currentPlayer: 1, name: 1, turns: 1 },
                {
                  sort: { updatedAt: -1 },
                  limit: Math.max(1, Math.min(25, (limit ?? 25) || 0)),
                }
              );
              games.forEach(game => {
                if (game._id.endsWith('_Preview')) {
                  game._id = game._id.slice(0, -8);
                }
              });
              return games;
            },
            {
              query: z.object({
                playing: z.stringbool().readonly().default(false),
                limit: z.coerce.number().min(1).max(25).default(25),
              }),
            }
          )
      )

      .get(
        'users/:_id/profileId',
        async ({ status, params: { _id } }) => {
          const profile = await db.PlayerProfile.findOne({ uncivUserIds: _id }, { _id: 1 });
          if (!profile) return status(404);
          return profile._id;
        },
        { params: z.object({ _id: UUID_SCHEMA }) }
      )

      .post(
        'profiles/rating',
        async ({ body: { ids } }) => {
          const profiles = await db.PlayerProfile.find({ _id: { $in: ids } }, { rating: 1 });

          if (profiles.length < ids.length) {
            const idSet = new Set(ids);
            const profileIdSet = new Set(profiles.map(p => p._id));
            const diffSet = idSet.difference(profileIdSet);

            const newDocs = Array.from(diffSet).map(_id => ({ _id }));
            const newProfiles = await db.PlayerProfile.create(newDocs);
            profiles.push(...newProfiles);
          }

          const idToProfile = new Map<string, (typeof profiles)[0]>();
          for (const p of profiles) {
            idToProfile.set(p._id, p);
          }

          const ratings = calculateRating(ids.map(id => idToProfile.get(id)!.rating!));

          const bulkUpdateOps: Array<AnyBulkWriteOperation<(typeof profiles)[0]>> = [];

          ids.forEach((_id, i) => {
            const { cur, mu, sigma } = ratings[i];
            bulkUpdateOps.push({
              updateOne: {
                filter: { _id },
                // Use an aggregation pipeline for conditional logic
                update: [
                  {
                    $set: {
                      'rating.cur': cur,
                      'rating.mu': mu,
                      'rating.sigma': sigma,

                      'games.played': { $add: ['$games.played', 1] },

                      ...(i === 0 && { 'games.won': { $add: ['$games.won', 1] } }),
                    },
                  },
                  {
                    $set: {
                      'rating.peak': {
                        $cond: {
                          if: { $gte: ['$games.played', 3] },
                          then: { $max: ['$rating.peak', cur] },
                          else: '$rating.peak',
                        },
                      },
                    },
                  },
                ],
              },
            });
          });

          await db.PlayerProfile.bulkWrite(bulkUpdateOps);

          return ratings.map(r => r.cur);
        },
        { body: z.object({ ids: z.array(z.string().regex(NUMERIC_REGEX)).max(32) }) }
      )

      .post(
        'filterUnregisteredUserIds',
        async ({ body: { userIds } }) => {
          const profiles = await db.PlayerProfile.find(
            { uncivUserIds: userIds },
            { uncivUserIds: 1 }
          );
          return [...new Set(profiles.flatMap(p => p.uncivUserIds)).intersection(new Set(userIds))];
        },
        {
          body: z.object({ userIds: z.array(UUID_SCHEMA) }),
        }
      )

      .get('stats', () => db.stats())
);
