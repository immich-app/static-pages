import { TagRepository, type TagRow } from '../repositories/tag.repository';
import { ServiceError } from './errors';

export class TagService {
  constructor(private tags: TagRepository) {}

  async listTags(): Promise<TagRow[]> {
    return this.tags.listAll();
  }

  async createTag(input: { name: string; color?: string }): Promise<TagRow> {
    if (!input.name?.trim()) throw new ServiceError('Tag name is required', 400);
    const tag: TagRow = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      color: input.color ?? null,
      created_at: new Date().toISOString(),
    };
    await this.tags.create(tag);
    return tag;
  }

  async updateTag(id: string, input: { name?: string; color?: string | null }): Promise<TagRow> {
    const existing = await this.tags.getById(id);
    if (!existing) throw new ServiceError('Tag not found', 404);
    const fields: Partial<Omit<TagRow, 'id' | 'created_at'>> = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new ServiceError('Tag name cannot be empty', 400);
      fields.name = input.name.trim();
    }
    if (input.color !== undefined) fields.color = input.color;
    await this.tags.update(id, fields);
    return { ...existing, ...fields };
  }

  async deleteTag(id: string): Promise<void> {
    const existing = await this.tags.getById(id);
    if (!existing) throw new ServiceError('Tag not found', 404);
    await this.tags.delete(id);
  }

  async getTagsForSurvey(surveyId: string): Promise<TagRow[]> {
    return this.tags.getTagsForSurvey(surveyId);
  }

  async setTagsForSurvey(surveyId: string, tagIds: string[]): Promise<void> {
    await this.tags.setTagsForSurvey(surveyId, tagIds);
  }
}
