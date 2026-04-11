/**
 * Typed WebSocket message dispatcher for the SurveyDO.
 * Routes incoming WS messages to the appropriate service method based on `op`.
 */

import type { WsOperations } from '../../../shared/ws-protocol';
import type { SurveyService } from '../../services/survey.service';
import type { RespondentService } from '../../services/respondent.service';
import type { SurveyCache } from '../cache';
import { ServiceError } from '../../services/errors';
import { ROLE_HIERARCHY, BATCH_ANSWER_LIMIT } from '../../constants';
import { execute, type CommandContext } from '../do-commands';
import { getPresenceCounts, scheduleBroadcast } from './ws-broadcaster';

interface Services {
  survey: SurveyService;
  respondent: RespondentService;
}

function send(ws: WebSocket, data: unknown): void {
  try {
    ws.send(JSON.stringify(data));
  } catch {
    ws.close(1011, 'send failed');
  }
}

function respond(ws: WebSocket, requestId: string, op: string, data: unknown): void {
  send(ws, { type: 'response', requestId, op, data });
}

function respondError(ws: WebSocket, requestId: string, op: string, message: string): void {
  send(ws, { type: 'response', requestId, op, error: message });
}

// Operations that require admin authentication
const ADMIN_OPS = new Set<string>(['delete-respondent']);

// Operations that require at least editor authentication (mutations + definition export)
const EDITOR_OPS = new Set<string>([
  'export-definition',
  'create-section',
  'update-section',
  'delete-section',
  'reorder-sections',
  'create-question',
  'update-question',
  'delete-question',
  'reorder-questions',
]);

// Operations that require at least viewer authentication (read-only admin queries)
const VIEWER_OPS = new Set<string>([
  'get-survey',
  'get-results',
  'get-live-results',
  'get-timeline',
  'get-dropoff',
  'get-completion-times',
  'list-respondents',
  'get-respondent',
  'search-answers',
]);

function getWsRole(ws: WebSocket, ctx: DurableObjectState): string {
  for (const tag of ctx.getTags(ws)) {
    if (tag.startsWith('role:')) return tag.slice(5);
  }
  return 'public';
}

