import { AuditRepository, type AuditLogRow } from '../repositories/audit.repository';

export interface AuditLogInput {
  userSub: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
}

export class AuditService {
  constructor(private audit: AuditRepository) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.audit.create({
      id: crypto.randomUUID(),
      user_sub: input.userSub,
      user_email: input.userEmail,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      details: input.details ?? null,
      ip_address: input.ipAddress ?? null,
      created_at: new Date().toISOString(),
    });
  }

  async list(offset: number, limit: number): Promise<{ entries: AuditLogRow[]; total: number }> {
    return this.audit.list(offset, limit);
  }

  async listBySurvey(
    surveyId: string,
    offset: number,
    limit: number,
  ): Promise<{ entries: AuditLogRow[]; total: number }> {
    return this.audit.listBySurvey(surveyId, offset, limit);
  }
}
