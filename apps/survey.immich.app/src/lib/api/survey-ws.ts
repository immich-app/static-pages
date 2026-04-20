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

  /**
   * Listen for connection lifecycle changes (e.g. to surface a "lost
   * connection" toast and clear it on reconnect). Fires immediately with
   * the current state on subscribe.
   */
  onConnectionChange(callback: (state: 'connecting' | 'open' | 'closed' | 'failed') => void): () => void;

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

  type ConnState = 'connecting' | 'open' | 'closed' | 'failed';
  let state: ConnState = 'connecting';
  const stateListeners = new Set<(s: ConnState) => void>();
  function setState(next: ConnState) {
    state = next;
    for (const cb of stateListeners) cb(next);
  }

  const pushListeners = new Map<string, Array<(data: unknown) => void>>();
  const pendingRequests = new Map<string, { resolve: (data: unknown) => void; reject: (error: Error) => void }>();

  function connect() {
    if (closed) return;
    setState('connecting');
    ws = new WebSocket(url);

    ws.onopen = () => {
      failures = 0;
      setState('open');
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
        setState('closed');
        reconnectTimer = setTimeout(connect, 3000);
      } else {
        setState('failed');
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
      // Wait for connection if still connecting. We capture `ws` into a local
      // so a concurrent reconnect that reassigns the outer binding can't make
      // us remove listeners from the wrong socket.
      if (ws?.readyState === WebSocket.CONNECTING) {
        const socket = ws;
        await new Promise<void>((resolve, reject) => {
          const onOpen = () => {
            socket.removeEventListener('open', onOpen);
            socket.removeEventListener('error', onError);
            socket.removeEventListener('close', onClose);
            resolve();
          };
          const onError = () => {
            socket.removeEventListener('open', onOpen);
            socket.removeEventListener('error', onError);
            socket.removeEventListener('close', onClose);
            reject(new Error('WebSocket connection failed'));
          };
          const onClose = onError;
          socket.addEventListener('open', onOpen);
          socket.addEventListener('error', onError);
          socket.addEventListener('close', onClose);
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

    onConnectionChange(callback: (s: ConnState) => void): () => void {
      stateListeners.add(callback);
      callback(state);
      return () => {
        stateListeners.delete(callback);
      };
    },

    close() {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
      setState('closed');
    },
  };
}

// ============================================================
// Global connection registry
//
// Two separate maps so lookups are unambiguous: slug+type for survey-taking
// / results viewing, surveyId for admin-registered clients (viewer WS in
// the results page, editor WS in the builder). Previously a single map
// used startsWith() prefix matching which could return either an editor
// or a viewer connection for the same slug at random.
// ============================================================

type WsType = 'viewer' | 'respondent' | 'editor';

const connectionsBySlug = new Map<string, SurveyWsClient>(); // key: `${slug}:${type}`
const connectionsBySurveyId = new Map<string, SurveyWsClient>(); // key: surveyId

/** Get or create a WS client for a survey */
export function getSurveyWs(slug: string, type: WsType): SurveyWsClient {
  const key = `${slug}:${type}`;
  const existing = connectionsBySlug.get(key);
  if (existing?.connected) return existing;
  existing?.close();

  const client = createSurveyWsClient(slug, type);
  connectionsBySlug.set(key, client);
  return client;
}

/** Get an existing WS client by survey ID (admin flows only) */
export function getWsClientById(surveyId: string): SurveyWsClient | undefined {
  const conn = connectionsBySurveyId.get(surveyId);
  return conn?.connected ? conn : undefined;
}

/** Get an existing WS client by slug and type */
export function getWsClientBySlug(slug: string, type: WsType = 'respondent'): SurveyWsClient | undefined {
  const conn = connectionsBySlug.get(`${slug}:${type}`);
  return conn?.connected ? conn : undefined;
}

/** Register a connection under a survey ID (for lookup from API modules) */
export function registerWsClient(surveyId: string, client: SurveyWsClient): void {
  connectionsBySurveyId.set(surveyId, client);
}

/** Close and remove a WS connection */
export function closeSurveyWs(slug: string, type: WsType): void {
  const key = `${slug}:${type}`;
  const conn = connectionsBySlug.get(key);
  if (conn) {
    conn.close();
    connectionsBySlug.delete(key);
  }
}
