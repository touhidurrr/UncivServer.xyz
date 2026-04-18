import { BEARER_TOKEN_SCHEMA } from '@constants';
import { jwt } from '@elysiajs/jwt';
import { isValidSyncToken } from '@lib';
import { Variable } from '@models/Variable';
import { connectDB } from '@services/mongodb';
import { type } from 'arktype';
import { Elysia } from 'elysia';

export const jwtPlugin = new Elysia({ name: 'jwt', prefix: 'jwt' })
  .use(
    connectDB()
      .then(() => Variable.findById('jwt-key', { value: 1, _id: 0 }).lean())
      .then(result => {
        const secret = result?.value ?? process.env.JWT_KEY;
        return jwt({
          secret,
          exp: '1h',
          name: 'jwt',
          alg: 'HS512',
        });
      })
  )
  .get(
    ':name',
    async ({ jwt, status, params: { name }, cookie: { auth }, headers: { authorization } }) => {
      if (!isValidSyncToken(authorization)) {
        return status('Unauthorized');
      }

      const value = await jwt.sign({ name });

      auth.set({
        value,
        httpOnly: true,
        maxAge: 3600,
      });

      return value;
    },
    { headers: type({ authorization: BEARER_TOKEN_SCHEMA }) }
  )
  .post(
    'verify',
    async ({ status, jwt, body: token }) => {
      const verified = await jwt.verify(token);
      if (!verified) return status('Unauthorized');
      return 'OK';
    },
    { body: type('string.trim') }
  );
