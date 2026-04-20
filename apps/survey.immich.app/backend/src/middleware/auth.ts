import type { IRequest } from 'itty-router';
import { SESSION_COOKIE_NAME, ROLE_HIERARCHY, type UserRole } from '../constants';
import { AuthService, type UserInfo } from '../services/auth.service';
import type { AppContext } from '../config';
import { ServiceError } from '../services/errors';
import { getCookie } from '../cookie';

// Extend request with user info
export interface AuthenticatedRequest extends IRequest {
  user?: UserInfo;
}

export function authMiddleware(ctx: AppContext): (request: AuthenticatedRequest) => Promise<void | Response> {
  return async (request: AuthenticatedRequest) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // Skip auth for public routes
    if (path.startsWith('/api/s/') || path.startsWith('/api/auth/') || path.startsWith('/api/t/')) {
      return;
    }

    // All other /api/ routes require auth
    if (!path.startsWith('/api/')) return;

    const token = getCookie(request, SESSION_COOKIE_NAME);
    if (!token) {
      throw new ServiceError('Authentication required', 401);
    }

    const authService = new AuthService(ctx.config, ctx.db);
    const user = await authService.validateSessionToken(token);
    if (!user) {
      throw new ServiceError('Invalid or expired session', 401);
    }

    request.user = user;
  };
}

export function requireRole(user: UserInfo | undefined, minRole: UserRole): void {
  if (!user) throw new ServiceError('Authentication required', 401);

  if ((ROLE_HIERARCHY[user.role] ?? 0) < (ROLE_HIERARCHY[minRole] ?? 0)) {
    throw new ServiceError('Insufficient permissions', 403);
  }
}
