import { Kysely } from 'kysely';
import { CloudflareD1Dialect } from '@immich/kysely-adapter-cloudflare';
import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

// --- Table types ---

export interface SurveysTable {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  status: string;
  welcome_title: string | null;
  welcome_description: string | null;
  thank_you_title: string | null;
  thank_you_description: string | null;
  closes_at: string | null;
  max_responses: number | null;
  randomize_questions: number;
  randomize_options: number;
  password_hash: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveySectionsTable {
  id: string;
  survey_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface SurveyQuestionsTable {
  id: string;
  survey_id: string;
  section_id: string;
  text: string;
  description: string | null;
  type: string;
  options: string | null;
  required: number;
  has_other: number;
  other_prompt: string | null;
  max_length: number | null;
  placeholder: string | null;
  sort_order: number;
  conditional: string | null;
  config: string | null;
}

export interface RespondentsTable {
  id: string;
  survey_id: string;
  ip_address: string | null;
  is_complete: number;
  created_at: string;
  completed_at: string | null;
}

export interface AnswersTable {
  respondent_id: string;
  question_id: string;
  answer: string;
  other_text: string | null;
  answered_at: string;
}

export interface TagsTable {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface SurveyTagsTable {
  survey_id: string;
  tag_id: string;
}

export interface AuditLogTable {
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

export interface AdminCredentialsTable {
  id: string;
  password_hash: string;
  created_at: string;
}

// --- Database interface ---

export interface Database {
  surveys: SurveysTable;
  survey_sections: SurveySectionsTable;
  survey_questions: SurveyQuestionsTable;
  respondents: RespondentsTable;
  answers: AnswersTable;
  tags: TagsTable;
  survey_tags: SurveyTagsTable;
  audit_log: AuditLogTable;
  admin_credentials: AdminCredentialsTable;
}

// --- Row types for backward compatibility ---

export type SurveyRow = Selectable<SurveysTable>;
export type SectionRow = Selectable<SurveySectionsTable>;
export type QuestionRow = Selectable<SurveyQuestionsTable>;
export type RespondentRow = Selectable<RespondentsTable>;
export type AnswerRow = Selectable<AnswersTable>;
export type TagRow = Selectable<TagsTable>;
export type AuditLogRow = Selectable<AuditLogTable>;

// --- Kysely instance factory ---

export function createDatabase(d1: D1Database): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new CloudflareD1Dialect({ database: d1 as unknown as import('@cloudflare/workers-types').D1Database }),
  });
}
