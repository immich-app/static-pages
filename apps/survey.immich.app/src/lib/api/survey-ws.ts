/**
 * Typed WebSocket client for per-survey Durable Object communication.
 *
 * Provides a fully typed request/response API matching the WsOperations contract,
 * plus typed push event listeners. Falls back gracefully when WS is unavailable.
 */

import type { WsOperations, WsPushEvents } from '$shared/ws-protocol';

// ============================================================
// Client interface
// ============================================================

export interface SurveyWsClient {
  /** Send a typed request and await a typed response */
  request<K extends keyof WsOperations>(op: K, data: WsOperations[K]['request']): Promise<WsOperations[K]['response']>;

  /** Listen for push events from the server */
  on<K extends keyof WsPushEvents>(event: K, callback: (data: WsPushEvents[K]) => void): () => void;

  /** Close the connection */
  close(): void;

  /** Whether the WS is currently open */
  readonly connected: boolean;
}

// ============================================================
// Implementation
// ============================================================

let requestCounter = 0;

export function createSurveyWsClient(slug: string, type: 'viewer' | 'respondent' | 'editor'): SurveyWsClient {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/api/s/${slug}/ws?type=${type}`;

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  let failures = 0;
  const MAX_FAILURES = 3;

  const pushListeners = new Map<string, Array<(data: unknown) => void>>();
  const pendingRequests = new Map<string, { resolve: (data: unknown) => void; reject: (error: Error) => void }>();

  function connect() {
    if (closed) return;
    ws = new WebSocket(url);

    ws.onopen = () => {
      failures = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle response to a request
        if (msg.type === 'response' && msg.requestId) {
          const pending = pendingRequests.get(msg.requestId);
          if (pending) {
            pendingRequests.delete(msg.requestId);
            if (msg.error) {
              pending.reject(new Error(msg.error));
            } else {
              pending.resolve(msg.data);
            }
          }
          return;
        }

        // Handle push events
        if (msg.type === 'push' && msg.event) {
          const cbs = pushListeners.get(msg.event);
          if (cbs) for (const cb of cbs) cb(msg.data);
          return;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      for (const [, pending] of pendingRequests) {
        pending.reject(new Error('WebSocket closed'));
      }
      pendingRequests.clear();

      if (closed) return;
      failures++;
      if (failures < MAX_FAILURES) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  connect();

  return {
    get connected() {
      return ws?.readyState === WebSocket.OPEN;
    },

    async request<K extends keyof WsOperations>(
      op: K,
      data: WsOperations[K]['request'],
    ): Promise<WsOperations[K]['response']> {
      // Wait for connection if still connecting
      if (ws?.readyState === WebSocket.CONNECTING) {
        await new Promise<void>((resolve, reject) => {
          const onOpen = () => {
            ws?.removeEventListener('open', onOpen);
            ws?.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            ws?.removeEventListener('open', onOpen);
            ws?.removeEventListener('error', onError);
            reject(new Error('WebSocket connection failed'));
          };
          ws?.addEventListener('open', onOpen);
          ws?.addEventListener('error', onError);
        });
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      const requestId = `r${++requestCounter}`;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }, 30_000);

        pendingRequests.set(requestId, {
          resolve: (result) => {
            clearTimeout(timeout);
            resolve(result as WsOperations[K]['response']);
          },
          reject: (err) => {
            clearTimeout(timeout);
            reject(err);
          },
        });

        ws!.send(JSON.stringify({ type: 'request', requestId, op, data }));
      });
    },

    on<K extends keyof WsPushEvents>(event: K, callback: (data: WsPushEvents[K]) => void): () => void {
      const key = event as string;
      if (!pushListeners.has(key)) pushListeners.set(key, []);
      const cb = callback as (data: unknown) => void;
      pushListeners.get(key)!.push(cb);
      return () => {
        const list = pushListeners.get(key);
        if (list) {
          const idx = list.indexOf(cb);
          if (idx >= 0) list.splice(idx, 1);
        }
      };
    },

    close() {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}

// ============================================================
// Global connection registry
// ============================================================

const connections = new Map<string, SurveyWsClient>();

/** Get or create a WS client for a survey */
export function getSurveyWs(slug: string, type: 'viewer' | 'respondent' | 'editor'): SurveyWsClient {
  const key = `${slug}:${type}`;
  const existing = connections.get(key);
  if (existing?.connected) return existing;
  existing?.close();

  const client = createSurveyWsClient(slug, type);
  connections.set(key, client);
  return client;
}

/** Get an existing WS client by survey ID (for API modules — never creates a connection) */
export function getWsClientById(surveyId: string): SurveyWsClient | undefined {
  // Check all connection keys for this survey ID
  for (const [key, conn] of connections) {
    if (key.startsWith(surveyId + ':') && conn.connected) return conn;
  }
  return undefined;
}

/** Get an existing WS client by slug (for API modules — never creates a connection) */
export function getWsClientBySlug(slug: string): SurveyWsClient | undefined {
  for (const [key, conn] of connections) {
    if (key.startsWith(slug + ':') && conn.connected) return conn;
  }
  return undefined;
}

/** Register a connection under a survey ID (for lookup from API modules) */
export function registerWsClient(surveyId: string, client: SurveyWsClient): void {
  connections.set(`${surveyId}:id`, client);
}

/** Close and remove a WS connection */
export function closeSurveyWs(key: string): void {
  const conn = connections.get(key);
  if (conn) {
    conn.close();
    connections.delete(key);
  }
}
