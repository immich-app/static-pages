import { getContext } from '../config';
import { requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { BackupService } from '../services/backup.service';
import type { AppRouter } from '../types';

export function registerBackupRoutes(router: AppRouter) {
  router.get('/api/admin/backup', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'admin');
    const ctx = getContext(request);
    const service = new BackupService(ctx.db);
    const backup = await service.exportAll();
    return Response.json(backup);
  });

  router.post('/api/admin/restore', async (request: AuthenticatedRequest) => {
    requireRole(request.user, 'admin');
    const ctx = getContext(request);
    const service = new BackupService(ctx.db);
    const body = await request.json();
    const result = await service.importAll(body);
    return Response.json(result);
  });
}
