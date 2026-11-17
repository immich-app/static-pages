import { UserRole } from './enum';

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const OAUTH_STATE_MAX_AGE_SECONDS = 5 * 60;

export const Constants = {
  Cookies: {
    Session: {
      Name: 'visual_access_token',
      Options: { httpOnly: true, secure: true, sameSite: 'Lax', path: '/', maxAge: SESSION_MAX_AGE_SECONDS },
    },
    OAuthState: {
      Name: 'visual_oauth_state',
      Options: {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/api/auth',
        maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
      },
    },
  },
  Session: {
    MaxAgeSeconds: SESSION_MAX_AGE_SECONDS,
    TokenBytes: 32,
  },
  OAuth: {
    CallbackPath: '/api/auth/callback',
    Scope: 'openid email profile',
    Roles: [
      { claim: 'visual-approver', role: UserRole.Approver },
      { claim: 'visual-viewer', role: UserRole.Viewer },
    ],
  },
} as const;
