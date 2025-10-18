import type { SYNC_RESPONSE_SCHEMA } from '@routes/sync';
import { randInt } from 'randomcryp';
import cache from './cache';

const SYNC_TOKEN = process.env.SYNC_TOKEN;
const SYNC_SERVERS = process.env.SYNC_SERVERS ?? '';

const Servers: Record<string, WebSocket> = {};

const MAX_RECONNECTION_ATTEMPTS = 100;

// initialize a websocket connection with a sync server
const initWs = (baseURL: string) => {
  const ws = new WebSocket(`${baseURL}/sync`, {
    headers: { Authorization: `Bearer ${SYNC_TOKEN}` },
  });

  let authOk = true;
  let reconnectionAttemptsLeft = MAX_RECONNECTION_ATTEMPTS;

  ws.addEventListener('open', () => {
    console.info(`[Sync] Connection established with ${baseURL}.`);
    reconnectionAttemptsLeft = MAX_RECONNECTION_ATTEMPTS;
  });

  ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data.toString('utf8')) as typeof SYNC_RESPONSE_SCHEMA.infer;
    switch (msg.type) {
      case 'SyncData':
        cache.set(msg.data.gameId, msg.data.content);
        break;
      case 'AuthError':
        authOk = false;
        console.error(`[Sync] Invalid auth attempt to ${baseURL}!`);
        break;
      default:
        console.warn(`[Sync] Unknown sync message:`, msg);
        break;
    }
  });

  ws.addEventListener('close', ({ code, reason }) => {
    console.error(`[Sync] Connection closed:`, { code, reason, server: baseURL });

    if (!authOk || reconnectionAttemptsLeft < 1) return;
    setTimeout(
      () => {
        reconnectionAttemptsLeft--;
        console.info(`[Sync] Reconnecting to:`, baseURL);
        Servers[baseURL] = initWs(baseURL);
      },
      randInt(5_000, 10_000)
    );
  });

  ws.addEventListener('error', console.error);

  return ws;
};

// establish connections with all sync servers
SYNC_SERVERS.split(/[\n\s]+/)
  .filter(Boolean)
  .forEach(baseURL => {
    Servers[baseURL] = initWs(baseURL);
  });

console.info('[Sync] Servers:', Object.keys(Servers));
