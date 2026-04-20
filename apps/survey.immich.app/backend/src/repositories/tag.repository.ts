import type { Kysely } from 'kysely';
import type { Database } from '../db';

export type { TagRow } from '../db';

export class TagRepository {
  constructor(private db: Kysely<Database>) {}

  async listAll(): Promise<import('../db').TagRow[]> {
    return this.db.selectFrom('tags').selectAll().orderBy('name').execute();
  }

  async getById(id: string): Promise<import('../db').TagRow | null> {
    const result = await this.db.selectFrom('tags').selectAll().where('id', '=', id).executeTakeFirst();
    return result ?? null;
  }

  async create(tag: import('../db').TagRow): Promise<void> {
    await this.db.insertInto('tags').values(tag).execute();
  }

  async update(id: string, fields: Partial<Omit<import('../db').TagRow, 'id' | 'created_at'>>): Promise<void> {
    if (Object.keys(fields).length === 0) return;
    await this.db.updateTable('tags').set(fields).where('id', '=', id).execute();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('tags').where('id', '=', id).execute();
  }

  async getTagsForSurvey(surveyId: string): Promise<import('../db').TagRow[]> {
    return this.db
      .selectFrom('tags as t')
      .innerJoin('survey_tags as st', 'st.tag_id', 't.id')
      .selectAll('t')
      .where('st.survey_id', '=', surveyId)
      .orderBy('t.name')
      .execute();
  }

  async setTagsForSurvey(surveyId: string, tagIds: string[]): Promise<void> {
    await this.db.deleteFrom('survey_tags').where('survey_id', '=', surveyId).execute();
    if (tagIds.length > 0) {
      await this.db
        .insertInto('survey_tags')
        .values(tagIds.map((tagId) => ({ survey_id: surveyId, tag_id: tagId })))
        .execute();
    }
  }
}
