export const isValidSyncToken = (token?: string): boolean => {
  const { SYNC_TOKEN } = process.env;
  return typeof token === 'string' && token === SYNC_TOKEN;
};
