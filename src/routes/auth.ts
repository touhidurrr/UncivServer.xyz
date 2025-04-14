import { GAME_ID_REGEX, NO_CACHE_CONTROL } from '@constants';
import { parseBasicHeader } from '@lib/parseBasicHeader';
import db from '@services/mongodb';
import { Elysia, t } from 'elysia';

// unlike in files route, this route checks the db every time
export const authRoute = new Elysia({ prefix: '/auth' }).guard(
  {
    parse: 'text',
    headers: t.Object({ authorization: t.String({ minLength: 56, maxLength: 512 }) }),
  },

  app =>
    app
      .get('', async ({ set, error, headers }) => {
        set.headers['cache-control'] = NO_CACHE_CONTROL;

        const [userId, password] = parseBasicHeader(headers.authorization);
        if (!GAME_ID_REGEX.test(userId)) {
          set.status = 400;
          return 'Invalid userId!';
        }

        const dbAuth = await db.Auth.findById(userId, { hash: 1 });
        if (dbAuth === null) {
          set.status = 204;
          return;
        }

        const verified = await Bun.password.verify(password, dbAuth.hash);
        if (!verified) return error('Unauthorized');

        return 'Authenticated';
      })

      .put(
        '',
        async ({ set, error, headers, body: newPassword }) => {
          set.headers['cache-control'] = NO_CACHE_CONTROL;

          const [userId, password] = parseBasicHeader(headers.authorization);
          if (!GAME_ID_REGEX.test(userId)) {
            set.status = 400;
            return 'Invalid userId!';
          }

          const dbAuth = await db.Auth.findById(userId, { hash: 1 });
          if (dbAuth === null) {
            const hash = await Bun.password.hash(newPassword);
            await db.Auth.create({ _id: userId, hash });
            return 'Successfully assinged a new password';
          }

          const verified = await Bun.password.verify(password, dbAuth.hash);
          if (!verified) return error('Unauthorized');

          dbAuth.hash = await Bun.password.hash(newPassword);
          await dbAuth.save();
          return 'Successfully updated password';
        },
        {
          body: t.String({ minLength: 6, maxLength: 256 }),
        }
      )
);
