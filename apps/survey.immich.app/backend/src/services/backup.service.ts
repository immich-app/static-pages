import type { Kysely } from 'kysely';
import type { Database } from '../db';

const REQUIRED_TABLES = [
  'surveys',
  'survey_sections',
  'survey_questions',
  'respondents',
  'answers',
  'tags',
  'survey_tags',
  'audit_log',
  'admin_credentials',
] as const;

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
    if (!backup || typeof backup !== 'object') {
      throw new Error('Invalid backup data');
    }
    if (backup.version !== 1) {
      throw new Error(`Unsupported backup version: ${backup.version}`);
    }
    if (!backup.data || typeof backup.data !== 'object') {
      throw new Error('Backup data is missing');
    }

    // Validate all required tables exist in backup
    for (const table of REQUIRED_TABLES) {
      if (!Array.isArray(backup.data[table])) {
        throw new Error(`Backup is missing required table: ${table}`);
      }
    }

    const counts: Record<string, number> = {};

    // Use transaction for atomicity
    await this.db.transaction().execute(async (trx) => {
      // Delete in reverse FK order
      await trx.deleteFrom('answers').execute();
      await trx.deleteFrom('respondents').execute();
      await trx.deleteFrom('survey_tags').execute();
      await trx.deleteFrom('survey_questions').execute();
      await trx.deleteFrom('survey_sections').execute();
      await trx.deleteFrom('surveys').execute();
      await trx.deleteFrom('tags').execute();
      await trx.deleteFrom('audit_log').execute();
      await trx.deleteFrom('admin_credentials').execute();

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
        if (rows.length > 0) {
          for (const row of rows) {
            await trx
              .insertInto(table as any)
              .values(row as any)
              .execute();
          }
        }
        counts[table] = rows.length;
      }
    });

    return { counts };
  }
}
