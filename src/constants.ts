import bytes from 'bytes';
import { stringify as stringifyCacheControl } from 'cache-control-parser';
import type { APIEmbed } from 'discord-api-types/v10';

// utils
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = !isProduction;

// server
export const DEFAULT_PORT = '1557';
export const DEFAULT_HOST = '0.0.0.0';
export const MIN_CONTENT_LENGTH = bytes.parse('10b')!;
export const MAX_CONTENT_LENGTH = bytes.parse('1mb')!;

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
export const MAX_FILE_SIZE = Math.min(MAX_CONTENT_LENGTH, bytes.parse('1mb')!);

// auth
export const GAME_ID_WITH_PREVIEW_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}(_Preview)?$/;
export const GAME_ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;

// test
export const START_TEST_TIMEOUT = 30_000;
export const START_TEST_FETCH_TIMEOUT = 5_000;
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
  'max-age': 4,
  'stale-while-revalidate': 10,
});

export const NO_CACHE_CONTROL = stringifyCacheControl({
  'no-store': true,
  'no-cache': true,
});
