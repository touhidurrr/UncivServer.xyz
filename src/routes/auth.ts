import passwordsCache from '@cache/passwordsCache';
import { NO_CACHE_CONTROL, PASSWORD_SCHEMA, UNCIV_BASIC_AUTH_HEADER_SCHEMA } from '@constants';
import { Auth } from '@models/Auth';
import { type } from 'arktype';
import type { Elysia } from 'elysia';

const updatePasswordAndEmail = async (config: {
  userId: string;
  password: string;
  email?: string;
}) => {
  const { userId, password } = config;
  const [hash, email] = await Promise.all([
    Bun.password.hash(password),
    config.email ? Bun.password.hash(config.email) : undefined,
  ]);
  await Auth.updateOne({ _id: userId }, { hash, email }, { upsert: true });
  passwordsCache.set(userId, password);
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
          async ({ set, status, headers, body }) => {
            set.headers['cache-control'] = NO_CACHE_CONTROL;

            const [userId, password] = headers.authorization;

            if (passwordsCache.has(userId)) {
              if (!passwordsCache.verify(userId, password)) return status('Unauthorized');
              await updatePasswordAndEmail({ userId, ...body });
              return 'Successfully updated password';
            }

            const dbAuth = await Auth.findById(userId, { hash: 1 }).lean();
            if (dbAuth === null) {
              await updatePasswordAndEmail({ userId, ...body });
              return 'Successfully assigned a new password';
            }

            const verified = await Bun.password.verify(password, dbAuth.hash);
            if (!verified) return status('Unauthorized');

            await updatePasswordAndEmail({ userId, ...body });
            return 'Successfully updated password';
          },
          {
            body: type.or(
              PASSWORD_SCHEMA.pipe(val => ({ password: val })),
              type({ password: PASSWORD_SCHEMA, 'email?': 'string.email <= 512' })
            ),
          }
        )
  );
