import {
  SurveyRepository,
  SectionRepository,
  QuestionRepository,
  type SurveyRow,
  type SectionRow,
  type QuestionRow,
} from '../repositories/survey.repository';
import { ServiceError } from './errors';
import { VALID_QUESTION_TYPES, SLUG_PATTERN } from '../constants';
import { hashPassword } from '../utils/crypto';

export { ServiceError };

export interface SurveyWithDetails {
  survey: SurveyRow;
  sections: SectionRow[];
  questions: QuestionRow[];
}

export interface CreateSurveyInput {
  title: string;
  description?: string;
}

export interface UpdateSurveyInput {
  title?: string;
  description?: string;
  slug?: string;
  welcome_title?: string;
  welcome_description?: string;
  thank_you_title?: string;
  thank_you_description?: string;
  closes_at?: string | null;
  max_responses?: number | null;
  randomize_questions?: boolean;
  randomize_options?: boolean;
  password?: string | null;
}

export interface CreateSectionInput {
  title: string;
  description?: string;
}

export interface UpdateSectionInput {
  title?: string;
  description?: string;
}

export interface CreateQuestionInput {
  text: string;
  description?: string;
  type: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  has_other?: boolean;
  other_prompt?: string;
  max_length?: number;
  placeholder?: string;
  conditional?: { showIf: { questionId: string; condition: string } };
  config?: Record<string, unknown>;
}

export interface UpdateQuestionInput {
  section_id?: string;
  text?: string;
  description?: string;
  type?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  has_other?: boolean;
  other_prompt?: string;
  max_length?: number;
  placeholder?: string;
  conditional?: { showIf: { questionId: string; condition: string } } | null;
  config?: Record<string, unknown> | null;
}

export interface SurveyDefinition {
  version: number;
  title: string;
  description?: string | null;
  welcomeTitle?: string | null;
  welcomeDescription?: string | null;
  thankYouTitle?: string | null;
  thankYouDescription?: string | null;
  sections: Array<{
    title: string;
    description?: string | null;
    questions?: Array<{
      text: string;
      description?: string | null;
      type: string;
      options?: Array<{ label: string; value: string }> | null;
      required?: boolean;
      hasOther?: boolean;
      otherPrompt?: string | null;
      maxLength?: number | null;
      placeholder?: string | null;
      config?: Record<string, unknown> | null;
    }>;
  }>;
}

export class SurveyService {
  constructor(
    private surveys: SurveyRepository,
    private sections: SectionRepository,
    private questions: QuestionRepository,
  ) {}

  async listSurveys(includeArchived = false): Promise<SurveyRow[]> {
    return this.surveys.listAll(includeArchived);
  }

  async getSurvey(id: string): Promise<SurveyWithDetails> {
    const survey = await this.surveys.getById(id);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }

    const [sections, questions] = await Promise.all([
      this.sections.getBySurveyId(id),
      this.questions.getBySurveyId(id),
    ]);

