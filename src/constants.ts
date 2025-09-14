import bytes from 'bytes';
import { stringify as stringifyCacheControl } from 'cache-control-parser';
import type { APIEmbed } from 'discord-api-types/v10';
import { z } from 'zod';

// isAlive
export const IS_ALIVE = { authVersion: 1, chatVersion: 1 };

// utils
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = !IS_PRODUCTION;

// server
export const DEFAULT_PORT = '1557';
export const DEFAULT_HOST = '::';
export const MIN_CONTENT_LENGTH = bytes.parse('6b')!;
export const MAX_CONTENT_LENGTH = bytes.parse('2mb')!;

// redis
export const REDIS_DEFAULT_URL = '0.0.0.0:6379';

// cache
export const CACHE_MAX_ITEMS = 10_000;
export const CACHE_MAX_SIZE = bytes.parse('150mb');
export const CACHE_TTL_SECONDS = 30 * 60;
export const CACHE_TTL_MILLISECONDS = CACHE_TTL_SECONDS * 1000;
export const CACHE_TTL_CHECK_INTERVAL_SECONDS = 60;
export const CACHE_TTL_CHECK_INTERVAL_MILLISECONDS = CACHE_TTL_CHECK_INTERVAL_SECONDS * 1000;
export const FILES_CACHE_MAX_ITEMS = 10_000;
export const FILES_CACHE_MAX_SIZE = bytes.parse('150mb')!;

// files
export const MIN_FILE_SIZE = Math.max(MIN_CONTENT_LENGTH, bytes.parse('10b')!);
export const MAX_FILE_SIZE = Math.min(MAX_CONTENT_LENGTH, bytes.parse('2mb')!);

// auth
export const NUMERIC_REGEX = /^\d+$/;
export const GAME_ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/;
export const UUID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;
export const UUID_SCHEMA = z.uuid().toLowerCase();
export const BEARER_TOKEN_SCHEMA = z
  .stringFormat('BearerToken', /^bearer\s+/i)
  .transform(val => val.replace(/^bearer\s+/i, '').trimEnd());
export const BEARER_JWT_SCHEMA = BEARER_TOKEN_SCHEMA.pipe(z.jwt({ alg: 'HS512' }));
export const UNCIV_BASIC_AUTH_SCHEMA = z
  .stringFormat('BasicToken', /^basic\s+/i)
  .max(512)
  .transform((val, ctx) => {
    const userPassBase64 = val.replace(/^basic\s+/i, '').trimEnd();

    let userPass: string;
    try {
      userPass = Buffer.from(userPassBase64, 'base64').toString();
    } catch (e) {
      ctx.addIssue({
        input: val,
        code: 'invalid_format',
        format: 'base64',
      });
      return z.NEVER;
    }

    const sepIdx = userPass.indexOf(':');
    if (sepIdx < 0) {
      ctx.addIssue({
        input: userPass,
        code: 'custom',
        message: `Malformed basic auth header!`,
      });
      return z.NEVER;
    }

    const userId = userPass.slice(0, sepIdx).toLowerCase();
    if (!UUID_REGEX.test(userId)) {
      ctx.addIssue({
        input: userId,
        code: 'invalid_format',
        format: 'uuid',
        message: 'Unciv userId must be a valid UUID!',
      });
      return z.NEVER;
    }

    const password = userPass.slice(sepIdx + 1);
    return [userId, password || ''] as const;
  });
export const UNCIV_BASIC_AUTH_HEADER_SCHEMA = z.object({
  authorization: UNCIV_BASIC_AUTH_SCHEMA,
});

// test
export const START_TEST_TIMEOUT = 30_000;
export const START_TEST_FETCH_TIMEOUT = 1_000;
export const START_TEST_FETCH_RETRY_INTERVAL = 500;
export const TEST_GAME_ID = '00000000-0000-0000-0000-000000000000';

// support
export const SUPPORT_CHANNEL_NAME = 'Buy Me A Coffee';
export const SUPPORT_URL = 'https://buymeacoffee.com/touhidurrr';
export const SUPPORT_MESSAGE = `Enjoying UncivServer.xyz? Consider supporting the project at https://uncivserver.xyz/support !`;
export const SUPPORT_EMBED_MESSAGE = `Enjoying **UncivServer.xyz**? Consider supporting the project at [${SUPPORT_CHANNEL_NAME}](${SUPPORT_URL})!`;

export const SUPPORT_EMBED: Readonly<APIEmbed> = Object.freeze({
  title: 'Support the Project',
  description: SUPPORT_EMBED_MESSAGE,
  color: 0xffdd00,
});

// misc
export const DISCORD_INVITE = 'https://discord.gg/cdDhexB6qh';

// cache control
export const MINIMAL_CACHE_CONTROL = stringifyCacheControl({
  public: true,
  immutable: true,
  'max-age': 7,
  'stale-while-revalidate': 70,
});

export const NO_CACHE_CONTROL = stringifyCacheControl({
  'no-store': true,
  'no-cache': true,
});

// chat
export const MAX_CHAT_MESSAGE_LENGTH = 1024;

// rating system
export const INITIAL_MU = 1000;
export const INITIAL_SIGMA = 235;
export const DISPLAY_Z = 1.65;
export const MIN_RATING = 100;
export const MAX_AFK_SIGMA = 200;
