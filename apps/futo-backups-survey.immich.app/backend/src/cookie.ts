const COOKIE_NAME = 'respondent_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function getRespondentId(request: Request): string | undefined {
  const header = request.headers.get('Cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match?.[1];
}

export function setRespondentCookie(headers: Headers, respondentId: string): void {
  headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=${respondentId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
  );
}

export function deleteRespondentCookie(headers: Headers): void {
  headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}
