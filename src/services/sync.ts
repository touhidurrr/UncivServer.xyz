const SYNC_TOKEN = process.env.SYNC_TOKEN;
const SYNC_SERVERS = process.env.SYNC_SERVERS;

const Servers = (SYNC_SERVERS ?? '').split(/[\n\s]+/).filter(Boolean);

console.info('[Sync] Servers:', Servers);

export const syncGame = (gameId: string, body: string) => {
  if (!SYNC_TOKEN || !Servers.length) return;

  const config = {
    method: 'PATCH' as const,
    body,
    headers: {
      Authorization: `Bearer ${SYNC_TOKEN}`,
      'Content-Length': Buffer.byteLength(body).toString(),
      'Content-Type': 'text/plain; charset=utf-8',
    },
  };

  Servers.forEach(api => {
    fetch(`${api}/files/${gameId}`, config)
      .then(
        res => !res.ok && console.error('[Sync] Error:', res.status, res.statusText, res.headers)
      )
      .catch(err => console.error('[Sync] Fetch Error:', err));
  });
};
