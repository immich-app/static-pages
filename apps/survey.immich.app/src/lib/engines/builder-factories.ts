import type { QuestionType } from '../types';
import type { BuilderQuestion, BuilderSection } from './builder-types';

export function createDefaultQuestion(sortOrder: number): BuilderQuestion {
  return {
    id: '',
    text: '',
    description: '',
    type: 'radio',
    options: [
      { label: 'Option 1', value: 'Option 1' },
      { label: 'Option 2', value: 'Option 2' },
    ],
    required: true,
    hasOther: false,
    otherPrompt: '',
    maxLength: null,
    placeholder: '',
    sortOrder,
    config: {},
  };
}

export function createDefaultSection(sortOrder: number): BuilderSection {
  return {
    id: '',
    title: '',
    description: '',
    sortOrder,
    questions: [],
  };
}

export function createQuestionOfType(type: QuestionType, sortOrder: number): BuilderQuestion {
  const base = createDefaultQuestion(sortOrder);
  base.type = type;

  switch (type) {
    case 'radio':
    case 'checkbox':
      // keep default options
      break;
    case 'dropdown':
      // dropdown also needs options like radio
      break;
    case 'rating':
      base.options = [];
      base.config = { scaleMax: 5 };
      break;
    case 'nps':
      base.options = [];
      base.config = { scaleMax: 10 };
      break;
    case 'number':
      base.options = [];
      base.config = { min: 0, max: 100 };
      break;
    case 'likert':
      base.options = [];
      base.config = { scaleMax: 5 };
      break;
    default:
      base.options = [];
      break;
  }

  return base;
}

export function duplicateQuestion(question: BuilderQuestion, sortOrder: number): BuilderQuestion {
  return {
    ...question,
    id: '',
    sortOrder,
    options: [...question.options.map((o) => ({ ...o }))],
    config: { ...question.config },
  };
}

export function duplicateSection(section: BuilderSection, sortOrder: number): BuilderSection {
  return {
    ...section,
    id: '',
    sortOrder,
    questions: section.questions.map((q, i) => duplicateQuestion(q, i)),
  };
}
