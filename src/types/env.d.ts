declare namespace NodeJS {
  export interface ProcessEnv {
    PORT?: string;
    HOST?: string;
    REDIS_URL?: string;
    REDISCLOUD_URL?: string;
    MONGO_URL?: string;
    SYNC_TOKEN?: string;
    SYNC_SERVERS?: string;
    DISCORD_TOKEN?: string;
  }
}
