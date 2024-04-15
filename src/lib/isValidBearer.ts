const SYNC_TOKEN = process.env.SYNC_TOKEN;

export const isValidBearer = (bearer?: string): boolean => {
  return Boolean(SYNC_TOKEN && bearer && bearer === SYNC_TOKEN);
};
