/**
 * Typed WebSocket message dispatcher for the SurveyDO.
 * Routes incoming WS messages to the appropriate service method based on `op`.
 */

import type { WsOperations } from '../../../shared/ws-protocol';
import type { SurveyService } from '../../services/survey.service';
import type { RespondentService } from '../../services/respondent.service';
import type { SurveyCache } from '../cache';
import { ServiceError } from '../../services/errors';
import { getPresenceCounts } from './ws-broadcaster';

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

  try {
    const result = await handleOp(op as keyof WsOperations, d, services, cache, ctx);
    respond(ws, requestId, op, result);
  } catch (e) {
    const message = e instanceof ServiceError ? e.message : e instanceof Error ? e.message : 'Internal error';
    respondError(ws, requestId, op, message);
  }
}

async function handleOp(
  op: keyof WsOperations,
  data: Record<string, unknown>,
  { survey: surveyService, respondent: respondentService }: Services,
  cache: SurveyCache,
  ctx: DurableObjectState,
): Promise<unknown> {
  const surveyId = cache.survey.id;

  switch (op) {
    // ---- Survey ----
    case 'get-survey':
      return surveyService.getSurvey(surveyId);

    case 'export-definition':
      return surveyService.exportDefinition(surveyId);

    // ---- Sections ----
    case 'create-section': {
      const result = await surveyService.createSection(surveyId, data as { title: string; description?: string });
      cache.invalidateSurvey();
      return result;
    }
    case 'update-section': {
      const { id, ...input } = data as { id: string; title?: string; description?: string };
      const result = await surveyService.updateSection(id, input);
      cache.invalidateSurvey();
      return result;
    }
    case 'delete-section': {
      await surveyService.deleteSection(data.id as string);
      cache.invalidateSurvey();
      return {};
    }
    case 'reorder-sections': {
      await surveyService.reorderSections(
        surveyId,
        (data as { items: Array<{ id: string; sort_order: number }> }).items,
      );
      cache.invalidateSurvey();
      return {};
    }

    // ---- Questions ----
    case 'create-question': {
      const { sectionId, ...input } = data as { sectionId: string; [key: string]: unknown };
      const result = await surveyService.createQuestion(
        sectionId,
        input as Parameters<typeof surveyService.createQuestion>[1],
      );
      cache.invalidateSurvey();
      cache.invalidateResults();
      return result;
    }
    case 'update-question': {
      const { id, ...input } = data as { id: string; [key: string]: unknown };
      const result = await surveyService.updateQuestion(
        id,
        input as Parameters<typeof surveyService.updateQuestion>[1],
      );
      cache.invalidateSurvey();
      return result;
    }
    case 'delete-question': {
      await surveyService.deleteQuestion(data.id as string);
      cache.invalidateSurvey();
      cache.invalidateResults();
      return {};
    }
    case 'reorder-questions': {
      const { sectionId, items } = data as { sectionId: string; items: Array<{ id: string; sort_order: number }> };
      await surveyService.reorderQuestions(sectionId, items);
      cache.invalidateSurvey();
      return {};
    }

    // ---- Results ----
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

    case 'get-timeline': {
      const granularity = (data.granularity as 'day' | 'hour') || 'day';
      return respondentService.getTimeline(surveyId, granularity);
    }

    case 'get-dropoff':
      return respondentService.getDropoff(surveyId);

    case 'list-respondents': {
      const offset = Number(data.offset ?? 0);
      const limit = Math.min(Number(data.limit ?? 20), 100);
      return respondentService.listRespondents(surveyId, offset, limit);
    }

    case 'get-respondent':
      return respondentService.getRespondentDetail(surveyId, data.respondentId as string);

    case 'delete-respondent': {
      await respondentService.deleteRespondent(surveyId, data.respondentId as string);
      cache.invalidateResults();
      return {};
    }

    case 'search-answers': {
      const { query, questionId, offset, limit } = data as {
        query: string;
        questionId?: string;
        offset?: number;
        limit?: number;
      };
      return respondentService.searchAnswers(surveyId, query, questionId, { offset: offset ?? 0, limit: limit ?? 50 });
    }

    // ---- Public respondent ----
    case 'get-public-survey': {
      const survey = cache.survey;
      if (survey.status !== 'published') throw new ServiceError('Survey not found', 404);
      const { password_hash: _, ...safeSurvey } = survey;
      return { survey: safeSurvey, sections: cache.sections, questions: cache.questions };
    }

    case 'submit-answers': {
      const answers = (data as { answers: Array<{ questionId: string; value: string; otherText?: string }> }).answers;
      const respondentId = data.respondentId as string;
      if (!respondentId) throw new ServiceError('No respondent ID', 400);
      await respondentService.submitBatch(cache.survey.slug!, respondentId, answers);
      return {};
    }

    case 'complete': {
      const respondentId = data.respondentId as string;
      if (!respondentId) throw new ServiceError('No respondent ID', 400);
      await respondentService.complete(cache.survey.slug!, respondentId);
      cache.incrementCompleted();
      cache.updateTalliesOnCompletion(respondentId);
      return {};
    }

    default:
      throw new ServiceError(`Unknown operation: ${op}`, 400);
  }
}
