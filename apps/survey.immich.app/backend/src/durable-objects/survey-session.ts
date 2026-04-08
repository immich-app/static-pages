import { DurableObject } from 'cloudflare:workers';

const BROADCAST_INTERVAL_MS = 5000;

export class SurveySession extends DurableObject {
  private broadcastScheduled = false;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type !== 'viewer' && type !== 'respondent') {
      return new Response('type must be viewer or respondent', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [type]);

    // Send current counts immediately to the new connection
    server.send(JSON.stringify(this.getCounts()));

    // Schedule a broadcast to other viewers
    this.scheduleBroadcast();

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketClose() {
    this.scheduleBroadcast();
  }

  webSocketError(ws: WebSocket) {
    ws.close(1011, 'WebSocket error');
    this.scheduleBroadcast();
  }

  webSocketMessage() {
    // Presence-only — no client messages expected
  }

  async alarm() {
    this.broadcastScheduled = false;
    this.broadcast();
  }

  private getCounts() {
    return {
      type: 'counts',
      activeViewers: this.ctx.getWebSockets('viewer').length,
      activeRespondents: this.ctx.getWebSockets('respondent').length,
    };
  }

  private scheduleBroadcast() {
    if (this.broadcastScheduled) return;
    this.broadcastScheduled = true;
    this.ctx.storage.setAlarm(Date.now() + BROADCAST_INTERVAL_MS);
  }

  private broadcast() {
    const msg = JSON.stringify(this.getCounts());
    for (const ws of this.ctx.getWebSockets('viewer')) {
      try {
        ws.send(msg);
      } catch {
        ws.close(1011, 'send failed');
      }
    }
  }
}
