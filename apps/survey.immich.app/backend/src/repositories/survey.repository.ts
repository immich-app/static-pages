export interface SurveyRow {
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

export interface SectionRow {
  id: string;
  survey_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface QuestionRow {
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

export class SurveyRepository {
  constructor(private db: D1Database) {}

  async listAll(includeArchived = false): Promise<SurveyRow[]> {
    const query = includeArchived
      ? 'SELECT * FROM surveys ORDER BY created_at DESC'
      : 'SELECT * FROM surveys WHERE archived_at IS NULL ORDER BY created_at DESC';
    const result = await this.db.prepare(query).all<SurveyRow>();
    return result.results;
  }

  async getById(id: string): Promise<SurveyRow | null> {
    return this.db.prepare('SELECT * FROM surveys WHERE id = ?').bind(id).first<SurveyRow>();
  }

  async getBySlug(slug: string): Promise<SurveyRow | null> {
    return this.db.prepare('SELECT * FROM surveys WHERE slug = ?').bind(slug).first<SurveyRow>();
  }

  async create(survey: SurveyRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO surveys (id, title, description, slug, status, welcome_title, welcome_description, thank_you_title, thank_you_description, closes_at, max_responses, randomize_questions, randomize_options, password_hash, archived_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        survey.id,
        survey.title,
        survey.description,
        survey.slug,
        survey.status,
        survey.welcome_title,
        survey.welcome_description,
        survey.thank_you_title,
        survey.thank_you_description,
        survey.closes_at,
        survey.max_responses,
        survey.randomize_questions,
        survey.randomize_options,
        survey.password_hash,
        survey.archived_at,
        survey.created_at,
        survey.updated_at,
      )
      .run();
  }

  async update(id: string, fields: Partial<Omit<SurveyRow, 'id' | 'created_at'>>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }

    if (sets.length === 0) return;

    values.push(id);
    await this.db
      .prepare(`UPDATE surveys SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM surveys WHERE id = ?').bind(id).run();
  }
}

export class SectionRepository {
  constructor(private db: D1Database) {}

  async getBySurveyId(surveyId: string): Promise<SectionRow[]> {
    const result = await this.db
      .prepare('SELECT * FROM survey_sections WHERE survey_id = ? ORDER BY sort_order')
      .bind(surveyId)
      .all<SectionRow>();
    return result.results;
  }

  async getById(id: string): Promise<SectionRow | null> {
    return this.db.prepare('SELECT * FROM survey_sections WHERE id = ?').bind(id).first<SectionRow>();
  }

  async create(section: SectionRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO survey_sections (id, survey_id, title, description, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(section.id, section.survey_id, section.title, section.description, section.sort_order)
      .run();
  }

  async update(id: string, fields: Partial<Omit<SectionRow, 'id' | 'survey_id'>>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }

    if (sets.length === 0) return;

    values.push(id);
    await this.db
      .prepare(`UPDATE survey_sections SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM survey_sections WHERE id = ?').bind(id).run();
  }

  async reorder(items: Array<{ id: string; sort_order: number }>): Promise<void> {
    const statements = items.map((item) =>
      this.db.prepare('UPDATE survey_sections SET sort_order = ? WHERE id = ?').bind(item.sort_order, item.id),
    );
    await this.db.batch(statements);
  }

  async getMaxSortOrder(surveyId: string): Promise<number> {
    const row = await this.db
      .prepare('SELECT MAX(sort_order) as max_order FROM survey_sections WHERE survey_id = ?')
      .bind(surveyId)
      .first<{ max_order: number | null }>();
    return row?.max_order ?? -1;
  }
}

export class QuestionRepository {
  constructor(private db: D1Database) {}

  async getBySurveyId(surveyId: string): Promise<QuestionRow[]> {
    const result = await this.db
      .prepare('SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY sort_order')
      .bind(surveyId)
      .all<QuestionRow>();
    return result.results;
  }

  async getBySectionId(sectionId: string): Promise<QuestionRow[]> {
    const result = await this.db
      .prepare('SELECT * FROM survey_questions WHERE section_id = ? ORDER BY sort_order')
      .bind(sectionId)
      .all<QuestionRow>();
    return result.results;
  }

  async getById(id: string): Promise<QuestionRow | null> {
    return this.db.prepare('SELECT * FROM survey_questions WHERE id = ?').bind(id).first<QuestionRow>();
  }

  async create(question: QuestionRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO survey_questions (id, survey_id, section_id, text, description, type, options, required, has_other, other_prompt, max_length, placeholder, sort_order, conditional, config)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        question.id,
        question.survey_id,
        question.section_id,
        question.text,
        question.description,
        question.type,
        question.options,
        question.required,
        question.has_other,
        question.other_prompt,
        question.max_length,
        question.placeholder,
        question.sort_order,
        question.conditional,
        question.config,
      )
      .run();
  }

  async update(id: string, fields: Partial<Omit<QuestionRow, 'id' | 'survey_id'>>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }

    if (sets.length === 0) return;

    values.push(id);
    await this.db
      .prepare(`UPDATE survey_questions SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM survey_questions WHERE id = ?').bind(id).run();
  }

  async reorder(items: Array<{ id: string; sort_order: number }>): Promise<void> {
    const statements = items.map((item) =>
      this.db.prepare('UPDATE survey_questions SET sort_order = ? WHERE id = ?').bind(item.sort_order, item.id),
    );
    await this.db.batch(statements);
  }

  async getMaxSortOrder(sectionId: string): Promise<number> {
    const row = await this.db
      .prepare('SELECT MAX(sort_order) as max_order FROM survey_questions WHERE section_id = ?')
      .bind(sectionId)
      .first<{ max_order: number | null }>();
    return row?.max_order ?? -1;
  }
}
