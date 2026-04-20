import { createSurveyService } from '../services/factory';
import { requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { getContext } from '../config';
import { MAX_PAGINATION_LIMIT } from '../constants';
import type { AppRouter } from '../types';
import type {
  CreateSurveyInput,
  UpdateSurveyInput,
  SurveyDefinition,
  CreateSectionInput,
  UpdateSectionInput,
  CreateQuestionInput,
  UpdateQuestionInput,
} from '../services/survey.service';

export function registerSurveyRoutes(router: AppRouter) {
  router.get('/api/surveys', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const url = new URL(request.url);
    const includeArchived = url.searchParams.get('archived') === 'true';
    const search = url.searchParams.get('search')?.trim() || undefined;
    const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
    const limit = Math.min(MAX_PAGINATION_LIMIT, Math.max(1, Number(url.searchParams.get('limit')) || 20));

    const result = await service.listSurveysPaginated({ includeArchived, search, offset, limit });
    return Response.json(result);
  });

  router.post('/api/surveys', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as CreateSurveyInput;
    const survey = await service.createSurvey(body);
    return Response.json(survey, { status: 201 });
  });

  router.get('/api/surveys/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'viewer');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const result = await service.getSurvey(request.params.id);
    return Response.json(result);
  });

  router.put('/api/surveys/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as UpdateSurveyInput;
    const survey = await service.updateSurvey(request.params.id, body);
    return Response.json(survey);
  });

  router.delete('/api/surveys/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'admin');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    await service.deleteSurvey(request.params.id);
    return new Response(null, { status: 204 });
  });

  router.put('/api/surveys/:id/publish', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const survey = await service.publishSurvey(request.params.id);
    return Response.json(survey);
  });

  router.put('/api/surveys/:id/unpublish', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const survey = await service.unpublishSurvey(request.params.id);
    return Response.json(survey);
  });

  router.post('/api/surveys/:id/duplicate', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const result = await service.duplicateSurvey(request.params.id);
    return Response.json(result, { status: 201 });
  });

  router.put('/api/surveys/:id/archive', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const survey = await service.archiveSurvey(request.params.id);
    return Response.json(survey);
  });

  router.put('/api/surveys/:id/unarchive', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const survey = await service.unarchiveSurvey(request.params.id);
    return Response.json(survey);
  });

  router.get('/api/surveys/:id/definition', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const def = await service.exportDefinition(request.params.id);
    return Response.json(def);
  });

  router.post('/api/surveys/import', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as SurveyDefinition;
    const result = await service.importDefinition(body);
    return Response.json(result, { status: 201 });
  });

  // Sections — nested under /api/surveys/:surveyId/sections
  router.post('/api/surveys/:id/sections', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as CreateSectionInput;
    const section = await service.createSection(request.params.id, body);
    return Response.json(section, { status: 201 });
  });

  router.put('/api/surveys/:surveyId/sections/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as UpdateSectionInput;
    const section = await service.updateSection(request.params.id, body);
    return Response.json(section);
  });

  router.delete('/api/surveys/:surveyId/sections/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    await service.deleteSection(request.params.id);
    return new Response(null, { status: 204 });
  });

  router.put('/api/surveys/:id/sections/reorder', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as { items: Array<{ id: string; sort_order: number }> };
    await service.reorderSections(request.params.id, body.items);
    return new Response(null, { status: 204 });
  });

  // Questions — nested under /api/surveys/:surveyId/
  router.post('/api/surveys/:surveyId/sections/:id/questions', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as CreateQuestionInput;
    const question = await service.createQuestion(request.params.id, body);
    return Response.json(question, { status: 201 });
  });

  router.put('/api/surveys/:surveyId/questions/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as UpdateQuestionInput;
    const question = await service.updateQuestion(request.params.id, body);
    return Response.json(question);
  });

  router.delete('/api/surveys/:surveyId/questions/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    await service.deleteQuestion(request.params.id);
    return new Response(null, { status: 204 });
  });

  router.put('/api/surveys/:surveyId/sections/:id/questions/reorder', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'editor');
    const ctx = getContext(request);
    const service = createSurveyService(ctx.db);
    const body = (await request.json()) as { items: Array<{ id: string; sort_order: number }> };
    await service.reorderQuestions(request.params.id, body.items);
    return new Response(null, { status: 204 });
  });
}
