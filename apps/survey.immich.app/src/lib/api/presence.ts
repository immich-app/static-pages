import type { LiveCounts } from '../types';

export interface PresenceConnection {
  close(): void;
}

export function connectPresence(
  slug: string,
  type: 'viewer' | 'respondent',
  onCounts?: (counts: LiveCounts) => void,
): PresenceConnection {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${protocol}//${window.location.host}/api/s/${slug}/ws?type=${type}`;

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  let failures = 0;
  const MAX_FAILURES = 3;

  function connect() {
    if (closed) return;

    ws = new WebSocket(url);

    ws.onopen = () => {
      failures = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'counts' && onCounts) {
          onCounts(data);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
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
    close() {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}
