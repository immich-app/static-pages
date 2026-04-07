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
import type { SurveyQuestion } from '../types';
import type { BuilderSection } from './builder-types';

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
      await apiDeleteSection(s.id);
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
      await apiUpdateSection(section.id, {
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
        await apiDeleteQuestion(qId);
      }
    }

    // Create/update questions
    for (const q of section.questions) {
      if (!q.id) {
        const created = await apiCreateQuestion(sectionId, {
          text: q.text,
          description: q.description || undefined,
          type: q.type,
          options: ['radio', 'checkbox'].includes(q.type) ? q.options : undefined,
          required: q.required,
          has_other: q.hasOther,
          other_prompt: q.otherPrompt || undefined,
          max_length: q.maxLength ?? undefined,
          placeholder: q.placeholder || undefined,
        });
        q.id = created.id;
      } else {
        await apiUpdateQuestion(q.id, {
          section_id: sectionId,
          text: q.text,
          description: q.description || undefined,
          type: q.type,
          options: ['radio', 'checkbox'].includes(q.type) ? q.options : undefined,
          required: q.required,
          has_other: q.hasOther,
          other_prompt: q.otherPrompt || undefined,
          max_length: q.maxLength ?? undefined,
          placeholder: q.placeholder || undefined,
        });
      }
    }

    // Reorder questions in this section
    if (section.questions.length > 0) {
      await apiReorderQuestions(
        sectionId,
        section.questions.map((q, idx) => ({ id: q.id, sort_order: idx })),
      );
    }
  }
}
