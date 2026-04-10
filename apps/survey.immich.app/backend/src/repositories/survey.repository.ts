import type { Kysely } from 'kysely';
import type { Database } from '../db';

export type { SurveyRow, SectionRow, QuestionRow } from '../db';

export class SurveyRepository {
  constructor(private db: Kysely<Database>) {}

  async listAll(includeArchived = false): Promise<import('../db').SurveyRow[]> {
    let query = this.db.selectFrom('surveys').selectAll().orderBy('created_at', 'desc');
    if (!includeArchived) {
      query = query.where('archived_at', 'is', null);
    }
    return query.execute();
  }

  async getById(id: string): Promise<import('../db').SurveyRow | null> {
    const result = await this.db.selectFrom('surveys').selectAll().where('id', '=', id).executeTakeFirst();
    return result ?? null;
  }

  async getBySlug(slug: string): Promise<import('../db').SurveyRow | null> {
    const result = await this.db.selectFrom('surveys').selectAll().where('slug', '=', slug).executeTakeFirst();
    return result ?? null;
  }

  async create(survey: import('../db').SurveyRow): Promise<void> {
    await this.db.insertInto('surveys').values(survey).execute();
  }

  async update(id: string, fields: Partial<Omit<import('../db').SurveyRow, 'id' | 'created_at'>>): Promise<void> {
    if (Object.keys(fields).length === 0) return;
    await this.db.updateTable('surveys').set(fields).where('id', '=', id).execute();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('surveys').where('id', '=', id).execute();
  }
}

export class SectionRepository {
  constructor(private db: Kysely<Database>) {}

  async getBySurveyId(surveyId: string): Promise<import('../db').SectionRow[]> {
    return this.db
      .selectFrom('survey_sections')
      .selectAll()
      .where('survey_id', '=', surveyId)
      .orderBy('sort_order')
      .execute();
  }

  async getById(id: string): Promise<import('../db').SectionRow | null> {
    const result = await this.db.selectFrom('survey_sections').selectAll().where('id', '=', id).executeTakeFirst();
    return result ?? null;
  }

  async create(section: import('../db').SectionRow): Promise<void> {
    await this.db.insertInto('survey_sections').values(section).execute();
  }

  async update(id: string, fields: Partial<Omit<import('../db').SectionRow, 'id' | 'survey_id'>>): Promise<void> {
    if (Object.keys(fields).length === 0) return;
    await this.db.updateTable('survey_sections').set(fields).where('id', '=', id).execute();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('survey_sections').where('id', '=', id).execute();
  }

  async reorder(items: Array<{ id: string; sort_order: number }>): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      for (const item of items) {
        await trx
          .updateTable('survey_sections')
          .set({ sort_order: item.sort_order })
          .where('id', '=', item.id)
          .execute();
      }
    });
  }

  async getMaxSortOrder(surveyId: string): Promise<number> {
    const row = await this.db
      .selectFrom('survey_sections')
      .select(this.db.fn.max('sort_order').as('max_order'))
      .where('survey_id', '=', surveyId)
      .executeTakeFirst();
    return (row?.max_order as number | null) ?? -1;
  }
}

export class QuestionRepository {
  constructor(private db: Kysely<Database>) {}

  async getBySurveyId(surveyId: string): Promise<import('../db').QuestionRow[]> {
    return this.db
      .selectFrom('survey_questions')
      .selectAll()
      .where('survey_id', '=', surveyId)
      .orderBy('sort_order')
      .execute();
  }

  async getById(id: string): Promise<import('../db').QuestionRow | null> {
    const result = await this.db.selectFrom('survey_questions').selectAll().where('id', '=', id).executeTakeFirst();
    return result ?? null;
  }

  async create(question: import('../db').QuestionRow): Promise<void> {
    await this.db.insertInto('survey_questions').values(question).execute();
  }

  async update(id: string, fields: Partial<Omit<import('../db').QuestionRow, 'id' | 'survey_id'>>): Promise<void> {
    if (Object.keys(fields).length === 0) return;
    await this.db.updateTable('survey_questions').set(fields).where('id', '=', id).execute();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('survey_questions').where('id', '=', id).execute();
  }

  async reorder(items: Array<{ id: string; sort_order: number }>): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      for (const item of items) {
        await trx
          .updateTable('survey_questions')
          .set({ sort_order: item.sort_order })
          .where('id', '=', item.id)
          .execute();
      }
    });
  }

  async getMaxSortOrder(sectionId: string): Promise<number> {
    const row = await this.db
      .selectFrom('survey_questions')
      .select(this.db.fn.max('sort_order').as('max_order'))
      .where('section_id', '=', sectionId)
      .executeTakeFirst();
    return (row?.max_order as number | null) ?? -1;
  }
}
