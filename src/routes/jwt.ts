import db from '@services/mongodb';
import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';

export const jwtPlugin = new Elysia({ name: 'jwt', prefix: 'jwt' })
  .use(
    db.Variable.findById('jwt-key', { value: 1, _id: 0 }).then(v =>
      jwt({
        name: 'jwt',
        exp: '1d',
        alg: 'HS512',
        secret: v!.value,
      })
    )
  )
  .get(
    ':name',
    async ({ jwt, status, params: { name }, cookie: { auth }, headers: { authorization } }) => {
      const token = authorization.replace(/^bearer\s+/i, '');
      if (token !== process.env.SYNC_TOKEN!) {
        return status('Unauthorized');
      }

      const value = await jwt.sign({ name });

      auth.set({
        value,
        httpOnly: true,
        maxAge: 86400,
      });

      return value;
    },
    { headers: t.Object({ authorization: t.RegExp(/^bearer\s+.+$/i, {}) }) }
  );
