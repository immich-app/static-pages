/**
 * Memory profiler for the SurveyDO cache.
 *
 * Simulates the in-memory state the DO would hold at various load levels and
 * measures actual V8 heap usage via process.memoryUsage().
 *
 * Usage: tsx scripts/memory-profile.ts
 */

interface RespondentState {
  isComplete: boolean;
  hasSubmitted: boolean;
  choiceAnswers: Map<string, { value: string; otherText: string | null }>;
}

const CHOICE_TYPES = new Set(['radio', 'checkbox', 'dropdown', 'rating', 'nps', 'likert']);

interface AnswerTally {
  value: string;
  otherText: string | null;
  count: number;
}

interface SurveyRow {
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

interface SectionRow {
  id: string;
  survey_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface QuestionRow {
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

// ============================================================
// Data generators
// ============================================================

function uuid(): string {
  return [8, 4, 4, 4, 12].map((n) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  ).join('-');
}

function generateSurvey(): SurveyRow {
  return {
    id: uuid(),
    title: 'Sample Survey — Customer Feedback',
    description: 'A survey to gather customer feedback about our products and services.',
    slug: 'customer-feedback',
    status: 'published',
    welcome_title: 'Welcome to our feedback survey',
    welcome_description: 'Thank you for taking the time to share your thoughts. This should take about 5 minutes.',
    thank_you_title: 'Thank you for your response!',
    thank_you_description: 'We appreciate your feedback and will use it to improve our products.',
    closes_at: null,
    max_responses: null,
    randomize_questions: 0,
    randomize_options: 0,
    password_hash: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function generateSections(count: number, surveyId: string): SectionRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uuid(),
    survey_id: surveyId,
    title: `Section ${i + 1}: Some topic here`,
    description: 'A brief description of what this section covers and why it matters.',
    sort_order: i,
  }));
}

const QUESTION_TYPES = ['radio', 'checkbox', 'text', 'textarea', 'email', 'rating', 'nps', 'number', 'dropdown', 'likert'];

function generateQuestions(count: number, surveyId: string, sections: SectionRow[]): QuestionRow[] {
  return Array.from({ length: count }, (_, i) => {
    const type = QUESTION_TYPES[i % QUESTION_TYPES.length];
    const section = sections[i % sections.length];
    const hasOptions = ['radio', 'checkbox', 'dropdown'].includes(type);
    const options = hasOptions
      ? JSON.stringify([
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' },
          { label: 'Option 3', value: 'opt3' },
          { label: 'Option 4', value: 'opt4' },
        ])
      : null;
    return {
      id: uuid(),
      survey_id: surveyId,
      section_id: section.id,
      text: `Question ${i + 1}: What do you think about our product feature?`,
      description: 'Please provide your honest feedback based on your experience.',
      type,
      options,
      required: 1,
      has_other: 0,
      other_prompt: null,
      max_length: type === 'textarea' ? 500 : null,
      placeholder: 'Enter your response here',
      sort_order: i,
      conditional: null,
      config: null,
    };
  });
}

function generateAnswer(question: QuestionRow, fillLevel: 'short' | 'medium' | 'long'): { value: string; otherText: string | null } {
  switch (question.type) {
    case 'text':
      return { value: 'John Doe', otherText: null };
    case 'email':
      return { value: 'user@example.com', otherText: null };
    case 'textarea': {
      const base = 'This is a response about my experience. ';
      const repeats = fillLevel === 'short' ? 1 : fillLevel === 'medium' ? 5 : 20;
      return { value: base.repeat(repeats), otherText: null };
    }
    case 'radio':
    case 'dropdown':
      return { value: 'opt2', otherText: null };
    case 'checkbox':
      return { value: 'opt1,opt3', otherText: null };
    case 'rating':
      return { value: '4', otherText: null };
    case 'nps':
      return { value: '8', otherText: null };
    case 'number':
      return { value: '42', otherText: null };
    case 'likert':
      return { value: 'Agree', otherText: null };
    default:
      return { value: 'test', otherText: null };
  }
}

function generateRespondentState(questions: QuestionRow[], answerCount: number, fillLevel: 'short' | 'medium' | 'long'): RespondentState {
  // Matches the real cache: only keep choice answers in memory
  const choiceAnswers = new Map<string, { value: string; otherText: string | null }>();
  const actualCount = Math.min(answerCount, questions.length);
  for (let i = 0; i < actualCount; i++) {
    if (CHOICE_TYPES.has(questions[i].type)) {
      choiceAnswers.set(questions[i].id, generateAnswer(questions[i], fillLevel));
    }
  }
  return { isComplete: false, hasSubmitted: actualCount > 0, choiceAnswers };
}

function generateTallies(questions: QuestionRow[], uniqueValuesPerQuestion: number): Map<string, AnswerTally[]> {
  const tallies = new Map<string, AnswerTally[]>();
  const choiceTypes = new Set(['radio', 'checkbox', 'dropdown', 'rating', 'nps', 'likert']);
  for (const q of questions) {
    if (!choiceTypes.has(q.type)) continue;
    const tally: AnswerTally[] = [];
    for (let i = 0; i < uniqueValuesPerQuestion; i++) {
      tally.push({ value: `value_${i}`, otherText: null, count: Math.floor(Math.random() * 1000) });
    }
    tallies.set(q.id, tally);
  }
  return tallies;
}

// ============================================================
// Profiler
// ============================================================

function measure<T>(label: string, setup: () => T): { label: string; result: T; bytes: number } {
  // Force GC before + after for accurate measurement
  if (global.gc) global.gc();
  const before = process.memoryUsage().heapUsed;

  const result = setup();

  if (global.gc) global.gc();
  const after = process.memoryUsage().heapUsed;

  return { label, result, bytes: after - before };
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ============================================================
// Scenarios
// ============================================================

interface Scenario {
  name: string;
  questionCount: number;
  sectionCount: number;
  fillLevel: 'short' | 'medium' | 'long';
}

const SCENARIOS: Scenario[] = [
  { name: 'Small (10q, short answers)', questionCount: 10, sectionCount: 3, fillLevel: 'short' },
  { name: 'Medium (20q, medium answers)', questionCount: 20, sectionCount: 5, fillLevel: 'medium' },
  { name: 'Large (50q, long textareas)', questionCount: 50, sectionCount: 10, fillLevel: 'long' },
];

const CONCURRENT_COUNTS = [100, 1000, 5000, 10000];

function profileScenario(scenario: Scenario) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Scenario: ${scenario.name}`);
  console.log('='.repeat(70));

  // 1. Measure static survey cache
  const staticMeasure = measure('Static cache (survey + sections + questions + tallies)', () => {
    const survey = generateSurvey();
    const sections = generateSections(scenario.sectionCount, survey.id);
    const questions = generateQuestions(scenario.questionCount, survey.id, sections);
    const tallies = generateTallies(questions, 10);
    const counters = { total: 0, completed: 0 };
    return { survey, sections, questions, tallies, counters };
  });

  console.log(`\n  Static data (survey + ${scenario.sectionCount} sections + ${scenario.questionCount} questions + tallies):`);
  console.log(`    ${fmt(staticMeasure.bytes)}`);

  // Keep reference so GC doesn't collect
  const questions = staticMeasure.result.questions;

  // 2. Measure single respondent (answered all questions)
  const singleRespondent = measure('Single respondent state (all answers)', () => {
    return generateRespondentState(questions, scenario.questionCount, scenario.fillLevel);
  });

  console.log(`\n  Per-respondent state (all ${scenario.questionCount} questions answered):`);
  console.log(`    ${fmt(singleRespondent.bytes)}`);

  // 3. Measure concurrent respondents at various scales
  console.log(`\n  Concurrent respondent scaling:`);
  console.log(`    ${'Users'.padEnd(10)} ${'Total cache'.padEnd(15)} ${'Per-user avg'.padEnd(15)} ${'% of 100MB'}`);

  for (const count of CONCURRENT_COUNTS) {
    const concurrent = measure(`${count} concurrent`, () => {
      const states = new Map<string, RespondentState>();
      for (let i = 0; i < count; i++) {
        // Mix: 30% just started, 40% halfway, 30% almost done
        const progress = i % 10;
        const answerCount =
          progress < 3 ? Math.floor(scenario.questionCount * 0.1) :
          progress < 7 ? Math.floor(scenario.questionCount * 0.5) :
          Math.floor(scenario.questionCount * 0.9);
        states.set(uuid(), generateRespondentState(questions, answerCount, scenario.fillLevel));
      }
      return states;
    });

    const perUser = concurrent.bytes / count;
    const pctOf100MB = ((concurrent.bytes / (100 * 1024 * 1024)) * 100).toFixed(1);
    console.log(
      `    ${String(count).padEnd(10)} ${fmt(concurrent.bytes).padEnd(15)} ${fmt(perUser).padEnd(15)} ${pctOf100MB}%`,
    );
  }
}

// ============================================================
// Main
// ============================================================

console.log('Survey DO Memory Profiler');
console.log(`Node ${process.version} | V8 heap used: ${fmt(process.memoryUsage().heapUsed)}`);
console.log(`Budget: 128 MB total DO memory (assume ~100 MB usable after runtime overhead)`);

if (!global.gc) {
  console.log('\n⚠  For accurate measurements, run with: node --expose-gc --import tsx scripts/memory-profile.ts');
}

for (const scenario of SCENARIOS) {
  profileScenario(scenario);
}

console.log('\n' + '='.repeat(70));
console.log('Notes:');
console.log('  - Static cache is a fixed cost per DO (one-time).');
console.log('  - Per-user state is evicted on complete() — only in-progress users count.');
console.log('  - WebSocket hibernation state is not included (managed by Cloudflare).');
console.log('  - Measurements include V8 object/Map overhead.');
console.log('='.repeat(70));
