import { TagRepository } from '../repositories/tag.repository';
import { TagService } from '../services/tag.service';
import { requireRole, type AuthenticatedRequest } from '../middleware/auth';
import type { AppRouter } from '../types';

function createService(env: Env): TagService {
  return new TagService(new TagRepository(env.DB));
}

export function registerTagRoutes(router: AppRouter) {
  router.get('/api/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'viewer');
    const service = createService(env);
    const tags = await service.listTags();
    return Response.json(tags);
  });

  router.post('/api/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'editor');
    const service = createService(env);
    const body = await request.json();
    const tag = await service.createTag(body);
    return Response.json(tag, { status: 201 });
  });

  router.put('/api/tags/:id', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'editor');
    const service = createService(env);
    const body = await request.json();
    const tag = await service.updateTag(request.params.id, body);
    return Response.json(tag);
  });

  router.delete('/api/tags/:id', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'admin');
    const service = createService(env);
    await service.deleteTag(request.params.id);
    return new Response(null, { status: 204 });
  });

  router.get('/api/surveys/:id/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'viewer');
    const service = createService(env);
    const tags = await service.getTagsForSurvey(request.params.id);
    return Response.json(tags);
  });

  router.put('/api/surveys/:id/tags', async (request: AuthenticatedRequest, env) => {
    requireRole(request.user, 'editor');
    const service = createService(env);
    const body = (await request.json()) as { tagIds: string[] };
    await service.setTagsForSurvey(request.params.id, body.tagIds ?? []);
    return new Response(null, { status: 204 });
  });
}
