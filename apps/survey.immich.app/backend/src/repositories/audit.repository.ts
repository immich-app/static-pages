export interface AuditLogRow {
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

export class AuditRepository {
  constructor(private db: D1Database) {}

  async create(entry: AuditLogRow): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO audit_log (id, user_sub, user_email, action, resource_type, resource_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        entry.id,
        entry.user_sub,
        entry.user_email,
        entry.action,
        entry.resource_type,
        entry.resource_id,
        entry.details,
        entry.ip_address,
        entry.created_at,
      )
      .run();
  }

  async list(offset: number, limit: number): Promise<{ entries: AuditLogRow[]; total: number }> {
    const countResult = await this.db.prepare('SELECT COUNT(*) as total FROM audit_log').first<{ total: number }>();
    const result = await this.db
      .prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<AuditLogRow>();
    return { entries: result.results, total: countResult?.total ?? 0 };
  }

  async listBySurvey(
    surveyId: string,
    offset: number,
    limit: number,
  ): Promise<{ entries: AuditLogRow[]; total: number }> {
    const countResult = await this.db
      .prepare("SELECT COUNT(*) as total FROM audit_log WHERE resource_type = 'survey' AND resource_id = ?")
      .bind(surveyId)
      .first<{ total: number }>();
    const result = await this.db
      .prepare(
        "SELECT * FROM audit_log WHERE resource_type = 'survey' AND resource_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      )
      .bind(surveyId, limit, offset)
      .all<AuditLogRow>();
    return { entries: result.results, total: countResult?.total ?? 0 };
  }
}
