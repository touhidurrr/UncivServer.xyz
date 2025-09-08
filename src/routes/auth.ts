import { AUTH_HEADER_SCHEMA, NO_CACHE_CONTROL, UUID_REGEX } from '@constants';
import { parseBasicHeader } from '@lib/parseBasicHeader';
import db from '@services/mongodb';
import { type Elysia, t } from 'elysia';

// unlike in files route, this route checks the db every time
export const authRoute = (app: Elysia) =>
  app.guard(
    { parse: 'text', headers: AUTH_HEADER_SCHEMA },

    app =>
      app
        .get('/auth', async ({ set, status, headers }) => {
          set.headers['cache-control'] = NO_CACHE_CONTROL;

          const [userId, password] = parseBasicHeader(headers.authorization);
          if (!UUID_REGEX.test(userId)) return status(400, 'Invalid userId!');

          const dbAuth = await db.Auth.findById(userId, { hash: 1 });
          if (dbAuth === null) return status(204);

          const verified = await Bun.password.verify(password, dbAuth.hash);
          if (!verified) return status('Unauthorized');

          return 'Authenticated';
        })

        .put(
          '/auth',
          async ({ set, status, headers, body: newPassword }) => {
            set.headers['cache-control'] = NO_CACHE_CONTROL;

            const [userId, password] = parseBasicHeader(headers.authorization);
            if (!UUID_REGEX.test(userId)) return status(400, 'Invalid userId!');

            const dbAuth = await db.Auth.findById(userId, { hash: 1 });
            if (dbAuth === null) {
              const hash = await Bun.password.hash(newPassword);
              await db.Auth.create({ _id: userId, hash });
              return 'Successfully assigned a new password';
            }

            const verified = await Bun.password.verify(password, dbAuth.hash);
            if (!verified) return status('Unauthorized');

            dbAuth.hash = await Bun.password.hash(newPassword);
            await dbAuth.save();
            return 'Successfully updated password';
          },
          {
            body: t.String({ minLength: 6, maxLength: 256 }),
          }
        )
  );
