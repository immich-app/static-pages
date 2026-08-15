import type { Kysely } from 'kysely';
import type { Database } from '../db';

export type { AuditLogRow } from '../db';

export class AuditRepository {
  constructor(private db: Kysely<Database>) {}

  async create(entry: import('../db').AuditLogRow): Promise<void> {
    await this.db.insertInto('audit_log').values(entry).execute();
  }

  async list(offset: number, limit: number): Promise<{ entries: import('../db').AuditLogRow[]; total: number }> {
    const countResult = await this.db
      .selectFrom('audit_log')
      .select(this.db.fn.countAll().as('total'))
      .executeTakeFirst();
    const entries = await this.db
      .selectFrom('audit_log')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
    return { entries, total: Number(countResult?.total ?? 0) };
  }

  async listBySurvey(
    surveyId: string,
    offset: number,
    limit: number,
  ): Promise<{ entries: import('../db').AuditLogRow[]; total: number }> {
    const countResult = await this.db
      .selectFrom('audit_log')
      .select(this.db.fn.countAll().as('total'))
      .where('resource_type', '=', 'survey')
      .where('resource_id', '=', surveyId)
      .executeTakeFirst();
    const entries = await this.db
      .selectFrom('audit_log')
      .selectAll()
      .where('resource_type', '=', 'survey')
      .where('resource_id', '=', surveyId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
    return { entries, total: Number(countResult?.total ?? 0) };
  }
}
