import passwordsCache from '@cache/passwordsCache';
import { NO_CACHE_CONTROL, PASSWORD_SCHEMA, UNCIV_BASIC_AUTH_HEADER_SCHEMA } from '@constants';
import { getRandomBase64String, passwordResetEmailHtml } from '@lib';
import { Auth } from '@models/Auth';
import { brevo } from '@services/brevo';
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

        .post(
          '/auth/reset',
          async ({ set, status, headers, body: email }) => {
            set.headers['cache-control'] = NO_CACHE_CONTROL;

            const [userId, password] = headers.authorization;

            const dbAuth = await Auth.findById(userId, { hash: 1, email: 1 }).lean();
            if (dbAuth === null) {
              await Bun.sleep(50);
              return status('Unauthorized');
            }

            const passwordOk = await Bun.password.verify(password, dbAuth.hash);
            if (!passwordOk) return status('Unauthorized');

            if (!dbAuth.email) return status('Not Found', `Email not set for UUID: ${userId}`);

            const emailOk = await Bun.password.verify(email, dbAuth.email);
            if (!emailOk) return status('Unauthorized', 'The provided email is incorrect!');

            if (!brevo) {
              return status('Service Unavailable', 'The server cannot send emails at this moment');
            }

            const newPassword = getRandomBase64String(16, 'base64url');

            await brevo.transactionalEmails.sendTransacEmail({
              sender: {
                name: 'UncivServer.xyz',
                email: 'no-reply@uncivserver.xyz',
              },
              to: [{ email }],
              subject: 'Your UncivServer.xyz password has been reset',
              htmlContent: passwordResetEmailHtml({ userId, newPassword }),
            });

            const newHash = await Bun.password.hash(newPassword);
            await Auth.updateOne({ _id: userId }, { hash: newHash });
            passwordsCache.set(userId, newPassword);

            return 'Password reset successfully. A new password has been sent to your email.';
          },
          { body: type('string.email <= 512') }
        )
  );
