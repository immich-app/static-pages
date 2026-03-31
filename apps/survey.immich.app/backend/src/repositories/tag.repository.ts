export interface TagRow {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export class TagRepository {
  constructor(private db: D1Database) {}

  async listAll(): Promise<TagRow[]> {
    const result = await this.db.prepare('SELECT * FROM tags ORDER BY name').all<TagRow>();
    return result.results;
  }

  async getById(id: string): Promise<TagRow | null> {
    return this.db.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first<TagRow>();
  }

  async create(tag: TagRow): Promise<void> {
    await this.db
      .prepare('INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)')
      .bind(tag.id, tag.name, tag.color, tag.created_at)
      .run();
  }

  async update(id: string, fields: Partial<Omit<TagRow, 'id' | 'created_at'>>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(fields)) {
      sets.push(`${key} = ?`);
      values.push(value);
    }
    if (sets.length === 0) return;
    values.push(id);
    await this.db
      .prepare(`UPDATE tags SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM tags WHERE id = ?').bind(id).run();
  }

  async getTagsForSurvey(surveyId: string): Promise<TagRow[]> {
    const result = await this.db
      .prepare('SELECT t.* FROM tags t JOIN survey_tags st ON t.id = st.tag_id WHERE st.survey_id = ? ORDER BY t.name')
      .bind(surveyId)
      .all<TagRow>();
    return result.results;
  }

  async setTagsForSurvey(surveyId: string, tagIds: string[]): Promise<void> {
    await this.db.prepare('DELETE FROM survey_tags WHERE survey_id = ?').bind(surveyId).run();
    if (tagIds.length === 0) return;
    const stmts = tagIds.map((tagId) =>
      this.db.prepare('INSERT INTO survey_tags (survey_id, tag_id) VALUES (?, ?)').bind(surveyId, tagId),
    );
    await this.db.batch(stmts);
  }
}
