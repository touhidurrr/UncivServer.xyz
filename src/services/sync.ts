const SYNC_TOKEN = process.env.SYNC_TOKEN;
const SYNC_SERVERS = process.env.SYNC_SERVERS;

const Servers = (SYNC_SERVERS ?? '').split(/[\n\s]+/).filter(Boolean);

Servers.forEach(server => {
  Bun.dns.prefetch(server);
});

console.info('[Sync] Servers:', Servers);

export async function syncGame(gameId: string, body: string) {
  if (!SYNC_TOKEN || !Servers.length) return;
  Servers.forEach(api => {
    fetch(`${api}/files/${gameId}`, {
      method: 'PATCH',
      body,
      headers: {
        Authorization: `Bearer ${SYNC_TOKEN}`,
        'Content-Length': body.length.toString(),
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
      .then(async res => !res.ok && console.error('[Sync] Error:', await res.text()))
      .catch(err => console.error('[Sync] Error:', err));
  });
}
