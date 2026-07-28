import type { WebSocket } from 'ws';

const BROADCAST_INTERVAL_MS = 5000;

interface SurveyRoom {
  viewers: Set<WebSocket>;
  respondents: Set<WebSocket>;
  broadcastTimer: ReturnType<typeof setTimeout> | undefined;
}

const rooms = new Map<string, SurveyRoom>();

function getRoom(slug: string): SurveyRoom {
  let room = rooms.get(slug);
  if (!room) {
    room = { viewers: new Set(), respondents: new Set(), broadcastTimer: undefined };
    rooms.set(slug, room);
  }
  return room;
}

function countsMessage(room: SurveyRoom): string {
  return JSON.stringify({
    type: 'push',
    event: 'counts',
    data: {
      activeViewers: room.viewers.size,
      activeRespondents: room.respondents.size,
    },
  });
}

function scheduleBroadcast(room: SurveyRoom) {
  if (room.broadcastTimer) return;
  room.broadcastTimer = setTimeout(() => {
    room.broadcastTimer = undefined;
    const msg = countsMessage(room);
    for (const ws of room.viewers) {
      try {
        ws.send(msg);
      } catch {
        // will trigger close
      }
    }
  }, BROADCAST_INTERVAL_MS);
}

function cleanupRoom(slug: string, room: SurveyRoom) {
  if (room.viewers.size === 0 && room.respondents.size === 0) {
    clearTimeout(room.broadcastTimer);
    rooms.delete(slug);
  }
}

export function handlePresenceUpgrade(ws: WebSocket, slug: string, type: 'viewer' | 'respondent'): void {
  const room = getRoom(slug);
  const set = type === 'viewer' ? room.viewers : room.respondents;
  set.add(ws);

  // Send current counts immediately to the new connection
  ws.send(countsMessage(room));

  // Debounced broadcast to other viewers
  scheduleBroadcast(room);

  ws.on('message', (raw) => {
    let msg: { type?: string; requestId?: string } | undefined;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
    } catch {
      return;
    }
    if (msg?.type === 'request' && msg.requestId) {
      try {
        ws.send(
          JSON.stringify({
            type: 'response',
            requestId: msg.requestId,
            error: 'WebSocket command operations are not supported in self-hosted mode',
          }),
        );
      } catch {
        // Socket already closing — nothing to do.
      }
    }
  });

  ws.on('close', () => {
    set.delete(ws);
    scheduleBroadcast(room);
    cleanupRoom(slug, room);
  });

  ws.on('error', () => {
    set.delete(ws);
    scheduleBroadcast(room);
    cleanupRoom(slug, room);
  });
}
