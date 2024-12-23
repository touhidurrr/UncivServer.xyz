import type { SYNC_MESSAGE_SCHEMA } from '@routes/sync';
import type { Static } from 'elysia';
import random from 'random';
import cache from './cache';

const SYNC_TOKEN = process.env.SYNC_TOKEN;
const SYNC_SERVERS = process.env.SYNC_SERVERS ?? '';

const Servers: Record<string, WebSocket> = {};

// initialize a websocket connection with a sync server
const initWs = (baseURL: string) => {
  const ws = new WebSocket(`${baseURL}/sync`, {
    headers: { Authorization: `Bearer ${SYNC_TOKEN}` },
    perMessageDeflate: true,
  });

  let authOk = true;
  let maxReconnectionAttempts = 100;

  ws.addEventListener('open', () => {
    console.info(`[Sync] Connected established with ${baseURL}`);
  });

  ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data.toString('utf8')) as Static<typeof SYNC_MESSAGE_SCHEMA>;
    switch (msg.type) {
      case 'SyncData':
        cache.set(msg.data.gameId, msg.data.content);
        break;
      case 'AuthError':
        authOk = false;
        console.error(`[Sync] Invalid auth attempt to ${baseURL}`);
        break;
      default:
        console.warn(`[Sync] Unknown sync message:`, msg);
        break;
    }
  });

  ws.addEventListener('close', ({ code, reason }) => {
    console.error(`[Sync] Connection closed:`, { code, reason, server: baseURL });

    if (!authOk || maxReconnectionAttempts < 1) return;
    setTimeout(
      () => {
        maxReconnectionAttempts--;
        console.info(`[Sync] Reconnecting to:`, baseURL);
        Servers[baseURL] = initWs(baseURL);
      },
      random.int(5_000, 10_000)
    );
  });

  ws.addEventListener('error', err => {
    console.error(`[Sync] Error conversing with ${baseURL}:`, err);
  });

  return ws;
};

// establish connections with all sync servers
SYNC_SERVERS.split(/[\n\s]+/)
  .filter(Boolean)
  .forEach(baseURL => {
    Servers[baseURL] = initWs(baseURL);
  });

console.info('[Sync] Servers:', Object.keys(Servers));
