import { createAuditService } from '../services/factory';
import { MAX_PAGINATION_LIMIT } from '../constants';
import { requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { getContext } from '../config';
import type { AppRouter } from '../types';

export function registerAuditRoutes(router: AppRouter) {
  router.get('/api/audit-log', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'admin');
    const ctx = getContext(request);
    const service = createAuditService(ctx.db);
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, MAX_PAGINATION_LIMIT);
    const data = await service.list(offset, limit);
    return Response.json(data);
  });

  router.get('/api/audit-log/survey/:id', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'admin');
    const ctx = getContext(request);
    const service = createAuditService(ctx.db);
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get('offset')) || 0;
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, MAX_PAGINATION_LIMIT);
    const data = await service.listBySurvey(request.params.id, offset, limit);
    return Response.json(data);
  });
}
