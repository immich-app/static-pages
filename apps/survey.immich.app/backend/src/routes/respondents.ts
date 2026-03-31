import { RespondentService } from '../services/respondent.service';
import { SurveyService } from '../services/survey.service';
import { RespondentRepository, AnswerRepository } from '../repositories/respondent.repository';
import { SurveyRepository, SectionRepository, QuestionRepository } from '../repositories/survey.repository';
import { getRespondentId, setRespondentCookie, deleteRespondentCookie } from '../cookie';
import type { AppRouter } from '../types';

function createRespondentService(env: Env): RespondentService {
  return new RespondentService(
    new RespondentRepository(env.DB),
    new AnswerRepository(env.DB),
    new SurveyRepository(env.DB),
    new QuestionRepository(env.DB),
  );
}

function createSurveyService(env: Env): SurveyService {
  return new SurveyService(new SurveyRepository(env.DB), new SectionRepository(env.DB), new QuestionRepository(env.DB));
}

export function registerRespondentRoutes(router: AppRouter) {
  router.get('/api/s/:slug', async (request, env) => {
    const service = createSurveyService(env);
    const result = await service.getPublishedSurvey(request.params.slug);
    return Response.json(result);
  });

  router.get('/api/s/:slug/resume', async (request, env) => {
    const service = createRespondentService(env);
    const slug = request.params.slug;
    const respondentId = getRespondentId(request, slug);
    const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown';

    const result = await service.resume(slug, respondentId, ip);
    const headers = new Headers();

    if (result.isNewRespondent) {
      setRespondentCookie(headers, slug, result.respondentId);
    }

    return Response.json(
      {
        answers: result.answers,
        nextQuestionIndex: result.nextQuestionIndex,
        isComplete: result.isComplete,
      },
      { headers },
    );
  });

  router.post('/api/s/:slug/answers/batch', async (request, env) => {
    const service = createRespondentService(env);
    const slug = request.params.slug;
    const respondentId = getRespondentId(request, slug);

    if (!respondentId) {
      return new Response('No respondent cookie', { status: 400 });
    }

    const { answers } = (await request.json()) as {
      answers: Array<{ questionId: string; value: string; otherText?: string }>;
    };

    await service.submitBatch(slug, respondentId, answers);
    return new Response(null, { status: 204 });
  });

  router.post('/api/s/:slug/complete', async (request, env) => {
    const service = createRespondentService(env);
    const slug = request.params.slug;
    const respondentId = getRespondentId(request, slug);

    if (!respondentId) {
      return new Response('No respondent cookie', { status: 400 });
    }

    await service.complete(slug, respondentId);
    return new Response(null, { status: 204 });
  });

  router.post('/api/s/:slug/reset', async (request) => {
    const headers = new Headers();
    deleteRespondentCookie(headers, request.params.slug);
    return new Response(null, { status: 204, headers });
  });
}
