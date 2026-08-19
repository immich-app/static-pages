import { PASSWORD_SESSION_MAX_AGE } from '../constants';
import { passwordFingerprint, signToken, verifyToken } from './crypto';

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function signedPayload(surveyId: string, exp: number, fp: string): string {
  return `${surveyId}.${exp}.${fp}`;
}

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
  const parts = token.split('.');
  if (parts.length !== 3) {return null;}
  const exp = Number(parts[0]);
  if (!Number.isInteger(exp) || !parts[1] || !parts[2]) {return null;}
  return { exp, fp: parts[1], sig: parts[2] };
}

export async function verifySurveyPasswordTokenSignature(
  token: string,
  surveyId: string,
  secret: string,
): Promise<{ valid: boolean; fingerprint?: string }> {
  const parsed = parse(token);
  if (!parsed) {return { valid: false };}
  if (parsed.exp <= nowSeconds()) {return { valid: false };}
  const ok = await verifyToken(signedPayload(surveyId, parsed.exp, parsed.fp), parsed.sig, secret);
  return ok ? { valid: true, fingerprint: parsed.fp } : { valid: false };
}

export async function verifySurveyPasswordToken(
  token: string,
  surveyId: string,
  passwordHash: string | null | undefined,
  secret: string,
): Promise<boolean> {
  const { valid, fingerprint } = await verifySurveyPasswordTokenSignature(token, surveyId, secret);
  return valid && fingerprint === passwordFingerprint(passwordHash);
}

export function fingerprintMatchesPassword(
  fingerprint: string | null | undefined,
  passwordHash: string | null | undefined,
): boolean {
  return !!fingerprint && fingerprint === passwordFingerprint(passwordHash);
}
