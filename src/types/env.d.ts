declare namespace NodeJS {
  export interface ProcessEnv {
    BRAuth?: string;
    MongoURL?: string;
    Servers?: string;
    DISCORD_TOKEN?: string;
    ReRoute?: string;
    ReRouteEndpoint?: string;
    PRODUCTION?: string;
    PATCH_KEY?: string;
  }
}
