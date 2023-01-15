declare namespace NodeJS {
  export interface ProcessEnv {
    BRAuth?: string;
    CF_ACCOUNT_ID?: string;
    CF_KV_AUTH?: string;
    CF_KV_NAMESPACE?: string;
    MongoURL?: string;
    Servers?: string;
    DISCORD_TOKEN?: string;
    ReRoute?: string;
    ReRouteEndpoint?: string;
    PRODUCTION?: string;
  }
}
