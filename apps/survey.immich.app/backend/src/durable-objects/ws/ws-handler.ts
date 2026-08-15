import type { WsOperations } from '../../../../shared/ws-protocol';
import type { SurveyService } from '../../services/survey.service';
import type { RespondentService } from '../../services/respondent.service';
import type { SurveyCache } from '../cache';
import { ServiceError } from '../../services/errors';
import { toClientSurvey } from '../../utils/sanitize';
import { ROLE_HIERARCHY, BATCH_ANSWER_LIMIT, clampAnswerMs } from '../../constants';
import { validateAnswer, type QuestionSpec } from '../../../../shared/answer-validation';
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

/**
 * Declarative authorization table. Every op handled by the dispatcher MUST
 * appear here — there is no implicit default. Unmapped ops are rejected with
 * "Unknown operation" so a future op added to the switch below (or to
 * do-commands.execute) can't silently be exposed without an auth decision.
 *
 * 'public' marks respondent survey-taking ops that don't require any role.
 */
type MinRole = 'public' | 'viewer' | 'editor' | 'admin';
const OP_ROLES: Record<string, MinRole> = {
  'get-public-survey': 'public',
  resume: 'public',
  'submit-answers': 'public',
  complete: 'public',

  'delete-respondent': 'admin',

  'export-definition': 'editor',
  'create-section': 'editor',
  'update-section': 'editor',
  'delete-section': 'editor',
  'reorder-sections': 'editor',
  'create-question': 'editor',
  'update-question': 'editor',
  'delete-question': 'editor',
  'reorder-questions': 'editor',

  'get-survey': 'viewer',
  'get-results': 'viewer',
  'get-live-results': 'viewer',
  'get-timeline': 'viewer',
  'get-dropoff': 'viewer',
  'get-completion-times': 'viewer',
  'get-question-timings': 'viewer',
  'list-respondents': 'viewer',
  'get-respondent': 'viewer',
  'search-answers': 'viewer',
};

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

  const requiredRole = OP_ROLES[op];
  if (!requiredRole) {
    respondError(ws, requestId, op, `Unknown operation: ${op}`);
    return;
  }
  if (requiredRole !== 'public' && !hasMinRole(ws, ctx, requiredRole)) {
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
    case 'get-survey': {
      const detail = await surveyService.getSurvey(cache.survey.id);
      return { ...detail, survey: toClientSurvey(detail.survey) };
    }

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

    case 'get-public-survey': {
      const survey = cache.survey;
      if (survey.status !== 'published') throw new ServiceError('Survey not found', 404);
      const { password_hash: _, ...safeSurvey } = survey;
      return { survey: safeSurvey, sections: cache.sections, questions: cache.questions };
    }

    case 'resume': {
      // A cached respondent with hasSubmitted=false provably has zero answers, so we
      // can skip SQL; anything else must read SQL (only choice answers are cached).
      const respondentId = getWsRespondentId(ws, ctx);
      if (!respondentId) throw new ServiceError('Not a respondent connection', 401);

      const cachedState = cache.getCachedRespondent(respondentId);
      if (cachedState && !cachedState.hasSubmitted) {
        return { answers: {}, nextQuestionIndex: 0, isComplete: cachedState.isComplete, respondentId };
      }

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

      let isComplete = cachedState?.isComplete ?? false;
      if (!cachedState) {
        const row = ctx.storage.sql
          .exec('SELECT is_complete FROM respondents WHERE id = ? LIMIT 1', respondentId)
          .toArray()[0] as { is_complete: number } | undefined;
        isComplete = row?.is_complete === 1;
      }

      // Resume ON the last answered question (not the first unanswered one, which
      // would send the user backwards past optional questions they deliberately
      // skipped) so they can review and complete it.
      const questions = cache.questions;
      let lastAnsweredIndex = -1;
      for (let i = 0; i < questions.length; i++) {
        if (questions[i].id in answers) lastAnsweredIndex = i;
      }
      const nextQuestionIndex = Math.max(0, lastAnsweredIndex);

      return { answers, nextQuestionIndex, isComplete, respondentId };
    }

    case 'submit-answers': {
      const respondentId = getWsRespondentId(ws, ctx);
      if (!respondentId) throw new ServiceError('Not a respondent connection', 401);

      const survey = cache.survey;
      if (survey.closes_at && new Date(survey.closes_at) < new Date()) {
        throw new ServiceError('This survey has closed', 403);
      }

      // Completion is terminal (see RespondentService.submitBatch). When the cached
      // state has been evicted we must still hit SQL, or a completed respondent
      // could keep submitting answers.
      const cachedState = cache.getCachedRespondent(respondentId);
      let isComplete = cachedState?.isComplete ?? false;
      if (!cachedState) {
        const row = ctx.storage.sql
          .exec('SELECT is_complete FROM respondents WHERE id = ? LIMIT 1', respondentId)
          .toArray()[0] as { is_complete: number } | undefined;
        if (!row) throw new ServiceError('Respondent not found', 404);
        isComplete = row.is_complete === 1;
      }
      if (isComplete) throw new ServiceError('Survey already completed', 409);

      const answers = (
        data as {
          answers?: Array<{ questionId: string; value: string; otherText?: string; answerMs?: number }>;
        }
      ).answers;
      if (!answers || !Array.isArray(answers) || answers.length === 0 || answers.length > BATCH_ANSWER_LIMIT) {
        throw new ServiceError(`Invalid answers payload: must be 1-${BATCH_ANSWER_LIMIT} answers`, 400);
      }

      const questionMap = new Map(cache.questions.map((cq) => [cq.id, cq]));
      for (const a of answers) {
        const cq = questionMap.get(a.questionId);
        if (!cq) throw new ServiceError(`Invalid question ID: ${a.questionId}`, 400);
        const spec: QuestionSpec = {
          type: cq.type,
          required: cq.required === 1,
          options: cq.options ? JSON.parse(cq.options) : undefined,
          hasOther: cq.has_other === 1,
          maxLength: cq.max_length ?? undefined,
          config: cq.config ? JSON.parse(cq.config) : undefined,
        };
        const error = validateAnswer(spec, a.value, a.otherText);
        if (error) throw new ServiceError(error, 400);
      }

      for (const a of answers) {
        cache.setAnswer(respondentId, a.questionId, a.value, a.otherText ?? null);
      }

      // answer_ms is clamped via the shared helper so it stays in lockstep with the
      // HTTP path in respondent.service.
      const now = new Date().toISOString();
      const placeholders = answers.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const values: unknown[] = [];
      for (const a of answers) {
        values.push(respondentId, a.questionId, a.value, a.otherText ?? null, now, clampAnswerMs(a.answerMs));
      }
      ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO answers (respondent_id, question_id, answer, other_text, answered_at, answer_ms) VALUES ${placeholders}`,
        ...values,
      );
      return {};
    }

    case 'complete': {
      // Idempotent: a duplicate `complete` (flaky retry, malicious replay) must not
      // bump counters or rewrite completed_at — hence the 0→1 gated UPDATE and the
      // `transitioned` check around every cache mutation.
      const respondentId = getWsRespondentId(ws, ctx);
      if (!respondentId) throw new ServiceError('Not a respondent connection', 401);

      const cursor = ctx.storage.sql.exec(
        'UPDATE respondents SET is_complete = 1, completed_at = ? WHERE id = ? AND is_complete = 0',
        new Date().toISOString(),
        respondentId,
      );
      const transitioned = cursor.rowsWritten > 0;
      if (transitioned) {
        cache.markRespondentComplete(respondentId);
        cache.updateTalliesOnCompletion(respondentId);
        cache.incrementCompleted();
        cache.removeRespondent(respondentId);
        scheduleBroadcast(ctx, cache.broadcastScheduled);
      }
      return {};
    }

    default: {
      const opStr = String(op);
      const result = await execute(opStr, data, cmdCtx);
      if (result === null) throw new ServiceError(`Unknown operation: ${opStr}`, 400);
      return result ?? {};
    }
  }
}
