import type { IRequest } from 'itty-router';
import { SESSION_COOKIE_NAME, type UserRole } from '../constants';
import { AuthService, type UserInfo } from '../services/auth.service';
import { createDatabase } from '../db';
import { ServiceError } from '../services/errors';

// Extend request with user info
export interface AuthenticatedRequest extends IRequest {
  user?: UserInfo;
}

function getCookie(request: IRequest, name: string): string | undefined {
  const cookies = request.headers.get('cookie') ?? '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1];
}

export function authMiddleware(env: Env): (request: AuthenticatedRequest) => Promise<void | Response> {
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

    const authService = new AuthService(env, createDatabase(env.DB));
    const user = await authService.validateSessionToken(token);
    if (!user) {
      throw new ServiceError('Invalid or expired session', 401);
    }

    request.user = user;
  };
}

export function requireRole(user: UserInfo | undefined, minRole: UserRole): void {
  if (!user) throw new ServiceError('Authentication required', 401);

  const hierarchy: Record<UserRole, number> = { admin: 3, editor: 2, viewer: 1 };
  if (hierarchy[user.role] < hierarchy[minRole]) {
    throw new ServiceError('Insufficient permissions', 403);
  }
}
