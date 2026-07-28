/**
 * Strip a survey's password hash from anything sent to a client, replacing it
 * with the boolean the UI actually needs.
 *
 * `password_hash` is a PBKDF2 digest of a password that may be as short as 4
 * characters (see SurveyService.updateSurvey), so handing it to any admin-panel
 * user invites cheap offline cracking. `viewer` is the lowest admin role, so
 * without this every viewer could harvest the hash for every survey — and
 * password reuse makes that worse than the survey-scoped impact suggests.
 *
 * NOTE: the internal `X-Catalog-Sync` response header intentionally still
 * carries `password_hash` — the API worker consumes it to sync the D1 catalog
 * and strips the header (see cleanResponse) before the response reaches a
 * client. Only JSON *bodies* are sanitized here.
 */
export function toClientSurvey<T extends { password_hash?: string | null }>(
  survey: T,
): Omit<T, 'password_hash'> & { has_password: boolean } {
  const { password_hash, ...rest } = survey;
  return { ...rest, has_password: !!password_hash };
}
