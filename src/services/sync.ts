import type { CachedGame } from '../models/cache';

const SYNC_TOKEN = process.env.SYNC_TOKEN;
const SYNC_SERVERS = process.env.SYNC_SERVERS;

const Servers = (SYNC_SERVERS ?? '').split(/[\n\s]+/).filter(Boolean);

console.info('[Sync] Servers:', Servers);

export async function syncGame(gameId: string, cachedGame: CachedGame) {
  if (!SYNC_TOKEN || !Servers.length) return;
  const body = JSON.stringify(cachedGame);

  const config = {
    method: 'PATCH' as const,
    body,
    headers: {
      Authorization: `Bearer ${SYNC_TOKEN}`,
      'Content-Length': Buffer.byteLength(body).toString(),
      'Content-Type': 'application/json; charset=utf-8',
    },
  };

  Servers.forEach(api => {
    fetch(`${api}/files/${gameId}`, config)
      .then(async res => !res.ok && console.error('[Sync] Error:', await res.text()))
      .catch(err => console.error('[Sync] Error:', err));
  });
}
