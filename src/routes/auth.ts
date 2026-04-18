import passwordsCache from '@cache/passwordsCache';
import { NO_CACHE_CONTROL, UNCIV_BASIC_AUTH_HEADER_SCHEMA } from '@constants';
import { Auth } from '@models/Auth';
import { type } from 'arktype';
import type { Elysia } from 'elysia';

const updatePassword = async (userId: string, newPassword: string) => {
  const hash = await Bun.password.hash(newPassword);
  await Auth.updateOne({ _id: userId }, { hash }, { upsert: true });
  passwordsCache.set(userId, newPassword);
};

// unlike in files route, this route checks the db every time
export const authRoute = (app: Elysia) =>
  app.guard(
    { parse: 'text', headers: UNCIV_BASIC_AUTH_HEADER_SCHEMA },

    app =>
      app
        .get('/auth', async ({ set, status, headers }) => {
          set.headers['cache-control'] = NO_CACHE_CONTROL;

          const [userId, password] = headers.authorization;

          if (passwordsCache.has(userId)) {
            if (passwordsCache.verify(userId, password)) {
              return 'Authenticated';
            }
            return status('Unauthorized');
          }

          const dbAuth = await Auth.findById(userId, { hash: 1 }).lean();
          if (dbAuth === null) return status(204);

          const verified = await Bun.password.verify(password, dbAuth.hash);
          if (!verified) return status('Unauthorized');

          passwordsCache.set(userId, password);
          return 'Authenticated';
        })

        .put(
          '/auth',
          async ({ set, status, headers, body: newPassword }) => {
            set.headers['cache-control'] = NO_CACHE_CONTROL;

            const [userId, password] = headers.authorization;

            if (passwordsCache.has(userId)) {
              if (!passwordsCache.verify(userId, password)) return status('Unauthorized');
              await updatePassword(userId, newPassword);
              return 'Successfully updated password';
            }

            const dbAuth = await Auth.findById(userId, { hash: 1 }).lean();
            if (dbAuth === null) {
              await updatePassword(userId, newPassword);
              return 'Successfully assigned a new password';
            }

            const verified = await Bun.password.verify(password, dbAuth.hash);
            if (!verified) return status('Unauthorized');

            await updatePassword(userId, newPassword);
            return 'Successfully updated password';
          },
          { body: type('6 <= string <= 512') }
        )
  );
