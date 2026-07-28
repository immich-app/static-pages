/**
 * Tokens for the per-survey password gate (`spw_<slug>` cookie).
 *
 * The token used to be a bare `HMAC(survey.id)`, which made it a permanent,
 * unrevocable bearer credential: it never expired server-side (the cookie's
 * Max-Age is only a client-side hint, so a copied value replayed forever), and
 * because the signed payload never referenced the password, changing a survey's
 * password did not invalidate tokens minted against the old one — leaving an
 * admin with no working way to cut off a leaked password's audience.
 *
 * The token now carries an explicit expiry and a fingerprint of the password it
 * was minted against, both covered by the signature:
 *
 *     cookie value = `${exp}.${fp}.${sig}`
 *     sig          = HMAC(`${surveyId}.${exp}.${fp}`, PASSWORD_SECRET)
 *
 * Verification happens in two tiers because the API worker and the Durable
 * Object know different things:
 *
 *   - The worker (index.ts) has no `password_hash`, so it checks the signature
 *     and the expiry and forwards the (now trustworthy) fingerprint to the DO
 *     in an internal header.
 *   - The DO — and the self-hosted itty-router path, which holds the survey row
 *     directly — compares that fingerprint against its own always-current
 *     `password_hash`, which is what actually enforces revocation.
 *
 * Tokens in the old format simply fail to parse and are treated as invalid,
 * which re-prompts for the password. That is the intended upgrade path.
 */

import { PASSWORD_SESSION_MAX_AGE } from '../constants';
import { passwordFingerprint, signToken, verifyToken } from './crypto';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function signedPayload(surveyId: string, exp: number, fp: string): string {
  return `${surveyId}.${exp}.${fp}`;
}

/** Mint a gate token bound to `passwordHash` and expiring in PASSWORD_SESSION_MAX_AGE. */
export async function mintSurveyPasswordToken(
  surveyId: string,
  passwordHash: string | null | undefined,
  secret: string,
): Promise<string> {
  const exp = nowSeconds() + PASSWORD_SESSION_MAX_AGE;
  const fp = passwordFingerprint(passwordHash);
  const sig = await signToken(signedPayload(surveyId, exp, fp), secret);
  return `${exp}.${fp}.${sig}`;
}

interface ParsedToken {
  exp: number;
  fp: string;
  sig: string;
}

function parse(token: string): ParsedToken | null {
  // The signature is base64, which never contains '.', so splitting on '.' is
  // unambiguous for the 3-part format.
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const exp = Number(parts[0]);
  if (!Number.isInteger(exp) || !parts[1] || !parts[2]) return null;
  return { exp, fp: parts[1], sig: parts[2] };
}

/**
 * Verify signature + expiry without knowing the survey's password hash.
 * Returns the fingerprint the token was minted with so the caller can forward
 * it to a component that *can* check it against the current password.
 */
export async function verifySurveyPasswordTokenSignature(
  token: string,
  surveyId: string,
  secret: string,
): Promise<{ valid: boolean; fingerprint?: string }> {
  const parsed = parse(token);
  if (!parsed) return { valid: false };
  if (parsed.exp <= nowSeconds()) return { valid: false };
  const ok = await verifyToken(signedPayload(surveyId, parsed.exp, parsed.fp), parsed.sig, secret);
  return ok ? { valid: true, fingerprint: parsed.fp } : { valid: false };
}

/**
 * Full verification: signature, expiry, and that the token was minted against
 * the password currently set on the survey.
 */
export async function verifySurveyPasswordToken(
  token: string,
  surveyId: string,
  passwordHash: string | null | undefined,
  secret: string,
): Promise<boolean> {
  const { valid, fingerprint } = await verifySurveyPasswordTokenSignature(token, surveyId, secret);
  return valid && fingerprint === passwordFingerprint(passwordHash);
}

/**
 * Does `fingerprint` (already signature-verified upstream) match the password
 * currently set on the survey? Used by the Durable Object, which holds the
 * authoritative `password_hash` but not the signing secret.
 */
export function fingerprintMatchesPassword(
  fingerprint: string | null | undefined,
  passwordHash: string | null | undefined,
): boolean {
  return !!fingerprint && fingerprint === passwordFingerprint(passwordHash);
}
