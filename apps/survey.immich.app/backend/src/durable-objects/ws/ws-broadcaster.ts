/**
 * WebSocket broadcaster for the SurveyDO.
 *
 * Two-tier broadcast model:
 *
 *   1. FAST tier — every 5s. Pure in-memory data (presence, counts, choice
 *      results). Free to run, no SQL. Handles the hot path of live results.
 *
 *   2. SLOW tier — every 60s. Runs the small number of SQL aggregations that
 *      can't be maintained incrementally in memory (drop-off, timeline,
 *      completion-time histogram). Computed ONCE per minute by the DO and
 *      fanned out to every connected viewer in a single broadcast — so N
 *      viewers never become N queries. If there are zero viewers the slow
 *      tier is skipped entirely.
 */

import type { RespondentService } from '../../services/respondent.service';
import type { SurveyCache } from '../cache';
import { BROADCAST_FAST_INTERVAL_MS, BROADCAST_SLOW_TICKS_PER_CYCLE } from '../../constants';

const BROADCAST_INTERVAL_MS = BROADCAST_FAST_INTERVAL_MS;
/** Slow tier fires every N fast ticks (default 12 × 5s = 60s). */
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
  // Broadcast results use buildChoiceResults (in-memory only, no SQL).
  // Text/textarea/email/number questions are NOT included — the frontend merges
  // these with the existing results from the initial HTTP load.
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

/**
 * Slow-tier broadcast: runs once per minute, computes the SQL-backed analytics
 * one time on the DO side, and pushes the result to every connected viewer.
 *
 * This is the whole point of the two-tier model: the alternative would be each
 * of the N viewers running their own dropoff/timeline queries on every stats
 * update, which tanks SQLite under load. Here it's one query set per minute,
 * regardless of viewer count.
 *
 * Skipped entirely when there are no viewers connected.
 */
export async function broadcastSlowAnalytics(
  ctx: DurableObjectState,
  surveyId: string,
  respondents: RespondentService,
): Promise<void> {
  const viewers = ctx.getWebSockets('viewer');
  if (viewers.length === 0) return;

  // Run all four analytics queries in parallel against the DO's SQLite.
  // Dropoff joins answers+respondents, timeline groups respondents by minute,
  // completion-times scans completed respondents, question-timings scans
  // answers with a non-null answer_ms.
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