function hasMinRole(ws: WebSocket, ctx: DurableObjectState, minRole: string): boolean {
  return (ROLE_HIERARCHY[getWsRole(ws, ctx)] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

function getWsRespondentId(ws: WebSocket, ctx: DurableObjectState): string | null {
  for (const tag of ctx.getTags(ws)) {
    if (tag.startsWith('rid:')) return tag.slice(4);
  }
  return null;
}

export async function dispatch(
  ws: WebSocket,
  message: string,
  services: Services,
  cache: SurveyCache,
  ctx: DurableObjectState,
): Promise<void> {
  let parsed: { type?: string; requestId?: string; op?: string; data?: Record<string, unknown> };
  try {
    parsed = JSON.parse(message);
  } catch {
    send(ws, { type: 'response', requestId: '', op: '', error: 'Invalid JSON' });
    return;
  }

  if (parsed.type !== 'request' || !parsed.requestId || !parsed.op) {
    send(ws, {
      type: 'response',
      requestId: parsed.requestId ?? '',
      op: parsed.op ?? '',
      error: 'Invalid message format',
    });
    return;
  }

  const { requestId, op, data } = parsed;
  const d = data ?? {};

  // Enforce authorization: check role hierarchy for protected operations
  if (ADMIN_OPS.has(op) && !hasMinRole(ws, ctx, 'admin')) {
    respondError(ws, requestId, op, 'Insufficient permissions');
    return;
  }
  if (EDITOR_OPS.has(op) && !hasMinRole(ws, ctx, 'editor')) {
    respondError(ws, requestId, op, 'Insufficient permissions');
    return;
  }
  if (VIEWER_OPS.has(op) && !hasMinRole(ws, ctx, 'viewer')) {
    respondError(ws, requestId, op, 'Insufficient permissions');
    return;
  }

  try {
    const result = await handleOp(ws, op as keyof WsOperations, d, services, cache, ctx);
    respond(ws, requestId, op, result);
  } catch (e) {
    const message = e instanceof ServiceError ? e.message : e instanceof Error ? e.message : 'Internal error';
    respondError(ws, requestId, op, message);
  }
}

async function handleOp(
  ws: WebSocket,
  op: keyof WsOperations,
  data: Record<string, unknown>,
  { survey: surveyService, respondent: respondentService }: Services,
  cache: SurveyCache,
  ctx: DurableObjectState,
): Promise<unknown> {
  const cmdCtx: CommandContext = { surveyService, respondentService, cache };

  switch (op) {
    // ---- Survey (WS-only, admin operations use full service) ----
    case 'get-survey':
      return surveyService.getSurvey(cache.survey.id);

    // ---- Results (WS uses cache for hot-path performance) ----
    case 'get-results':
      return {
        respondentCounts: cache.counters,
        results: cache.buildAggregatedResults(),
      };

    case 'get-live-results':
      return {
        respondentCounts: cache.counters,
        results: cache.buildAggregatedResults(),
        liveCounts: getPresenceCounts(ctx).data,
      };

    // ---- Public respondent (WS-only, DO fast path) ----
    case 'get-public-survey': {
      const survey = cache.survey;
      if (survey.status !== 'published') throw new ServiceError('Survey not found', 404);
      const { password_hash: _, ...safeSurvey } = survey;
      return { survey: safeSurvey, sections: cache.sections, questions: cache.questions };
    }

    case 'resume': {
      // Fast path for new users: if cache has the respondent with hasSubmitted=false,
      // we know they have zero answers — return empty state with zero SQL queries.
      //
      // Otherwise (returning user or mid-session resume after submissions), query SQL
      // for the full answer set since we only keep choice answers in memory.
      const respondentId = getWsRespondentId(ws, ctx);
      if (!respondentId) throw new ServiceError('Not a respondent connection', 401);

      const cachedState = cache.getCachedRespondent(respondentId);
      if (cachedState && !cachedState.hasSubmitted) {
        return { answers: {}, nextQuestionIndex: 0, isComplete: cachedState.isComplete, respondentId };
      }

      // Returning user or mid-session resume — read all answers from SQL
      const answerRows = ctx.storage.sql
        .exec('SELECT question_id, answer, other_text FROM answers WHERE respondent_id = ?', respondentId)
        .toArray() as Array<{ question_id: string; answer: string; other_text: string | null }>;

      const answers: Record<string, { value: string; otherText?: string }> = {};
      for (const row of answerRows) {
        answers[row.question_id] = {
          value: row.answer,
          ...(row.other_text ? { otherText: row.other_text } : {}),
        };
      }

      // Get isComplete — prefer cache if available, otherwise one more SQL by PK
      let isComplete = cachedState?.isComplete ?? false;
      if (!cachedState) {
        const row = ctx.storage.sql
          .exec('SELECT is_complete FROM respondents WHERE id = ? LIMIT 1', respondentId)
          .toArray()[0] as { is_complete: number } | undefined;
        isComplete = row?.is_complete === 1;
      }

      // Compute nextQuestionIndex from cached questions + queried answers
      const questions = cache.questions;
      let nextQuestionIndex = questions.length;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.conditional) {
          try {
            const cond = JSON.parse(q.conditional) as { showIf?: { questionId: string; condition: string } };
            if (cond.showIf?.condition === 'skipped' && cond.showIf.questionId in answers) continue;
          } catch {
            // malformed conditional — fall through
          }
        }
        if (!(q.id in answers)) {
          nextQuestionIndex = i;
          break;
        }
      }

      return { answers, nextQuestionIndex, isComplete, respondentId };
    }

    case 'submit-answers': {
      // Fast path: all validation in-memory, single batched SQL INSERT.
      const respondentId = getWsRespondentId(ws, ctx);
      if (!respondentId) throw new ServiceError('Not a respondent connection', 401);

      const survey = cache.survey;
      if (survey.closes_at && new Date(survey.closes_at) < new Date()) {
        throw new ServiceError('This survey has closed', 403);
      }

      const answers = (data as { answers?: Array<{ questionId: string; value: string; otherText?: string }> }).answers;
      if (!answers || !Array.isArray(answers) || answers.length === 0 || answers.length > BATCH_ANSWER_LIMIT) {
        throw new ServiceError(`Invalid answers payload: must be 1-${BATCH_ANSWER_LIMIT} answers`, 400);
      }

      const validQuestionIds = new Set(cache.questions.map((q) => q.id));
      for (const a of answers) {
        if (!validQuestionIds.has(a.questionId)) {
          throw new ServiceError(`Invalid question ID: ${a.questionId}`, 400);
        }
      }

      // Update in-memory state so subsequent operations (complete's tally update)
      // don't need to re-query the database
      for (const a of answers) {
        cache.setAnswer(respondentId, a.questionId, a.value, a.otherText ?? null);
      }

      // Single batched INSERT — one SQL round-trip regardless of answer count
      const now = new Date().toISOString();
      const placeholders = answers.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const values: unknown[] = [];
      for (const a of answers) {
        values.push(respondentId, a.questionId, a.value, a.otherText ?? null, now);
      }
      ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO answers (respondent_id, question_id, answer, other_text, answered_at) VALUES ${placeholders}`,
        ...values,
      );
      return {};
    }

    case 'complete': {
      // Fast path: in-memory tally update (no SQL read), single UPDATE, evict from cache
      const respondentId = getWsRespondentId(ws, ctx);
      if (!respondentId) throw new ServiceError('Not a respondent connection', 401);

      cache.markRespondentComplete(respondentId);
      cache.updateTalliesOnCompletion(respondentId); // uses in-memory answers, no SQL
      cache.incrementCompleted();

      ctx.storage.sql.exec(
        'UPDATE respondents SET is_complete = 1, completed_at = ? WHERE id = ?',
        new Date().toISOString(),
        respondentId,
      );

      // Evict after complete — they won't submit again, free the memory
      cache.removeRespondent(respondentId);

      scheduleBroadcast(ctx, cache.broadcastScheduled);
      return {};
    }

    // ---- Shared operations (section/question CRUD, results queries, definition) ----
    default: {
      const result = await execute(op, data, cmdCtx);
      if (result === null) throw new ServiceError(`Unknown operation: ${op}`, 400);
      return result ?? {};
    }
  }
}
