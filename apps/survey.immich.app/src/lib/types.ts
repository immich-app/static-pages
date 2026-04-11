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
  config?: {
    min?: number;
    max?: number;
    scaleMax?: number;
    scaleLabels?: { low: string; high: string };
  };
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
  medianMs: number | null;
  meanMs: number | null;
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
