declare namespace NodeJS {
  export interface ProcessEnv {
    PORT?: string;
    HOST?: string;
    NODE_ENV?: 'development' | 'production';
    REDIS_URL?: string;
    REDISCLOUD_URL?: string;
    JWT_KEY?: string;
    MONGO_URL?: string;
    SYNC_TOKEN?: string;
    SYNC_SERVERS?: string;
    DISCORD_TOKEN?: string;
    MAX_CACHE_SIZE?: string;
    UNIX_SOCKET_PATH?: string;
    PATREON_WEBHOOK_SECRET?: string;
    BUYMEACOFFEE_WEBHOOK_SECRET?: string;
  }
}
