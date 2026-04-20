import { describe, it, expect } from 'vitest';
import {
  validateSurvey,
  validateSlug,
  moveItem,
  createDefaultQuestion,
  createDefaultSection,
  createQuestionOfType,
  duplicateQuestion,
  duplicateSection,
  estimateCompletionSeconds,
  formatDuration,
  type BuilderSection,
} from './builder-engine.svelte';

describe('validateSurvey', () => {
  function makeValidSections(): BuilderSection[] {
    return [
      {
        id: 's1',
        title: 'Section 1',
        description: '',
        sortOrder: 0,
        questions: [
          {
            ...createDefaultQuestion(0),
            id: 'q1',
            text: 'What is your name?',
            type: 'text',
            options: [],
          },
        ],
      },
    ];
  }

  it('returns no errors for valid survey', () => {
    expect(validateSurvey('My Survey', makeValidSections())).toEqual([]);
  });

  it('requires a title', () => {
    const errors = validateSurvey('', makeValidSections());
    expect(errors).toContain('Survey title is required');
  });

  it('requires at least one section', () => {
    const errors = validateSurvey('My Survey', []);
    expect(errors).toContain('Survey must have at least one section');
  });

  it('requires sections to have titles', () => {
    const sections = makeValidSections();
    sections[0].title = '';
    const errors = validateSurvey('My Survey', sections);
    expect(errors.some((e) => e.includes('needs a title'))).toBe(true);
  });

  it('requires sections to have questions', () => {
    const sections = makeValidSections();
    sections[0].questions = [];
    const errors = validateSurvey('My Survey', sections);
    expect(errors.some((e) => e.includes('must have at least one question'))).toBe(true);
  });

  it('requires questions to have text', () => {
    const sections = makeValidSections();
    sections[0].questions[0].text = '';
    const errors = validateSurvey('My Survey', sections);
    expect(errors.some((e) => e.includes('has no text'))).toBe(true);
  });

  it('requires radio questions to have at least 2 options', () => {
    const sections = makeValidSections();
    sections[0].questions[0].type = 'radio';
    sections[0].questions[0].options = [{ label: 'Only one', value: 'Only one' }];
    const errors = validateSurvey('My Survey', sections);
    expect(errors.some((e) => e.includes('at least 2 options'))).toBe(true);
  });
});

describe('validateSlug', () => {
  it('accepts valid slugs', () => {
    expect(validateSlug('my-survey')).toBeNull();
    expect(validateSlug('survey123')).toBeNull();
    expect(validateSlug('a-b')).toBeNull();
  });

  it('rejects empty slug', () => {
    expect(validateSlug('')).toBe('Slug is required for publishing');
  });

  it('rejects too short slugs', () => {
    expect(validateSlug('ab')).toBe('Slug must be at least 3 characters');
  });

  it('rejects slugs starting with hyphen', () => {
    expect(validateSlug('-abc')).toContain('lowercase alphanumeric');
  });

  it('rejects uppercase slugs', () => {
    expect(validateSlug('MySlug')).toContain('lowercase alphanumeric');
  });
});

describe('moveItem', () => {
  it('moves item up', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'up')).toEqual(['b', 'a', 'c']);
  });

  it('moves item down', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'down')).toEqual(['a', 'c', 'b']);
  });

  it('does not move first item up', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 'up')).toEqual(['a', 'b', 'c']);
  });

  it('does not move last item down', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 'down')).toEqual(['a', 'b', 'c']);
  });
});

describe('createDefaultQuestion', () => {
  it('creates a question with default radio type and 2 options', () => {
    const q = createDefaultQuestion(0);
    expect(q.type).toBe('radio');
    expect(q.options).toHaveLength(2);
    expect(q.required).toBe(true);
  });
});

describe('createDefaultSection', () => {
  it('creates a section with empty questions', () => {
    const s = createDefaultSection(0);
    expect(s.questions).toEqual([]);
    expect(s.title).toBe('');
  });
});

