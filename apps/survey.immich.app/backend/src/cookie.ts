const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function getCookieName(slug: string): string {
  return `rid_${slug}`;
}

export function getRespondentId(request: Request, slug: string): string | undefined {
  const cookieName = getCookieName(slug);
  const header = request.headers.get('Cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  return match?.[1];
}

export function setRespondentCookie(headers: Headers, slug: string, respondentId: string): void {
  const cookieName = getCookieName(slug);
  headers.set(
    'Set-Cookie',
    `${cookieName}=${respondentId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
  );
}

export function deleteRespondentCookie(headers: Headers, slug: string): void {
  const cookieName = getCookieName(slug);
  headers.set('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
