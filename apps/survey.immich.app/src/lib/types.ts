export type QuestionType =
  | 'radio'
  | 'checkbox'
  | 'text'
  | 'textarea'
  | 'email'
  | 'rating'
  | 'nps'
  | 'number'
  | 'dropdown'
  | 'likert';

export interface QuestionOption {
  label: string;
  value: string;
}

/**
 * Per-question config payload. Shape varies by question type — this is the
 * union of every field the builder or runtime might read. Fields are all
 * optional; the relevant subset is populated based on `SurveyQuestion.type`.
 */
export interface SurveyQuestionConfig {
  // Number
  min?: number;
  max?: number;
  integerOnly?: boolean;
  step?: number;

  // Rating / NPS
  scaleMax?: number;

  // Rating / Likert
  lowLabel?: string;
  highLabel?: string;
  /** Legacy shape — some older surveys persisted labels as an object. */
  scaleLabels?: { low: string; high: string };

  // Text / textarea
  minLength?: number;
  pattern?: string;
  patternError?: string;
  minWords?: number;
  maxWords?: number;

  // Email
  allowedDomains?: string[];

  // Checkbox
  minSelections?: number;
  maxSelections?: number;

  // Skip logic
  skipSourceQuestion?: string;
  skipConditionType?: 'skipped' | 'equals' | 'notEquals' | 'anyOf';
  skipConditionValue?: string;
  skipConditionValues?: string;
}

export interface SurveyQuestion {
  id: string;
  section_id: string;
  text: string;
  description?: string;
  type: QuestionType;
  options?: QuestionOption[];
  hasOther?: boolean;
  otherPrompt?: string;
  maxLength?: number;
  placeholder?: string;
  required: boolean;
  sortOrder: number;
  config?: SurveyQuestionConfig;
  conditional?: {
    showIf: {
      questionId: string;
      condition: 'skipped' | 'equals' | 'notEquals' | 'anyOf';
      value?: string;
      values?: string[];
    };
  };
}

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
}

export interface SurveyAnswer {
  value: string;
  otherText?: string;
}

export type SurveyStatus = 'draft' | 'published' | 'closed';

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  status: SurveyStatus;
  welcomeTitle: string | null;
  welcomeDescription: string | null;
  thankYouTitle: string | null;
  thankYouDescription: string | null;
  closesAt: string | null;
  maxResponses: number | null;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  hasPassword: boolean;
  requiresPassword?: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyWithDetails {
  survey: Survey;
  sections: SurveySection[];
  questions: SurveyQuestion[];
}

export interface TimelineDataPoint {
  period: string;
  started: number;
  completed: number;
}

export interface DropoffDataPoint {
  questionId: string;
  questionText: string;
  respondentsReached: number;
  respondentsAnswered: number;
  dropoffRate: number;
}

export interface CompletionTimeBucket {
  label: string;
  minSeconds: number;
  maxSeconds: number | null;
  count: number;
}

export interface CompletionTimesPayload {
  count: number;
  mean: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
  min: number | null;
  max: number | null;
  buckets: CompletionTimeBucket[];
}

export interface QuestionTimingEntry {
  questionId: string;
  questionText: string;
  sampleSize: number;
  meanMs: number | null;
  medianMs: number | null;
  p5Ms: number | null;
  p25Ms: number | null;
  p75Ms: number | null;
  p95Ms: number | null;
  minMs: number | null;
  maxMs: number | null;
}

export interface RespondentSummary {
  id: string;
  createdAt: string;
  completedAt: string | null;
  answerCount: number;
}

export interface RespondentDetail {
  id: string;
  createdAt: string;
  completedAt: string | null;
  answers: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    value: string;
    otherText: string | null;
  }>;
}

export interface SearchResult {
  respondentId: string;
  questionId: string;
  questionText: string;
  answer: string;
}

export interface LiveCounts {
  activeViewers: number;
  activeRespondents: number;
}

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}
