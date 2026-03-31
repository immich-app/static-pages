import type { Kysely } from 'kysely';
import type { Database } from '../db';

export interface BackupData {
  version: number;
  exportedAt: string;
  data: {
    surveys: unknown[];
    survey_sections: unknown[];
    survey_questions: unknown[];
    respondents: unknown[];
    answers: unknown[];
    tags: unknown[];
    survey_tags: unknown[];
    audit_log: unknown[];
    admin_credentials: unknown[];
  };
}

export class BackupService {
  constructor(private db: Kysely<Database>) {}

  async exportAll(): Promise<BackupData> {
    const [surveys, sections, questions, respondents, answers, tags, surveyTags, auditLog, adminCredentials] =
      await Promise.all([
        this.db.selectFrom('surveys').selectAll().execute(),
        this.db.selectFrom('survey_sections').selectAll().execute(),
        this.db.selectFrom('survey_questions').selectAll().execute(),
        this.db.selectFrom('respondents').selectAll().execute(),
        this.db.selectFrom('answers').selectAll().execute(),
        this.db.selectFrom('tags').selectAll().execute(),
        this.db.selectFrom('survey_tags').selectAll().execute(),
        this.db.selectFrom('audit_log').selectAll().execute(),
        this.db.selectFrom('admin_credentials').selectAll().execute(),
      ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        surveys,
        survey_sections: sections,
        survey_questions: questions,
        respondents,
        answers,
        tags,
        survey_tags: surveyTags,
        audit_log: auditLog,
        admin_credentials: adminCredentials,
      },
    };
  }

  async importAll(backup: BackupData): Promise<{ counts: Record<string, number> }> {
    if (backup.version !== 1) {
      throw new Error(`Unsupported backup version: ${backup.version}`);
    }

    const counts: Record<string, number> = {};

    // Delete in reverse FK order
    await this.db.deleteFrom('answers').execute();
    await this.db.deleteFrom('respondents').execute();
    await this.db.deleteFrom('survey_tags').execute();
    await this.db.deleteFrom('survey_questions').execute();
    await this.db.deleteFrom('survey_sections').execute();
    await this.db.deleteFrom('surveys').execute();
    await this.db.deleteFrom('tags').execute();
    await this.db.deleteFrom('audit_log').execute();
    await this.db.deleteFrom('admin_credentials').execute();

    // Insert in FK order
    const tables: Array<[keyof BackupData['data'], string]> = [
      ['surveys', 'surveys'],
      ['survey_sections', 'survey_sections'],
      ['survey_questions', 'survey_questions'],
      ['tags', 'tags'],
      ['survey_tags', 'survey_tags'],
      ['respondents', 'respondents'],
      ['answers', 'answers'],
      ['audit_log', 'audit_log'],
      ['admin_credentials', 'admin_credentials'],
    ];

    for (const [key, table] of tables) {
      const rows = backup.data[key] as Record<string, unknown>[];
      if (rows && rows.length > 0) {
        for (const row of rows) {
          await this.db
            .insertInto(table as any)
            .values(row as any)
            .execute();
        }
        counts[table] = rows.length;
      } else {
        counts[table] = 0;
      }
    }

    return { counts };
  }
}
