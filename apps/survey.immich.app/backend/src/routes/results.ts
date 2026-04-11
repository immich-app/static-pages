import { createRespondentService } from '../services/factory';
import { ServiceError } from '../services/errors';
import { MAX_PAGINATION_LIMIT } from '../constants';
import { requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { getContext } from '../config';
import type { AppRouter } from '../types';

export function registerResultRoutes(router: AppRouter) {
  router.get('/api/surveys/:id/results', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const results = await service.getResults(request.params.id);
    return Response.json(results);
  });

  router.get('/api/surveys/:id/results/export', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    if (format !== 'csv' && format !== 'json') {
      throw new ServiceError('format must be csv or json', 400);
    }
    const result = await service.exportResponses(request.params.id, format);
    return new Response(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  });

  router.get('/api/surveys/:id/results/live', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const results = await service.getLiveResults(request.params.id);

    const etag = `"${results.respondentCounts.completed}-${results.respondentCounts.total}-${results.liveCounts.activeRespondents}-${results.liveCounts.activeViewers}"`;
    const ifNoneMatch = request.headers.get('If-None-Match');

    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    const response = Response.json(results);
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, no-cache');
    return response;
  });

  router.get('/api/surveys/:id/results/timeline', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const url = new URL(request.url);
    const raw = url.searchParams.get('granularity');
    const granularity: 'minute' | 'hour' | 'day' = raw === 'minute' ? 'minute' : raw === 'hour' ? 'hour' : 'day';
    const data = await service.getTimeline(request.params.id, granularity);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/completion-times', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const data = await service.getCompletionTimes(request.params.id);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/dropoff', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const data = await service.getDropoff(request.params.id);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/respondents', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, MAX_PAGINATION_LIMIT);
    const data = await service.listRespondents(request.params.id, offset, limit);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/respondents/:rid', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const data = await service.getRespondentDetail(request.params.id, request.params.rid);
    return Response.json(data);
  });

  router.delete('/api/surveys/:id/results/respondents/:rid', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'admin');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    await service.deleteRespondent(request.params.id, request.params.rid);
    return new Response(null, { status: 204 });
  });

  router.get('/api/surveys/:id/results/search', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const url = new URL(request.url);
    const query = url.searchParams.get('q') ?? '';
    const questionId = url.searchParams.get('questionId') ?? undefined;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, MAX_PAGINATION_LIMIT);
    const data = await service.searchAnswers(request.params.id, query, questionId, { offset, limit });
    return Response.json(data);
  });
}
