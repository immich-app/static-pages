/**
 * WebSocket broadcaster for the SurveyDO.
 * Sends presence counts, stats, and results to all viewer connections.
 */

import type { SurveyCache } from '../cache';

const BROADCAST_INTERVAL_MS = 5000;

export function getPresenceCounts(ctx: DurableObjectState): {
  type: 'push';
  event: 'counts';
  data: { activeViewers: number; activeRespondents: number };
} {
  return {
    type: 'push',
    event: 'counts',
    data: {
      activeViewers: ctx.getWebSockets('viewer').length,
      activeRespondents: ctx.getWebSockets('respondent').length,
    },
  };
}

export function broadcastToViewers(ctx: DurableObjectState, cache: SurveyCache): void {
  const viewers = ctx.getWebSockets('viewer');
  if (viewers.length === 0) return;

  const counts = getPresenceCounts(ctx, activeRespondents);
  const counters = cache.counters;
  const stats = {
    type: 'push' as const,
    event: 'stats' as const,
    data: {
      total: counters.total,
      completed: counters.completed,
      completionRate: counters.total > 0 ? Math.round((counters.completed / counters.total) * 100) : 0,
    },
  };
  const results = {
    type: 'push' as const,
    event: 'results' as const,
    data: {
      respondentCounts: counters,
      results: cache.buildAggregatedResults(),
    },
  };

  for (const ws of viewers) {
    try {
      ws.send(JSON.stringify(counts));
      ws.send(JSON.stringify(stats));
      ws.send(JSON.stringify(results));
    } catch {
      ws.close(1011, 'send failed');
    }
  }
}

export function scheduleBroadcast(ctx: DurableObjectState, scheduled: { value: boolean }): void {
  if (scheduled.value) return;
  scheduled.value = true;
  ctx.storage.setAlarm(Date.now() + BROADCAST_INTERVAL_MS);
}
