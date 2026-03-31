import { getMe } from '$lib/api/auth';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

let user = $state<AuthUser | null>(null);
let loading = $state(true);
let checked = $state(false);
let needsSetup = $state(false);
let oidcEnabled = $state(false);
let passwordEnabled = $state(true);

export async function initAuth(): Promise<void> {
  if (checked) return;
  loading = true;
  try {
    const result = await getMe();
    if (result.needsSetup) {
      needsSetup = true;
    } else if (result.authenticated && result.user) {
      user = result.user;
    }
    oidcEnabled = result.oidcEnabled ?? false;
    passwordEnabled = result.passwordEnabled ?? true;
  } catch {
    // not authenticated
  }
  loading = false;
  checked = true;
}

export async function refreshAuth(): Promise<void> {
  checked = false;
  user = null;
  needsSetup = false;
  await initAuth();
}

export function getAuth() {
  return {
    get user() {
      return user;
    },
    get loading() {
      return loading;
    },
    get isAuthenticated() {
      return !!user;
    },
    get needsSetup() {
      return needsSetup;
    },
    get oidcEnabled() {
      return oidcEnabled;
    },
    get passwordEnabled() {
      return passwordEnabled;
    },
    get role() {
      return user?.role ?? null;
    },
    hasRole(minRole: UserRole): boolean {
      if (!user) return false;
      const hierarchy: Record<UserRole, number> = { admin: 3, editor: 2, viewer: 1 };
      return hierarchy[user.role] >= hierarchy[minRole];
    },
  };
}
