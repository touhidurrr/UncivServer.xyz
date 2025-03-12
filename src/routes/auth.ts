import { NO_CACHE_CONTROL } from '@constants';
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

        const dbAuth = await db.Auth.findOne({ _id: userId }, { hash: 1 });
        if (dbAuth === null) return 'Unregistered!';

        const verified = await Bun.password.verify(password, dbAuth.hash);
        if (!verified) return error('Unauthorized');

        return 'Verified!';
      })

      .put(
        '',
        async ({ set, error, headers, body: newPassword }) => {
          set.headers['cache-control'] = NO_CACHE_CONTROL;
          const [userId, password] = parseBasicHeader(headers.authorization);

          const dbAuth = await db.Auth.findOne({ _id: userId }, { hash: 1 });
          if (dbAuth === null) {
            const hash = await Bun.password.hash(newPassword);
            await db.Auth.create({ _id: userId, hash });
            return 'Successfully assinged a new password';
          }

          const verified = await Bun.password.verify(password, dbAuth.hash);
          if (!verified) return error('Unauthorized');

          const hash = await Bun.password.hash(newPassword);
          await db.Auth.updateOne({ _id: userId }, { hash });
          return 'Successfully updated password';
        },
        {
          body: t.String({ minLength: 6, maxLength: 256 }),
        }
      )
);
