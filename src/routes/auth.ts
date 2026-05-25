import passwordsCache from '@cache/passwordsCache';
import {
  NO_CACHE_CONTROL,
  PASSWORD_SCHEMA,
  UNCIV_BASIC_AUTH_HEADER_SCHEMA,
  UUID_SCHEMA,
} from '@constants';
import { getRandomBase64String, passwordResetEmailHtml } from '@lib';
import { Auth } from '@models/Auth';
import { brevo } from '@services/brevo';
import { type } from 'arktype';
import type { Elysia } from 'elysia';

const RESET_BACKOFF_BASE_MS = 60 * 1000;
const RESET_BACKOFF_MAX_MS = 24 * 3600 * 1000;

const updatePasswordAndEmail = async (config: {
  userId: string;
  password?: string;
  email?: string;
  upsert?: boolean;
}) => {
  const { userId, password, upsert } = config;
  const [hash, email] = await Promise.all([
    password ? Bun.password.hash(password) : undefined,
    config.email ? Bun.password.hash(config.email) : undefined,
  ]);

  const set: { hash?: string; email?: string } = {};
  if (hash) set.hash = hash;
  if (email) set.email = email;
  if (!set.hash && !set.email) return;

  await Auth.updateOne(
    { _id: userId },
    { $set: set, $unset: { resetAttempts: 1, resetLockedUntil: 1, resetLockMs: 1 } },
    { upsert }
  );
  if (password) passwordsCache.set(userId, password);
};

// unlike in files route, this route checks the db every time
export const authRoute = (app: Elysia) =>
  app
    .post(
      '/auth/reset',
      async ({ set, status, body: { userId, email } }) => {
        set.headers['cache-control'] = NO_CACHE_CONTROL;

        const dbAuth = await Auth.findById(userId, {
          email: 1,
          resetAttempts: 1,
          resetLockedUntil: 1,
        }).lean();

        if (dbAuth === null) return status('Not Found', `No account for UUID: ${userId}`);
        if (!dbAuth.email) return status('Not Found', `Email not set for UUID: ${userId}`);

        if (dbAuth.resetLockedUntil && dbAuth.resetLockedUntil > new Date()) {
          const retryAfter = Math.ceil((dbAuth.resetLockedUntil.getTime() - Date.now()) / 1000);
          set.headers['retry-after'] = String(retryAfter);
          return status(
            'Too Many Requests',
            `Too many reset attempts. Try again after ${dbAuth.resetLockedUntil.toISOString()}.`
          );
        }

        const emailOk = await Bun.password.verify(email, dbAuth.email);
        if (!emailOk) {
          await Auth.updateOne({ _id: userId }, [
            {
              $set: {
                resetAttempts: { $add: [{ $ifNull: ['$resetAttempts', 0] }, 1] },
                resetLockMs: {
                  $min: [
                    {
                      $multiply: [{ $ifNull: ['$resetLockMs', RESET_BACKOFF_BASE_MS / 2] }, 2],
                    },
                    RESET_BACKOFF_MAX_MS,
                  ],
                },
              },
            },
            {
              $set: {
                resetLockedUntil: { $add: ['$$NOW', '$resetLockMs'] },
              },
            },
          ]);
          return status('Unauthorized', 'The provided email is incorrect!');
        }

        if (!brevo) {
          return status('Service Unavailable', 'The server cannot send emails at this moment');
        }

        const newPassword = getRandomBase64String(16, 'base64url');

        try {
          await brevo.sendTransacEmail({
            sender: {
              name: 'UncivServer.xyz',
              email: 'no-reply@uncivserver.xyz',
            },
            to: [{ email }],
            subject: 'Your UncivServer.xyz password has been reset',
            htmlContent: passwordResetEmailHtml({ userId, newPassword }),
          });
        } catch (err) {
          console.error('[POST /auth/reset] Brevo send failed:', err);
          return status(
            'Service Unavailable',
            "Failed to send password reset email. It's not you, its us. Please try again later."
          );
        }

        const newHash = await Bun.password.hash(newPassword);
        await Auth.updateOne(
          { _id: userId },
          {
            $set: { hash: newHash },
            $unset: { resetAttempts: 1, resetLockedUntil: 1, resetLockMs: 1 },
          }
        );
        passwordsCache.set(userId, newPassword);

        return 'Password reset successfully. A new password has been sent to your email.';
      },
      {
        body: type({
          userId: UUID_SCHEMA,
          email: 'string.email <= 512',
        }),
      }
    )
    .guard(
      { headers: UNCIV_BASIC_AUTH_HEADER_SCHEMA },

      app =>
        app
          .get('/auth', async ({ set, status, headers }) => {
            set.headers['cache-control'] = NO_CACHE_CONTROL;

            const [userId, password] = headers.authorization;

            if (passwordsCache.has(userId)) {
              if (passwordsCache.verify(userId, password)) return 'Authenticated';
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
                return 'Information updated successfully';
              }

              const dbAuth = await Auth.findById(userId, { hash: 1 }).lean();
              if (dbAuth === null) {
                if (!body.password) {
                  return status('Bad Request', 'Password is required to create an account');
                }
                await updatePasswordAndEmail({ userId, ...body, upsert: true });
                return 'Information added successfully';
              }

              const verified = await Bun.password.verify(password, dbAuth.hash);
              if (!verified) return status('Unauthorized');

              await updatePasswordAndEmail({ userId, ...body });
              return 'Information updated successfully';
            },
            {
              body: type.or(
                type({ 'password?': PASSWORD_SCHEMA, 'email?': 'string.email <= 512' }).narrow(
                  (val, ctx) =>
                    !!val.password || !!val.email || ctx.mustBe('an object with password or email')
                ),
                PASSWORD_SCHEMA.pipe(val => ({ password: val }))
              ),
            }
          )
    );
