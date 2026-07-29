export function toClientSurvey<T extends { password_hash?: string | null }>(
  survey: T,
): Omit<T, 'password_hash'> & { has_password: boolean } {
  const { password_hash, ...rest } = survey;
  return { ...rest, has_password: !!password_hash };
}
