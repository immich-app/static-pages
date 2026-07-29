/**
 * Two-tier broadcast model for the SurveyDO:
 *
 *   FAST (5s)  — presence, counters and choice results; pure in-memory, no SQL.
 *   SLOW (60s) — the SQL aggregations that can't be maintained incrementally
 *                (drop-off, timeline, completion times). Computed once per cycle
 *                and fanned out, so N viewers never become N query sets.
 *
 * Both tiers are skipped entirely when no viewer is connected.
 */

import type { RespondentService } from '../../services/respondent.service';
import type { SurveyCache } from '../cache';
import { BROADCAST_FAST_INTERVAL_MS, BROADCAST_SLOW_TICKS_PER_CYCLE } from '../../constants';

const BROADCAST_INTERVAL_MS = BROADCAST_FAST_INTERVAL_MS;
const SLOW_TICKS_PER_CYCLE = BROADCAST_SLOW_TICKS_PER_CYCLE;

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

  const counts = getPresenceCounts(ctx);
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
      results: cache.buildChoiceResults(),
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

export async function broadcastSlowAnalytics(
  ctx: DurableObjectState,
  surveyId: string,
  respondents: RespondentService,
): Promise<void> {
  const viewers = ctx.getWebSockets('viewer');
  if (viewers.length === 0) return;

  const [timeline, dropoff, completionTimes, questionTimings] = await Promise.all([
    respondents.getTimeline(surveyId, 'minute'),
    respondents.getDropoff(surveyId),
    respondents.getCompletionTimes(surveyId),
    respondents.getQuestionTimings(surveyId),
  ]);

  const payload = {
    type: 'push' as const,
    event: 'analytics' as const,
    data: { timeline, dropoff, completionTimes, questionTimings },
  };
  const serialized = JSON.stringify(payload);

  for (const ws of viewers) {
    try {
      ws.send(serialized);
    } catch {
      ws.close(1011, 'send failed');
    }
  }
}

export { SLOW_TICKS_PER_CYCLE };
