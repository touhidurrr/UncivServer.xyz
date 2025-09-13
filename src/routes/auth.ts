import { NO_CACHE_CONTROL, UNCIV_BASIC_AUTH_HEADER_SCHEMA } from '@constants';
import db from '@services/mongodb';
import type { Elysia } from 'elysia';
import { z } from 'zod';

// unlike in files route, this route checks the db every time
export const authRoute = (app: Elysia) =>
  app.guard(
    { parse: 'text', headers: UNCIV_BASIC_AUTH_HEADER_SCHEMA },

    app =>
      app
        .get('/auth', async ({ set, status, headers }) => {
          set.headers['cache-control'] = NO_CACHE_CONTROL;

          const [userId, password] = headers.authorization;

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

            const [userId, password] = headers.authorization;

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
            body: z.string().min(6).max(1024),
          }
        )
  );
