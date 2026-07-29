/**
 * Commands shared by the DO's HTTP fallback path and its WebSocket handler.
 *
 * Returns `undefined` for operations with no response body, and `null` when the op
 * is unrecognized — the declared `unknown | null` return type can't express either.
 */

import type { SurveyService } from '../services/survey.service';
import type { RespondentService } from '../services/respondent.service';
import type { SurveyCache } from './cache';
import { MAX_PAGINATION_LIMIT } from '../constants';

export interface CommandContext {
  surveyService: SurveyService;
  respondentService: RespondentService;
  cache: SurveyCache;
}

export async function execute(op: string, data: Record<string, unknown>, ctx: CommandContext): Promise<unknown | null> {
  const surveyId = ctx.cache.survey.id;

  switch (op) {
    case 'create-section': {
      const result = await ctx.surveyService.createSection(surveyId, data as { title: string; description?: string });
      ctx.cache.invalidateSurvey();
      return result;
    }
    case 'update-section': {
      const { id, ...input } = data as { id: string; title?: string; description?: string };
      const result = await ctx.surveyService.updateSection(id, input);
      ctx.cache.invalidateSurvey();
      return result;
    }
    case 'delete-section': {
      await ctx.surveyService.deleteSection(data.id as string);
      ctx.cache.invalidateSurvey();
      return undefined;
    }
    case 'reorder-sections': {
      await ctx.surveyService.reorderSections(
        surveyId,
        (data as { items: Array<{ id: string; sort_order: number }> }).items,
      );
      ctx.cache.invalidateSurvey();
      return undefined;
    }

    case 'create-question': {
      const { sectionId, ...input } = data as { sectionId: string; [key: string]: unknown };
      const result = await ctx.surveyService.createQuestion(sectionId, input as any);
      ctx.cache.invalidateSurvey();
      ctx.cache.invalidateResults();
      return result;
    }
    case 'update-question': {
      const { id, ...input } = data as { id: string; [key: string]: unknown };
      const result = await ctx.surveyService.updateQuestion(id, input as any);
      ctx.cache.invalidateSurvey();
      return result;
    }
    case 'delete-question': {
      await ctx.surveyService.deleteQuestion(data.id as string);
      ctx.cache.invalidateSurvey();
      ctx.cache.invalidateResults();
      return undefined;
    }
    case 'reorder-questions': {
      const { sectionId, items } = data as { sectionId: string; items: Array<{ id: string; sort_order: number }> };
      await ctx.surveyService.reorderQuestions(sectionId, items);
      ctx.cache.invalidateSurvey();
      return undefined;
    }

    case 'get-results':
      return ctx.respondentService.getResults(surveyId);

    case 'get-timeline': {
      const raw = data.granularity;
      const granularity: 'minute' | 'hour' | 'day' = raw === 'minute' ? 'minute' : raw === 'hour' ? 'hour' : 'day';
      return ctx.respondentService.getTimeline(surveyId, granularity);
    }

    case 'get-completion-times':
      return ctx.respondentService.getCompletionTimes(surveyId);

    case 'get-question-timings':
      return ctx.respondentService.getQuestionTimings(surveyId);

    case 'get-dropoff':
      return ctx.respondentService.getDropoff(surveyId);

    case 'list-respondents': {
      const offset = Number(data.offset ?? 0);
      const limit = Math.min(Number(data.limit ?? 20), MAX_PAGINATION_LIMIT);
      return ctx.respondentService.listRespondents(surveyId, offset, limit);
    }

    case 'get-respondent':
      return ctx.respondentService.getRespondentDetail(surveyId, data.respondentId as string);

    case 'delete-respondent': {
      await ctx.respondentService.deleteRespondent(surveyId, data.respondentId as string);
      ctx.cache.invalidateResults();
      return undefined;
    }

    case 'search-answers': {
      const { query, questionId, offset, limit } = data as {
        query: string;
        questionId?: string;
        offset?: number;
        limit?: number;
      };
      return ctx.respondentService.searchAnswers(surveyId, query, questionId, {
        offset: offset ?? 0,
        limit: limit ?? 50,
      });
    }

    case 'export-definition':
      return ctx.surveyService.exportDefinition(surveyId);

    default:
      return null;
  }
}
