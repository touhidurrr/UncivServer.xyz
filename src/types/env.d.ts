declare namespace NodeJS {
  export interface ProcessEnv {
    PORT?: string;
    HOST?: string;
    NODE_ENV?: 'development' | 'production';
    REDIS_URL?: string;
    REDISCLOUD_URL?: string;
    MONGO_URL?: string;
    SYNC_TOKEN?: string;
    SYNC_SERVERS?: string;
    DISCORD_TOKEN?: string;
    MAX_CACHE_SIZE?: string;
    TURSO_DATABASE_URL?: string;
    TURSO_AUTH_TOKEN?: string;
  }
}
