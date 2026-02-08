import { type } from 'arktype';
import bytes from 'bytes';
import { stringify as stringifyCacheControl } from 'cache-control-parser';
import type { APIEmbed } from 'discord-api-types/v10';

// IsAlive
export const IS_ALIVE = { authVersion: 1, chatVersion: 1 };

// Utils
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = !IS_PRODUCTION;

// Server
export const DEFAULT_PORT = '1557';
export const DEFAULT_HOST = '::';
export const MIN_CONTENT_LENGTH = bytes.parse('6b')!;
export const MAX_CONTENT_LENGTH = bytes.parse('2mb')!;

// Redis
export const REDIS_DEFAULT_URL = '0.0.0.0:6379';

// Cache
export const CACHE_MAX_ITEMS = 5_000;
export const CACHE_MAX_SIZE = bytes.parse('100mb');
export const CACHE_TTL_SECONDS = 30 * 60;
export const CACHE_TTL_MILLISECONDS = CACHE_TTL_SECONDS * 1000;
export const CACHE_TTL_CHECK_INTERVAL_SECONDS = 60;
export const CACHE_TTL_CHECK_INTERVAL_MILLISECONDS = CACHE_TTL_CHECK_INTERVAL_SECONDS * 1000;
export const FILES_CACHE_MAX_ITEMS = 10_000;

export const FILES_CACHE_MAX_SIZE = bytes.parse('150mb')!;

// Files

export const MIN_FILE_SIZE = Math.max(MIN_CONTENT_LENGTH, bytes.parse('10b')!);

export const MAX_FILE_SIZE = Math.min(MAX_CONTENT_LENGTH, bytes.parse('2mb')!);

// Auth
export const NUMERIC_REGEX = /^\d+$/;
export const UUID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;
export const UUID_SCHEMA = type('string.lower').pipe(type(UUID_REGEX));
export const GAME_ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/;
export const GAME_ID_SCHEMA = type.or(
  type.string.exactlyLength(36).pipe(UUID_SCHEMA),
  type.string.exactlyLength(44).pipe(
    val => [val.slice(0, 36), val.slice(36)],
    type([UUID_SCHEMA, "'_Preview'"]),
    val => val.join('')
  )
);
export const BEARER_TOKEN_SCHEMA = type(/^bearer\s+/i).pipe(val =>
  val.replace(/^bearer\s+/i, '').trimEnd()
);
export const UNCIV_BASIC_AUTH_HEADER_SCHEMA = type({
  authorization: type
    .pipe(
      type(/^basic\s+/i),
      val => val.replace(/^basic\s+/i, '').trimEnd(),
      type('string.base64 <= 1024'),
      val => Buffer.from(val, 'base64').toString()
    )
    .pipe((val, ctx) => {
      const sepIdx = val.indexOf(':');
      if (sepIdx < 0) {
        return ctx.error('valid basic auth header');
      }

      const userId = UUID_SCHEMA(val.slice(0, sepIdx));
      if (userId instanceof type.errors) {
        return ctx.error('valid UUID');
      }

      const password = val.slice(sepIdx + 1);
      return [userId, password] as const;
    }),
});
export const STRING_BOOL_SCHEMA = type("'' | 'y' | 'n' | 'true' | 'false'")
  .pipe(s => s === 'y' || s === 'true')
  .default('');

// Test
export const START_TEST_TIMEOUT = 30_000;
export const START_TEST_FETCH_TIMEOUT = 1_000;
export const START_TEST_FETCH_RETRY_INTERVAL = 500;
export const TEST_GAME_ID = '00000000-0000-0000-0000-000000000000';

// Support
export const SUPPORT_CHANNEL_NAME = 'Buy Me A Coffee';
export const SUPPORT_URL = 'https://buymeacoffee.com/touhidurrr';
export const SUPPORT_MESSAGE = `Enjoying UncivServer.xyz? Consider supporting the project at https://uncivserver.xyz/support !`;
export const SUPPORT_EMBED_MESSAGE = `Enjoying **UncivServer.xyz**? Consider supporting the project at [${SUPPORT_CHANNEL_NAME}](${SUPPORT_URL})!`;

export const SUPPORT_EMBED: Readonly<APIEmbed> = Object.freeze({
  title: 'Support the Project',
  description: SUPPORT_EMBED_MESSAGE,
  color: 0xffdd00,
});

// Misc
export const DISCORD_INVITE = 'https://discord.gg/cdDhexB6qh';

// Cache control
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

// Chat
export const MAX_CHAT_MESSAGE_LENGTH = 1024;

// Rating System
export const INITIAL_MU = 1000;
export const INITIAL_SIGMA = 235;
export const DISPLAY_Z = 1.65;
export const MIN_RATING = 100;
export const MAX_AFK_SIGMA = 200;
