import type { WsOperations, WsPushEvents } from '$shared/ws-protocol';

export interface SurveyWsClient {
  request<K extends keyof WsOperations>(op: K, data: WsOperations[K]['request']): Promise<WsOperations[K]['response']>;

  on<K extends keyof WsPushEvents>(event: K, callback: (data: WsPushEvents[K]) => void): () => void;

  /**
  Fires immediately with the current state on subscribe, then on each change.
  */
  onConnectionChange(callback: (state: 'connecting' | 'open' | 'closed' | 'failed') => void): () => void;

  close(): void;

  readonly connected: boolean;
}

let requestCounter = 0;

export function createSurveyWsClient(slug: string, type: 'viewer' | 'respondent' | 'editor'): SurveyWsClient {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${location.host}/api/s/${slug}/ws?type=${type}`;

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
    for (const cb of stateListeners) {cb(next);}
  }

  const pushListeners = new Map<string, Array<(data: unknown) => void>>();
  const pendingRequests = new Map<string, { resolve: (data: unknown) => void; reject: (error: Error) => void }>();

  function connect() {
    if (closed) {return;}
    setState('connecting');
    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      failures = 0;
      setState('open');
    });

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

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

        if (msg.type === 'push' && msg.event) {
          const cbs = pushListeners.get(msg.event);
          if (cbs) {for (const cb of cbs) {cb(msg.data);}}
          return;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.addEventListener('close', () => {
      for (const [, pending] of pendingRequests) {
        pending.reject(new Error('WebSocket closed'));
      }
      pendingRequests.clear();

      if (closed) {return;}
      failures++;
      if (failures < MAX_FAILURES) {
        setState('closed');
        reconnectTimer = setTimeout(connect, 3000);
      } else {
        setState('failed');
      }
    });

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
      // Capture `ws` locally: a concurrent reconnect reassigns the outer
      // binding, and listeners must come off the socket they went onto.
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
      if (!pushListeners.has(key)) {pushListeners.set(key, []);}
      const cb = callback as (data: unknown) => void;
      pushListeners.get(key)!.push(cb);
      return () => {
        const list = pushListeners.get(key);
        if (list) {
          const idx = list.indexOf(cb);
          if (idx !== -1) {list.splice(idx, 1);}
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

// Two separate registries so lookups are unambiguous: slug+type for
// survey-taking / results viewing, surveyId for admin-registered clients. A
// single map with prefix matching could return either the editor or the viewer
// connection for the same slug at random.

type WsType = 'viewer' | 'respondent' | 'editor';

const connectionsBySlug = new Map<string, SurveyWsClient>(); // key: `${slug}:${type}`
const connectionsBySurveyId = new Map<string, SurveyWsClient>();

/**
Get or create a WS client for a survey
*/
export function getSurveyWs(slug: string, type: WsType): SurveyWsClient {
  const key = `${slug}:${type}`;
  const existing = connectionsBySlug.get(key);
  if (existing?.connected) {return existing;}
  existing?.close();

  const client = createSurveyWsClient(slug, type);
  connectionsBySlug.set(key, client);
  return client;
}

/**
Get an existing WS client by survey ID (admin flows only)
*/
export function getWsClientById(surveyId: string): SurveyWsClient | undefined {
  const conn = connectionsBySurveyId.get(surveyId);
  return conn?.connected ? conn : undefined;
}

/**
Get an existing WS client by slug and type
*/
export function getWsClientBySlug(slug: string, type: WsType = 'respondent'): SurveyWsClient | undefined {
  const conn = connectionsBySlug.get(`${slug}:${type}`);
  return conn?.connected ? conn : undefined;
}

export function registerWsClient(surveyId: string, client: SurveyWsClient): void {
  connectionsBySurveyId.set(surveyId, client);
}

export function closeSurveyWs(slug: string, type: WsType): void {
  const key = `${slug}:${type}`;
  const conn = connectionsBySlug.get(key);
  if (conn) {
    conn.close();
    connectionsBySlug.delete(key);
  }
}
