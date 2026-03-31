import { RespondentService } from '../services/respondent.service';
import { RespondentRepository, AnswerRepository } from '../repositories/respondent.repository';
import { SurveyRepository, QuestionRepository } from '../repositories/survey.repository';
import type { AppRouter } from '../types';

function createService(env: Env): RespondentService {
  return new RespondentService(
    new RespondentRepository(env.DB),
    new AnswerRepository(env.DB),
    new SurveyRepository(env.DB),
    new QuestionRepository(env.DB),
  );
}

export function registerResultRoutes(router: AppRouter) {
  router.get('/api/surveys/:id/results', async (request, env) => {
    const service = createService(env);
    const results = await service.getResults(request.params.id);
    return Response.json(results);
  });

  router.get('/api/surveys/:id/results/export', async (request, env) => {
    const service = createService(env);
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    if (format !== 'csv' && format !== 'json') {
      return Response.json({ error: 'format must be csv or json' }, { status: 400 });
    }
    const result = await service.exportResponses(request.params.id, format);
    return new Response(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  });
}