describe('createQuestionOfType', () => {
  it('creates a radio question with options', () => {
    const q = createQuestionOfType('radio', 0);
    expect(q.type).toBe('radio');
    expect(q.options).toHaveLength(2);
  });

  it('creates a text question without options', () => {
    const q = createQuestionOfType('text', 0);
    expect(q.type).toBe('text');
    expect(q.options).toEqual([]);
  });

  it('creates an email question without options', () => {
    const q = createQuestionOfType('email', 3);
    expect(q.type).toBe('email');
    expect(q.sortOrder).toBe(3);
    expect(q.options).toEqual([]);
  });

  it('creates a rating question with scaleMax config', () => {
    const q = createQuestionOfType('rating', 0);
    expect(q.type).toBe('rating');
    expect(q.options).toEqual([]);
    expect(q.config).toEqual({ scaleMax: 5 });
  });

  it('creates an nps question with scaleMax config', () => {
    const q = createQuestionOfType('nps', 0);
    expect(q.type).toBe('nps');
    expect(q.options).toEqual([]);
    expect(q.config).toEqual({ scaleMax: 10 });
  });

  it('creates a number question with min/max config', () => {
    const q = createQuestionOfType('number', 0);
    expect(q.type).toBe('number');
    expect(q.options).toEqual([]);
    expect(q.config).toEqual({ min: 0, max: 100 });
  });

  it('creates a dropdown question with default options', () => {
    const q = createQuestionOfType('dropdown', 0);
    expect(q.type).toBe('dropdown');
    expect(q.options).toHaveLength(2);
    expect(q.config).toEqual({});
  });

  it('creates a likert question with scaleMax config', () => {
    const q = createQuestionOfType('likert', 0);
    expect(q.type).toBe('likert');
    expect(q.options).toEqual([]);
    expect(q.config).toEqual({ scaleMax: 5 });
  });
});

describe('duplicateQuestion', () => {
  it('creates a copy with empty id', () => {
    const original = { ...createDefaultQuestion(0), id: 'q1', text: 'Hello?' };
    const copy = duplicateQuestion(original, 1);
    expect(copy.id).toBe('');
    expect(copy.text).toBe('Hello?');
    expect(copy.sortOrder).toBe(1);
  });

  it('deep copies options', () => {
    const original = createDefaultQuestion(0);
    original.id = 'q1';
    const copy = duplicateQuestion(original, 1);
    copy.options[0].label = 'Changed';
    expect(original.options[0].label).toBe('Option 1');
  });
});

describe('duplicateSection', () => {
  it('creates a copy with empty id and duplicated questions', () => {
    const section: BuilderSection = {
      id: 's1',
      title: 'My Section',
      description: '',
      sortOrder: 0,
      questions: [{ ...createDefaultQuestion(0), id: 'q1', text: 'Q1' }],
    };
    const copy = duplicateSection(section, 1);
    expect(copy.id).toBe('');
    expect(copy.title).toBe('My Section');
    expect(copy.questions).toHaveLength(1);
    expect(copy.questions[0].id).toBe('');
    expect(copy.questions[0].text).toBe('Q1');
  });
});

describe('estimateCompletionSeconds', () => {
  it('returns 0 for empty sections', () => {
    expect(estimateCompletionSeconds([])).toBe(0);
  });

  it('estimates radio at 15s, text at 20s, textarea at 45s', () => {
    const sections: BuilderSection[] = [
      {
        id: 's1',
        title: 'S1',
        description: '',
        sortOrder: 0,
        questions: [
          { ...createDefaultQuestion(0), type: 'radio' },
          { ...createDefaultQuestion(1), type: 'text' },
          { ...createDefaultQuestion(2), type: 'textarea' },
        ],
      },
    ];
    expect(estimateCompletionSeconds(sections)).toBe(15 + 20 + 45);
  });
});

describe('formatDuration', () => {
  it('formats under 60s', () => {
    expect(formatDuration(30)).toBe('under 1 min');
  });

  it('formats minutes', () => {
    expect(formatDuration(120)).toBe('~2 min');
  });

  it('rounds to nearest minute', () => {
    expect(formatDuration(89)).toBe('~1 min');
  });
});
