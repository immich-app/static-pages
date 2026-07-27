import {
  createSection as apiCreateSection,
  updateSection as apiUpdateSection,
  deleteSection as apiDeleteSection,
  createQuestion as apiCreateQuestion,
  updateQuestion as apiUpdateQuestion,
  deleteQuestion as apiDeleteQuestion,
  reorderSections as apiReorderSections,
  reorderQuestions as apiReorderQuestions,
} from '../api/surveys';
import type { SurveyQuestion, SurveyQuestionConfig } from '../types';
import type { BuilderSection, BuilderQuestion } from './builder-types';

type Conditional = NonNullable<SurveyQuestion['conditional']>;

/**
 * The Skip Logic editor stores its settings in `question.config` (skipSource*
 * / skipCondition*), but the respondent runtime (shouldShowQuestion) reads
 * `question.conditional.showIf`. Translate the config shape into the runtime
 * shape at save time so skip logic actually takes effect. Returns undefined
 * when no source question is configured (no rule).
 */
function buildConditional(
  config: Record<string, unknown> | undefined,
  sectionQuestions: BuilderQuestion[],
): Conditional | undefined {
  const cfg = (config ?? {}) as SurveyQuestionConfig;
  const source = cfg.skipSourceQuestion;
  if (!source) return undefined;

  // Resolve the source reference to a real question id. Rules created before
  // the source question was persisted store a positional index instead of an id.
  let questionId = sectionQuestions.find((q) => q.id === source)?.id;
  if (!questionId) {
    const idx = Number(source);
    if (Number.isInteger(idx)) questionId = sectionQuestions[idx]?.id;
  }
  if (!questionId) return undefined;

  const condition = cfg.skipConditionType ?? 'skipped';
  const showIf: Conditional['showIf'] = { questionId, condition };
  if (condition === 'equals' || condition === 'notEquals') {
    showIf.value = String(cfg.skipConditionValue ?? '');
  } else if (condition === 'anyOf') {
    showIf.values = String(cfg.skipConditionValues ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return { showIf };
}

export async function saveSections(
  surveyId: string,
  currentSections: BuilderSection[],
  newSections: BuilderSection[],
  allQuestions: SurveyQuestion[],
): Promise<void> {
  const newSectionIds = new Set(newSections.filter((s) => s.id).map((s) => s.id));

  // 1. Delete removed sections
  for (const s of currentSections) {
    if (s.id && !newSectionIds.has(s.id)) {
      await apiDeleteSection(surveyId, s.id);
    }
  }

  // 2. Create new sections and update existing ones
  for (const section of newSections) {
    if (!section.id) {
      const created = await apiCreateSection(surveyId, {
        title: section.title,
        description: section.description ?? undefined,
      });
      section.id = created.id;
    } else {
      await apiUpdateSection(surveyId, section.id, {
        title: section.title,
        description: section.description ?? undefined,
      });
    }
  }

  // 3. Reorder sections (now all have IDs)
  if (newSections.length > 0) {
    await apiReorderSections(
      surveyId,
      newSections.map((s, idx) => ({ id: s.id, sort_order: idx })),
    );
  }

  // 4. Handle questions for each section
  for (const section of newSections) {
    const sectionId = section.id;
    const existingQuestionIds = new Set(allQuestions.filter((q) => q.section_id === sectionId).map((q) => q.id));
    const newQuestionIds = new Set(section.questions.filter((q) => q.id).map((q) => q.id));

    // Delete removed questions
    for (const qId of existingQuestionIds) {
      if (!newQuestionIds.has(qId)) {
        await apiDeleteQuestion(surveyId, qId);
      }
    }

    // Create/update questions
    const hasOptions = (type: string) => ['radio', 'checkbox', 'dropdown'].includes(type);
    for (const q of section.questions) {
      if (!q.id) {
        const created = await apiCreateQuestion(surveyId, sectionId, {
          text: q.text,
          description: q.description || undefined,
          type: q.type,
          options: hasOptions(q.type) ? q.options : undefined,
          required: q.required,
          has_other: q.hasOther,
          other_prompt: q.otherPrompt || undefined,
          max_length: q.maxLength ?? undefined,
          placeholder: q.placeholder || undefined,
          config: q.config ?? undefined,
          conditional: buildConditional(q.config, section.questions),
        });
        q.id = created.id;
      } else {
        await apiUpdateQuestion(surveyId, q.id, {
          section_id: sectionId,
          text: q.text,
          description: q.description || undefined,
          type: q.type,
          options: hasOptions(q.type) ? q.options : undefined,
          required: q.required,
          has_other: q.hasOther,
          other_prompt: q.otherPrompt || undefined,
          max_length: q.maxLength ?? undefined,
          placeholder: q.placeholder || undefined,
          config: q.config ?? null,
          conditional: buildConditional(q.config, section.questions) ?? null,
        });
      }
    }

    // Reorder questions in this section
    if (section.questions.length > 0) {
      await apiReorderQuestions(
        surveyId,
        sectionId,
        section.questions.map((q, idx) => ({ id: q.id, sort_order: idx })),
      );
    }
  }
}
