const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export function getCookie(request: { headers: { get(name: string): string | null } }, name: string): string | undefined {
  const header = request.headers.get('Cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1];
}

export function getCookieName(slug: string): string {
  return `rid_${slug}`;
}

export function getRespondentId(request: Request, slug: string): string | undefined {
  return getCookie(request, getCookieName(slug));
}

export function setRespondentCookie(headers: Headers, slug: string, respondentId: string, secure = true): void {
  const cookieName = getCookieName(slug);
  const secureFlag = secure ? 'Secure; ' : '';
  headers.set(
    'Set-Cookie',
    `${cookieName}=${respondentId}; Path=/; HttpOnly; ${secureFlag}SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
  );
}

export function deleteRespondentCookie(headers: Headers, slug: string, secure = true): void {
  const cookieName = getCookieName(slug);
  const secureFlag = secure ? 'Secure; ' : '';
  headers.set('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; ${secureFlag}SameSite=Lax; Max-Age=0`);
}
