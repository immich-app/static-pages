import { request } from './request';

export interface AuditEntry {
  id: string;
  user_sub: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export async function getAuditLog(offset = 0, limit = 50): Promise<{ entries: AuditEntry[]; total: number }> {
  return request(`/api/audit-log?offset=${offset}&limit=${limit}`);
}

export async function getSurveyAuditLog(
  surveyId: string,
  offset = 0,
  limit = 50,
): Promise<{ entries: AuditEntry[]; total: number }> {
  return request(`/api/audit-log/survey/${surveyId}?offset=${offset}&limit=${limit}`);
}
