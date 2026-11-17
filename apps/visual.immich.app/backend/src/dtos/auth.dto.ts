import { z } from 'zod';
import { Constants } from '../constants';
import type { UserResponseDto } from './user.dto';

const JsonSchema = z.string().transform((value, context) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    context.addIssue({ code: 'custom', message: 'Invalid JSON' });

    return z.NEVER;
  }
});

export const LoginQuerySchema = z.object({ returnTo: z.string().optional() });

export const LoginStateSchema = z.object({
  state: z.string(),
  nonce: z.string(),
  codeVerifier: z.string(),
  returnTo: z.string(),
});
export type LoginStateDto = z.infer<typeof LoginStateSchema>;

export const CallbackQuerySchema = z.object({ code: z.string().min(1), state: z.string().min(1) });
export const CallbackCookieSchema = z.object({
  [Constants.Cookies.OAuthState.Name]: JsonSchema.pipe(LoginStateSchema),
});

export type AuthDto = { sessionId: string; user: UserResponseDto };
