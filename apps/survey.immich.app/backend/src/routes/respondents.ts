import { createRespondentService, createSurveyService } from '../services/factory';
import { ServiceError } from '../services/errors';
import { getCookie, getRespondentId, setRespondentCookie, deleteRespondentCookie } from '../cookie';
import { verifyPassword, signToken, verifyToken } from '../utils/crypto';
import { PASSWORD_SESSION_MAX_AGE } from '../constants';
import { getContext, type AppContext } from '../config';
import type { SurveyRow } from '../repositories/survey.repository';
import type { AppRouter } from '../types';

async function validatePasswordSession(
  request: Request,
  slug: string,
  survey: SurveyRow,
  ctx: AppContext,
): Promise<void> {
  if (!survey.password_hash) return;

  const token = getCookie(request, `spw_${slug}`);
  if (!token || !(await verifyToken(survey.id, token, ctx.config.passwordSecret))) {
    throw new ServiceError('Authentication required', 403);
  }
}

export function registerRespondentRoutes(router: AppRouter) {
  router.get('/api/s/:slug', async (request) => {
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const result = await service.getPublishedSurvey(request.params.slug);
    const slug = request.params.slug;

    if (result.survey.password_hash) {
      const token = getCookie(request, `spw_${slug}`);
      const isAuthed = token ? await verifyToken(result.survey.id, token, ctx.config.passwordSecret) : false;

      if (!isAuthed) {
        const response = Response.json({
          survey: {
            id: result.survey.id,
            title: result.survey.title,
            description: result.survey.description,
            slug: result.survey.slug,
            status: result.survey.status,
            welcome_title: result.survey.welcome_title,
            welcome_description: result.survey.welcome_description,
          },
          sections: [],
          questions: [],
          requiresPassword: true,
        });
        response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        return response;
      }
    }

    const { password_hash: _password_hash, ...safeSurvey } = result.survey;
    const response = Response.json({ ...result, survey: safeSurvey });
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    return response;
  });

  router.post('/api/s/:slug/auth', async (request) => {
    const ctx = getContext(request);
    const slug = request.params.slug;
    const service = createSurveyService(ctx.db);
    const { survey } = await service.getPublishedSurvey(slug);

    const body = (await request.json()) as { password: string };
    if (!body.password) {
      throw new ServiceError('Password is required', 400);
    }

    if (!survey.password_hash) {
      // No password set -- still do a dummy verify to prevent timing side-channel
      await verifyPassword(body.password, 'AAAAAAAAAAAAAAAAAAAAAA==:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
      return new Response(null, { status: 204 });
    }

    const valid = await verifyPassword(body.password, survey.password_hash);
    if (!valid) {
      throw new ServiceError('Invalid password', 403);
    }

    const token = await signToken(survey.id, ctx.config.passwordSecret);
    const secure = ctx.config.cookieSecure ? 'Secure; ' : '';
    const headers = new Headers();
    headers.set(
      'Set-Cookie',
      `spw_${slug}=${token}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${PASSWORD_SESSION_MAX_AGE}`,
    );
    return new Response(null, { status: 204, headers });
  });

  router.get('/api/s/:slug/resume', async (request) => {
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const surveyService = createSurveyService(ctx.db);
    const slug = request.params.slug;

    const { survey } = await surveyService.getPublishedSurvey(slug);
    await validatePasswordSession(request, slug, survey, ctx);

    const respondentId = getRespondentId(request, slug);
    const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown';

    const result = await service.resume(slug, respondentId, ip);
    const headers = new Headers();

    if (result.isNewRespondent) {
      setRespondentCookie(headers, slug, result.respondentId, ctx.config.cookieSecure);
    }

    const response = Response.json(
      {
        answers: result.answers,
        nextQuestionIndex: result.nextQuestionIndex,
        isComplete: result.isComplete,
      },
      { headers },
    );
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  });

  router.post('/api/s/:slug/answers/batch', async (request) => {
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const surveyService = createSurveyService(ctx.db);
    const slug = request.params.slug;

    const { survey } = await surveyService.getPublishedSurvey(slug);
    await validatePasswordSession(request, slug, survey, ctx);

    const respondentId = getRespondentId(request, slug);

    if (!respondentId) {
      throw new ServiceError('No respondent cookie', 400);
    }

    const { answers } = (await request.json()) as {
      answers: Array<{ questionId: string; value: string; otherText?: string; answerMs?: number }>;
    };

    await service.submitBatch(slug, respondentId, answers);
    return new Response(null, { status: 204 });
  });

  router.post('/api/s/:slug/complete', async (request) => {
    const ctx = getContext(request);
    const service = createRespondentService(ctx.db);
    const surveyService = createSurveyService(ctx.db);
    const slug = request.params.slug;

    const { survey } = await surveyService.getPublishedSurvey(slug);
    await validatePasswordSession(request, slug, survey, ctx);

    const respondentId = getRespondentId(request, slug);

    if (!respondentId) {
      throw new ServiceError('No respondent cookie', 400);
    }

    await service.complete(slug, respondentId);
    return new Response(null, { status: 204 });
  });

  router.post('/api/s/:slug/reset', async (request) => {
    const headers = new Headers();
    const ctx = getContext(request);
    deleteRespondentCookie(headers, request.params.slug, ctx.config.cookieSecure);
    return new Response(null, { status: 204, headers });
  });
}
