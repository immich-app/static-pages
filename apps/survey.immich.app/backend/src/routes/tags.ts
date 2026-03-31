import { createTagService } from '../services/factory';
import { requireRole, type AuthenticatedRequest } from '../middleware/auth';
import type { AppRouter } from '../types';

export function registerTagRoutes(router: AppRouter) {
  router.get('/api/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'viewer');
    const service = createTagService(env);
    const tags = await service.listTags();
    return Response.json(tags);
  });

  router.post('/api/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'editor');
    const service = createTagService(env);
    const body = await request.json();
    const tag = await service.createTag(body);
    return Response.json(tag, { status: 201 });
  });

  router.put('/api/tags/:id', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'editor');
    const service = createTagService(env);
    const body = await request.json();
    const tag = await service.updateTag(request.params.id, body);
    return Response.json(tag);
  });

  router.delete('/api/tags/:id', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'admin');
    const service = createTagService(env);
    await service.deleteTag(request.params.id);
    return new Response(null, { status: 204 });
  });

  router.get('/api/surveys/:id/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'viewer');
    const service = createTagService(env);
    const tags = await service.getTagsForSurvey(request.params.id);
    return Response.json(tags);
  });

  router.put('/api/surveys/:id/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'editor');
    const service = createTagService(env);
    const body = (await request.json()) as { tagIds: string[] };
    await service.setTagsForSurvey(request.params.id, body.tagIds ?? []);
    return new Response(null, { status: 204 });
  });
}
