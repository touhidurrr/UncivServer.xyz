import db from '@services/mongodb';
import { Elysia, t } from 'elysia';
import { jwtPlugin } from './jwt';
import { UUID_REGEX } from '@constants';

// Notes: deleteFile not imported for safety reasons

export const apiPlugin = new Elysia({ name: 'api', prefix: 'api' }).use(jwtPlugin).guard(
  {
    headers: t.Object({ authorization: t.Optional(t.RegExp(/^bearer\s+.+$/i, {})) }),
    beforeHandle: ({ status, jwt, headers: { authorization }, cookie: { auth } }) => {
      const token = auth.value ?? authorization?.replace(/^bearer\s+/i, '');
      if (!jwt?.verify(token)) return status('Unauthorized');
    },
  },
  app =>
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
        { body: t.Object({ name: t.String({ maxLength: 100 }) }) }
      )
      .delete('games/:gameId/name', async ({ status, params: { gameId } }) => {
        const { matchedCount } = await db.UncivGame.updateOne(
          { _id: `${gameId}_Preview` },
          { $unset: { name: '' } }
        );
        return status(matchedCount > 0 ? 'OK' : 'Not Found');
      })
      .get('profiles/:_id', ({ params: { _id } }) =>
        db.PlayerProfile.findById(_id)
          .then(p => p || db.PlayerProfile.create({ _id }))
          .then(p => p.toObject())
      )
      .post(
        'profiles/:_id/notifications',
        ({ params: { _id }, body: { status } }) =>
          db.PlayerProfile.updateOne({ _id }, { $set: { notifications: status } }),
        { body: t.Object({ status: t.UnionEnum(['enabled', 'disabled']) }) }
      )
      .post(
        'profiles/:_id/uncivUserIds',
        ({ params: { _id }, body: { userId } }) =>
          db.PlayerProfile.updateOne({ _id }, { $addToSet: { uncivUserIds: userId } }),
        { body: t.Object({ userId: t.RegExp(UUID_REGEX) }) }
      )
      .delete(
        'profiles/:_id/uncivUserIds',
        ({ params: { _id }, body: { userId } }) =>
          db.PlayerProfile.updateOne({ _id }, { $pull: { uncivUserIds: userId } }),
        { body: t.Object({ userId: t.RegExp(UUID_REGEX) }) }
      )
      .get(
        'profiles/:_id/games',
        async ({ status, params: { _id }, query: { playing, limit } }) => {
          const profile = await db.PlayerProfile.findById(_id, { uncivUserIds: 1 });
          if (!profile) return status(404);
          if (profile.uncivUserIds.length < 1) return status(204);

          const filter =
            playing === 'true'
              ? { playerId: profile.uncivUserIds }
              : { players: { $in: profile.uncivUserIds } };

          const games = await db.UncivGame.find(
            filter,
            { createdAt: 1, updatedAt: 1, currentPlayer: 1, name: 1, turns: 1 },
            { sort: { updatedAt: -1 }, limit: Math.min(25, limit) }
          );
          games.forEach(game => {
            if (game._id.endsWith('_Preview')) {
              game._id = game._id.slice(0, -8);
            }
          });
          return games;
        },
        {
          query: t.Object({
            playing: t.ReadonlyOptional(t.Literal('true')),
            limit: t.Numeric({ default: Number.MAX_SAFE_INTEGER }),
          }),
        }
      )
      .get('users/:_id/profileId', async ({ status, params: { _id } }) => {
        const profile = await db.PlayerProfile.findOne({ uncivUserIds: _id }, { _id: 1 });
        if (!profile) return status(404);
        return profile._id;
      })
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
          body: t.Object({ userIds: t.Array(t.RegExp(UUID_REGEX)) }),
        }
      )
);
