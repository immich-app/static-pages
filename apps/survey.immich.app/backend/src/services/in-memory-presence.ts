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

// Match the wire shape the client's WS handler understands: a push event
// ({ type: 'push', event: 'counts', data }). The DO broadcaster emits this same
// shape in Workers mode; a bare { type: 'counts', ... } would be silently
// dropped by the client, so self-hosted live counts would never update.
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

  // This Node presence server only tracks presence — it does NOT implement the
  // WsOperations request/response protocol (that lives in the Durable Object in
  // Workers mode). Answer any command request with an error so the client fails
  // over to HTTP immediately instead of blocking on its 30s request timeout
  // (which otherwise stalls every respondent's survey load and all viewer data
  // fetches on self-hosted deployments).
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
