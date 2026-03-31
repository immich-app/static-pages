import { createRespondentService } from '../services/factory';
import { ServiceError } from '../services/errors';
import { MAX_PAGINATION_LIMIT } from '../constants';
import type { AppRouter } from '../types';

export function registerResultRoutes(router: AppRouter) {
  router.get('/api/surveys/:id/results', async (request, env) => {
    const service = createRespondentService(env);
    const results = await service.getResults(request.params.id);
    return Response.json(results);
  });

  router.get('/api/surveys/:id/results/export', async (request, env) => {
    const service = createRespondentService(env);
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

  router.get('/api/surveys/:id/results/live', async (request, env) => {
    const service = createRespondentService(env);
    const results = await service.getLiveResults(request.params.id);
    return Response.json(results);
  });

  router.get('/api/surveys/:id/results/timeline', async (request, env) => {
    const service = createRespondentService(env);
    const url = new URL(request.url);
    const granularity = url.searchParams.get('granularity') === 'hour' ? 'hour' : 'day';
    const data = await service.getTimeline(request.params.id, granularity);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/dropoff', async (request, env) => {
    const service = createRespondentService(env);
    const data = await service.getDropoff(request.params.id);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/respondents', async (request, env) => {
    const service = createRespondentService(env);
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 20, MAX_PAGINATION_LIMIT);
    const data = await service.listRespondents(request.params.id, offset, limit);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/respondents/:rid', async (request, env) => {
    const service = createRespondentService(env);
    const data = await service.getRespondentDetail(request.params.id, request.params.rid);
    return Response.json(data);
  });

  router.get('/api/surveys/:id/results/search', async (request, env) => {
    const service = createRespondentService(env);
    const url = new URL(request.url);
    const query = url.searchParams.get('q') ?? '';
    const questionId = url.searchParams.get('questionId') ?? undefined;
    const data = await service.searchAnswers(request.params.id, query, questionId);
    return Response.json(data);
  });
}
