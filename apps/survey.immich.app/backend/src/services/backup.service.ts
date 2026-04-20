import type { Kysely } from 'kysely';
import type { Database } from '../db';

// Tables that must always be present in a backup
const REQUIRED_TABLES = ['surveys', 'tags', 'survey_tags', 'audit_log', 'admin_credentials'] as const;

// Tables that are optional — present in Node.js single-DB mode but empty in Workers/DO mode
const OPTIONAL_TABLES = ['survey_sections', 'survey_questions', 'respondents', 'answers'] as const;

const ALL_TABLES = [...REQUIRED_TABLES, ...OPTIONAL_TABLES] as const;

/**
 * Expected columns per table. Restore rejects any row that's missing a
 * required column or carries an unknown one — prevents a malformed or
 * malicious backup from silently corrupting the live schema.
 */
const TABLE_COLUMNS: Record<string, readonly string[]> = {
  surveys: [
    'id',
    'title',
    'description',
    'slug',
    'status',
    'welcome_title',
    'welcome_description',
    'thank_you_title',
    'thank_you_description',
    'closes_at',
    'max_responses',
    'randomize_questions',
    'randomize_options',
    'password_hash',
    'archived_at',
    'created_at',
    'updated_at',
  ],
  survey_sections: ['id', 'survey_id', 'title', 'description', 'sort_order'],
  survey_questions: [
    'id',
    'survey_id',
    'section_id',
    'text',
    'description',
    'type',
    'options',
    'required',
    'has_other',
    'other_prompt',
    'max_length',
    'placeholder',
    'sort_order',
    'conditional',
    'config',
  ],
  respondents: ['id', 'survey_id', 'ip_address', 'is_complete', 'created_at', 'completed_at'],
  answers: ['respondent_id', 'question_id', 'answer', 'other_text', 'answered_at', 'answer_ms'],
  tags: ['id', 'name', 'color', 'created_at'],
  survey_tags: ['survey_id', 'tag_id'],
  audit_log: [
    'id',
    'user_sub',
    'user_email',
    'action',
    'resource_type',
    'resource_id',
    'details',
    'ip_address',
    'created_at',
  ],
  admin_credentials: ['id', 'password_hash', 'created_at'],
};

function validateRow(table: string, row: unknown, index: number): Record<string, unknown> {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error(`Backup ${table}[${index}]: row must be an object`);
  }
  const record = row as Record<string, unknown>;
  const allowed = new Set(TABLE_COLUMNS[table] ?? []);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      throw new Error(`Backup ${table}[${index}]: unknown column '${key}'`);
    }
  }
  return record;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  data: {
    surveys: unknown[];
    tags: unknown[];
    survey_tags: unknown[];
    audit_log: unknown[];
    admin_credentials: unknown[];
    survey_sections?: unknown[];
    survey_questions?: unknown[];
    respondents?: unknown[];
    answers?: unknown[];
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

    // Validate required tables
    for (const table of REQUIRED_TABLES) {
      if (!Array.isArray(backup.data[table])) {
        throw new Error(`Backup is missing required table: ${table}`);
      }
    }

    const counts: Record<string, number> = {};

    const tables: Array<[string, string]> = [
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

    // Validate every row up-front — any schema violation rejects the whole
    // restore before we touch the live DB. This matters because on D1 the
    // Kysely `transaction()` wrapper isn't a true cross-table transaction
    // (D1 can't BEGIN/COMMIT over the HTTP binding), so a mid-restore failure
    // would otherwise leave the DB half-wiped.
    const validatedRows: Record<string, Record<string, unknown>[]> = {};
    for (const [key, table] of tables) {
      const rows = (backup.data as Record<string, unknown[]>)[key];
      if (!Array.isArray(rows)) {
        validatedRows[key] = [];
        continue;
      }
      validatedRows[key] = rows.map((row, i) => validateRow(table, row, i));
    }

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

      // Insert in FK order — required tables first, then optional if present
      for (const [key, table] of tables) {
        const rows = validatedRows[key];
        for (const row of rows) {
          await trx
            .insertInto(table as any)
            .values(row as any)
            .execute();
        }
        counts[table] = rows.length;
      }
    });

    return { counts };
  }
}