    return { survey, sections, questions };
  }

  async getPublishedSurvey(slug: string): Promise<SurveyWithDetails> {
    const survey = await this.surveys.getBySlug(slug);
    if (!survey || survey.status !== 'published') {
      throw new ServiceError('Survey not found', 404);
    }

    const [sections, questions] = await Promise.all([
      this.sections.getBySurveyId(survey.id),
      this.questions.getBySurveyId(survey.id),
    ]);

    return { survey, sections, questions };
  }

  async createSurvey(input: CreateSurveyInput): Promise<SurveyRow> {
    if (!input.title?.trim()) {
      throw new ServiceError('Title is required', 400);
    }

    const now = new Date().toISOString();
    const survey: SurveyRow = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      slug: null,
      status: 'draft',
      welcome_title: null,
      welcome_description: null,
      thank_you_title: null,
      thank_you_description: null,
      closes_at: null,
      max_responses: null,
      randomize_questions: 0,
      randomize_options: 0,
      password_hash: null,
      archived_at: null,
      created_at: now,
      updated_at: now,
    };

    await this.surveys.create(survey);
    return survey;
  }

  async updateSurvey(id: string, input: UpdateSurveyInput): Promise<SurveyRow> {
    const existing = await this.surveys.getById(id);
    if (!existing) {
      throw new ServiceError('Survey not found', 404);
    }

    const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        throw new ServiceError('Title cannot be empty', 400);
      }
      fields.title = input.title.trim();
    }

    if (input.slug !== undefined) {
      if (input.slug !== null && input.slug !== '') {
        if (!SLUG_PATTERN.test(input.slug)) {
          throw new ServiceError('Slug must be 3-50 characters, lowercase alphanumeric and hyphens only', 400);
        }
        const slugOwner = await this.surveys.getBySlug(input.slug);
        if (slugOwner && slugOwner.id !== id) {
          throw new ServiceError('Slug is already in use', 409);
        }
        fields.slug = input.slug;
      } else {
        fields.slug = null;
      }
    }

    if (input.description !== undefined) fields.description = input.description?.trim() ?? null;
    if (input.welcome_title !== undefined) fields.welcome_title = input.welcome_title?.trim() ?? null;
    if (input.welcome_description !== undefined) fields.welcome_description = input.welcome_description?.trim() ?? null;
    if (input.thank_you_title !== undefined) fields.thank_you_title = input.thank_you_title?.trim() ?? null;
    if (input.thank_you_description !== undefined)
      fields.thank_you_description = input.thank_you_description?.trim() ?? null;
    if (input.closes_at !== undefined) fields.closes_at = input.closes_at ?? null;
    if (input.max_responses !== undefined) fields.max_responses = input.max_responses ?? null;
    if (input.randomize_questions !== undefined) fields.randomize_questions = input.randomize_questions ? 1 : 0;
    if (input.randomize_options !== undefined) fields.randomize_options = input.randomize_options ? 1 : 0;

    if (input.password !== undefined) {
      if (input.password && input.password.length > 0) {
        fields.password_hash = await hashPassword(input.password);
      } else {
        fields.password_hash = null;
      }
    }

    await this.surveys.update(id, fields);
    return { ...existing, ...fields } as SurveyRow;
  }

  async deleteSurvey(id: string): Promise<void> {
    const existing = await this.surveys.getById(id);
    if (!existing) {
      throw new ServiceError('Survey not found', 404);
    }
    await this.surveys.delete(id);
  }

  async publishSurvey(id: string): Promise<SurveyRow> {
    const { survey, sections, questions } = await this.getSurvey(id);

    if (!survey.slug) {
      throw new ServiceError('Survey must have a slug before publishing', 400);
    }

    if (sections.length === 0) {
      throw new ServiceError('Survey must have at least one section', 400);
    }

    if (questions.length === 0) {
      throw new ServiceError('Survey must have at least one question', 400);
    }

    await this.surveys.update(id, {
      status: 'published',
      updated_at: new Date().toISOString(),
    });
    return { ...survey, status: 'published' };
  }

  async unpublishSurvey(id: string): Promise<SurveyRow> {
    const survey = await this.surveys.getById(id);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }

    await this.surveys.update(id, {
      status: 'draft',
      updated_at: new Date().toISOString(),
    });
    return { ...survey, status: 'draft' };
  }

  async createSection(surveyId: string, input: CreateSectionInput): Promise<SectionRow> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }

    if (!input.title?.trim()) {
      throw new ServiceError('Section title is required', 400);
    }

    const maxOrder = await this.sections.getMaxSortOrder(surveyId);
    const section: SectionRow = {
      id: crypto.randomUUID(),
      survey_id: surveyId,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      sort_order: maxOrder + 1,
    };

    await this.sections.create(section);
    return section;
  }

  async updateSection(id: string, input: UpdateSectionInput): Promise<SectionRow> {
    const existing = await this.sections.getById(id);
    if (!existing) {
      throw new ServiceError('Section not found', 404);
    }

    const fields: Record<string, unknown> = {};
    if (input.title !== undefined) {
      if (!input.title.trim()) {
        throw new ServiceError('Section title cannot be empty', 400);
      }
      fields.title = input.title.trim();
    }
    if (input.description !== undefined) fields.description = input.description?.trim() ?? null;

    if (Object.keys(fields).length === 0) return existing;

    await this.sections.update(id, fields);
    return { ...existing, ...fields } as SectionRow;
  }

  async deleteSection(id: string): Promise<void> {
    const existing = await this.sections.getById(id);
    if (!existing) {
      throw new ServiceError('Section not found', 404);
    }
    await this.sections.delete(id);
  }

  async reorderSections(surveyId: string, items: Array<{ id: string; sort_order: number }>): Promise<void> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }
    await this.sections.reorder(items);
  }

  async createQuestion(sectionId: string, input: CreateQuestionInput): Promise<QuestionRow> {
    const section = await this.sections.getById(sectionId);
    if (!section) {
      throw new ServiceError('Section not found', 404);
    }

    if (!input.text?.trim()) {
      throw new ServiceError('Question text is required', 400);
    }

    if (!VALID_QUESTION_TYPES.includes(input.type)) {
      throw new ServiceError(`Invalid question type. Must be one of: ${VALID_QUESTION_TYPES.join(', ')}`, 400);
    }

    if (['radio', 'checkbox', 'dropdown'].includes(input.type) && (!input.options || input.options.length === 0)) {
      throw new ServiceError('Radio, checkbox, and dropdown questions must have options', 400);
    }

    const maxOrder = await this.questions.getMaxSortOrder(sectionId);
    const question: QuestionRow = {
      id: crypto.randomUUID(),
      survey_id: section.survey_id,
      section_id: sectionId,
      text: input.text.trim(),
      description: input.description?.trim() ?? null,
      type: input.type,
      options: input.options ? JSON.stringify(input.options) : null,
      required: input.required !== false ? 1 : 0,
      has_other: input.has_other ? 1 : 0,
      other_prompt: input.other_prompt?.trim() ?? null,
      max_length: input.max_length ?? null,
      placeholder: input.placeholder?.trim() ?? null,
      sort_order: maxOrder + 1,
      conditional: input.conditional ? JSON.stringify(input.conditional) : null,
      config: input.config ? JSON.stringify(input.config) : null,
    };

    await this.questions.create(question);
    return question;
  }

  async updateQuestion(id: string, input: UpdateQuestionInput): Promise<QuestionRow> {
    const existing = await this.questions.getById(id);
    if (!existing) {
      throw new ServiceError('Question not found', 404);
    }

    const fields: Record<string, unknown> = {};

    if (input.section_id !== undefined) {
      const section = await this.sections.getById(input.section_id);
      if (!section) {
        throw new ServiceError('Target section not found', 404);
      }
      fields.section_id = input.section_id;
    }

    if (input.text !== undefined) {
      if (!input.text.trim()) {
        throw new ServiceError('Question text cannot be empty', 400);
      }
      fields.text = input.text.trim();
    }

    if (input.type !== undefined) {
      if (!VALID_QUESTION_TYPES.includes(input.type)) {
        throw new ServiceError(`Invalid question type. Must be one of: ${VALID_QUESTION_TYPES.join(', ')}`, 400);
      }
      fields.type = input.type;
    }

    if (input.options !== undefined) fields.options = input.options ? JSON.stringify(input.options) : null;
    if (input.description !== undefined) fields.description = input.description?.trim() ?? null;
    if (input.required !== undefined) fields.required = input.required ? 1 : 0;
    if (input.has_other !== undefined) fields.has_other = input.has_other ? 1 : 0;
    if (input.other_prompt !== undefined) fields.other_prompt = input.other_prompt?.trim() ?? null;
    if (input.max_length !== undefined) fields.max_length = input.max_length;
    if (input.placeholder !== undefined) fields.placeholder = input.placeholder?.trim() ?? null;
    if (input.conditional !== undefined) {
      fields.conditional = input.conditional ? JSON.stringify(input.conditional) : null;
    }
    if (input.config !== undefined) {
      fields.config = input.config ? JSON.stringify(input.config) : null;
    }

    if (Object.keys(fields).length === 0) return existing;

    await this.questions.update(id, fields);
    return { ...existing, ...fields } as QuestionRow;
  }

  async deleteQuestion(id: string): Promise<void> {
    const existing = await this.questions.getById(id);
    if (!existing) {
      throw new ServiceError('Question not found', 404);
    }
    await this.questions.delete(id);
  }

  async reorderQuestions(sectionId: string, items: Array<{ id: string; sort_order: number }>): Promise<void> {
    const section = await this.sections.getById(sectionId);
    if (!section) {
      throw new ServiceError('Section not found', 404);
    }
    await this.questions.reorder(items);
  }

  async duplicateSurvey(id: string): Promise<SurveyWithDetails> {
    const { survey, sections, questions } = await this.getSurvey(id);

    const now = new Date().toISOString();
    const newSurvey: SurveyRow = {
      id: crypto.randomUUID(),
      title: `${survey.title} (Copy)`,
      description: survey.description,
      slug: null,
      status: 'draft',
      welcome_title: survey.welcome_title,
      welcome_description: survey.welcome_description,
      thank_you_title: survey.thank_you_title,
      thank_you_description: survey.thank_you_description,
      closes_at: survey.closes_at,
      max_responses: survey.max_responses,
      randomize_questions: survey.randomize_questions,
      randomize_options: survey.randomize_options,
      password_hash: null,
      archived_at: null,
      created_at: now,
      updated_at: now,
    };

    await this.surveys.create(newSurvey);

    const sectionIdMap = new Map<string, string>();
    const newSections: SectionRow[] = [];
    for (const section of sections) {
      const newSectionId = crypto.randomUUID();
      sectionIdMap.set(section.id, newSectionId);
      const newSection: SectionRow = {
        id: newSectionId,
        survey_id: newSurvey.id,
        title: section.title,
        description: section.description,
        sort_order: section.sort_order,
      };
      newSections.push(newSection);
      await this.sections.create(newSection);
    }

    const newQuestions: QuestionRow[] = [];
    for (const question of questions) {
      const newQuestion: QuestionRow = {
        id: crypto.randomUUID(),
        survey_id: newSurvey.id,
        section_id: sectionIdMap.get(question.section_id) ?? question.section_id,
        text: question.text,
        description: question.description,
        type: question.type,
        options: question.options,
        required: question.required,
        has_other: question.has_other,
        other_prompt: question.other_prompt,
        max_length: question.max_length,
        placeholder: question.placeholder,
        sort_order: question.sort_order,
        conditional: question.conditional,
        config: question.config,
      };
      newQuestions.push(newQuestion);
      await this.questions.create(newQuestion);
    }

    return { survey: newSurvey, sections: newSections, questions: newQuestions };
  }

  async archiveSurvey(id: string): Promise<SurveyRow> {
    const survey = await this.surveys.getById(id);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }
    const now = new Date().toISOString();
    await this.surveys.update(id, { archived_at: now, updated_at: now });
    return { ...survey, archived_at: now, updated_at: now };
  }

  async unarchiveSurvey(id: string): Promise<SurveyRow> {
    const survey = await this.surveys.getById(id);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }
    const now = new Date().toISOString();
    await this.surveys.update(id, { archived_at: null, updated_at: now });
    return { ...survey, archived_at: null, updated_at: now };
  }

  async exportDefinition(id: string): Promise<SurveyDefinition> {
    const { survey, sections, questions } = await this.getSurvey(id);
    return {
      version: 1,
      title: survey.title,
      description: survey.description,
      welcomeTitle: survey.welcome_title,
      welcomeDescription: survey.welcome_description,
      thankYouTitle: survey.thank_you_title,
      thankYouDescription: survey.thank_you_description,
      sections: sections
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => ({
          title: s.title,
          description: s.description,
          questions: questions
            .filter((q) => q.section_id === s.id)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((q) => ({
              text: q.text,
              description: q.description,
              type: q.type,
              options: q.options ? JSON.parse(q.options) : null,
              required: q.required === 1,
              hasOther: q.has_other === 1,
              otherPrompt: q.other_prompt,
              maxLength: q.max_length,
              placeholder: q.placeholder,
              config: q.config ? JSON.parse(q.config) : null,
            })),
        })),
    };
  }

  async importDefinition(def: SurveyDefinition): Promise<SurveyWithDetails> {
    if (!def.title?.trim()) {
      throw new ServiceError('Import must have a title', 400);
    }
    if (!def.sections?.length) {
      throw new ServiceError('Import must have at least one section', 400);
    }

    const survey = await this.createSurvey({ title: def.title, description: def.description ?? undefined });

    if (def.welcomeTitle || def.welcomeDescription || def.thankYouTitle || def.thankYouDescription) {
      await this.updateSurvey(survey.id, {
        welcome_title: def.welcomeTitle ?? undefined,
        welcome_description: def.welcomeDescription ?? undefined,
        thank_you_title: def.thankYouTitle ?? undefined,
        thank_you_description: def.thankYouDescription ?? undefined,
      });
    }

    for (const sDef of def.sections) {
      const section = await this.createSection(survey.id, {
        title: sDef.title,
        description: sDef.description ?? undefined,
      });
      for (const qDef of sDef.questions ?? []) {
        await this.createQuestion(section.id, {
          text: qDef.text,
          description: qDef.description ?? undefined,
          type: qDef.type,
          options: qDef.options ?? undefined,
          required: qDef.required,
          has_other: qDef.hasOther,
          other_prompt: qDef.otherPrompt ?? undefined,
          max_length: qDef.maxLength ?? undefined,
          placeholder: qDef.placeholder ?? undefined,
          config: qDef.config ?? undefined,
        });
      }
    }

    return this.getSurvey(survey.id);
  }
}

