import { SurveyService } from '../services/survey.service';
import { SurveyRepository, SectionRepository, QuestionRepository } from '../repositories/survey.repository';
import type { AppRouter } from '../types';

function createService(env: Env): SurveyService {
  return new SurveyService(new SurveyRepository(env.DB), new SectionRepository(env.DB), new QuestionRepository(env.DB));
}

export function registerSurveyRoutes(router: AppRouter) {
  router.get('/api/surveys', async (_request, env) => {
    const service = createService(env);
    const surveys = await service.listSurveys();
    return Response.json(surveys);
  });

  router.post('/api/surveys', async (request, env) => {
    const service = createService(env);
    const body = await request.json();
    const survey = await service.createSurvey(body);
    return Response.json(survey, { status: 201 });
  });

  router.get('/api/surveys/:id', async (request, env) => {
    const service = createService(env);
    const result = await service.getSurvey(request.params.id);
    return Response.json(result);
  });

  router.put('/api/surveys/:id', async (request, env) => {
    const service = createService(env);
    const body = await request.json();
    const survey = await service.updateSurvey(request.params.id, body);
    return Response.json(survey);
  });

  router.delete('/api/surveys/:id', async (_request, env) => {
    const service = createService(env);
    await service.deleteSurvey(_request.params.id);
    return new Response(null, { status: 204 });
  });

  router.put('/api/surveys/:id/publish', async (request, env) => {
    const service = createService(env);
    const survey = await service.publishSurvey(request.params.id);
    return Response.json(survey);
  });

  router.put('/api/surveys/:id/unpublish', async (request, env) => {
    const service = createService(env);
    const survey = await service.unpublishSurvey(request.params.id);
    return Response.json(survey);
  });

  router.post('/api/surveys/:id/duplicate', async (request, env) => {
    const service = createService(env);
    const result = await service.duplicateSurvey(request.params.id);
    return Response.json(result, { status: 201 });
  });

  // Sections
  router.post('/api/surveys/:id/sections', async (request, env) => {
    const service = createService(env);
    const body = await request.json();
    const section = await service.createSection(request.params.id, body);
    return Response.json(section, { status: 201 });
  });

  router.put('/api/sections/:id', async (request, env) => {
    const service = createService(env);
    const body = await request.json();
    const section = await service.updateSection(request.params.id, body);
    return Response.json(section);
  });

  router.delete('/api/sections/:id', async (request, env) => {
    const service = createService(env);
    await service.deleteSection(request.params.id);
    return new Response(null, { status: 204 });
  });

  router.put('/api/surveys/:id/sections/reorder', async (request, env) => {
    const service = createService(env);
    const body = (await request.json()) as { items: Array<{ id: string; sort_order: number }> };
    await service.reorderSections(request.params.id, body.items);
    return new Response(null, { status: 204 });
  });

  // Questions
  router.post('/api/sections/:id/questions', async (request, env) => {
    const service = createService(env);
    const body = await request.json();
    const question = await service.createQuestion(request.params.id, body);
    return Response.json(question, { status: 201 });
  });

  router.put('/api/questions/:id', async (request, env) => {
    const service = createService(env);
    const body = await request.json();
    const question = await service.updateQuestion(request.params.id, body);
    return Response.json(question);
  });

  router.delete('/api/questions/:id', async (request, env) => {
    const service = createService(env);
    await service.deleteQuestion(request.params.id);
    return new Response(null, { status: 204 });
  });

  router.put('/api/sections/:id/questions/reorder', async (request, env) => {
    const service = createService(env);
    const body = (await request.json()) as { items: Array<{ id: string; sort_order: number }> };
    await service.reorderQuestions(request.params.id, body.items);
    return new Response(null, { status: 204 });
  });
}
