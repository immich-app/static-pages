/**
 * Typed WebSocket protocol for per-survey Durable Object communication.
 *
 * This file defines the contract between the frontend WS client and the
 * backend DO WS handler. Both sides import these types for full type safety.
 *
 * Wire format:
 *   Client → Server: { type: "request", requestId, op, data }
 *   Server → Client: { type: "response", requestId, op, data } | { type: "response", requestId, op, error }
 *   Server → Client: { type: "push", event, data }
 */

// ============================================================
// Row types (wire format — matches database schema)
// ============================================================

export interface SurveyRow {
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

export interface SectionRow {
  id: string;
  survey_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface QuestionRow {
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
// Input types (for mutations)
// ============================================================

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

export interface ReorderItem {
  id: string;
  sort_order: number;
}

export interface AnswerInput {
  questionId: string;
  value: string;
  otherText?: string;
  /** Client-measured ms spent on this question before committing. */
  answerMs?: number;
}

// ============================================================
// Response payload types
// ============================================================

export interface SurveyWithDetailsPayload {
  survey: SurveyRow;
  sections: SectionRow[];
  questions: QuestionRow[];
}

export interface PublicSurveyPayload {
  survey: Omit<SurveyRow, 'password_hash'> | Partial<SurveyRow>;
  sections: SectionRow[];
  questions: QuestionRow[];
  requiresPassword?: boolean;
}

export interface AggregatedResult {
  questionId: string;
  answers: Array<{ value: string; otherText: string | null; count: number }>;
}

export interface ResultsPayload {
  respondentCounts: { total: number; completed: number };
  results: AggregatedResult[];
}

export interface LiveResultsPayload extends ResultsPayload {
  liveCounts: { activeViewers: number; activeRespondents: number };
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
  /** Median milliseconds spent on this question. */
  medianMs: number | null;
  meanMs: number | null;
}

export interface SlowAnalyticsPayload {
  timeline: TimelineDataPoint[];
  dropoff: DropoffDataPoint[];
  completionTimes: CompletionTimesPayload;
  questionTimings: QuestionTimingEntry[];
}

export interface RespondentSummary {
  id: string;
  createdAt: string;
  completedAt: string | null;
  answerCount: number;
}

export interface RespondentDetailPayload {
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

export interface ResumePayload {
  answers: Record<string, { value: string; otherText?: string }>;
  nextQuestionIndex: number;
  isComplete: boolean;
  respondentId?: string;
  isNewRespondent?: boolean;
}

export interface SearchInput {
  query: string;
  questionId?: string;
  offset?: number;
  limit?: number;
}

export interface SearchResultsPayload {
  results: Array<{
    respondentId: string;
    questionId: string;
    questionText: string;
    answer: string;
  }>;
  total: number;
  offset: number;
  limit: number;
}

export interface SurveyDefinitionPayload {
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

// ============================================================
// WS Operations — the full typed API
// ============================================================

export interface WsOperations {
  // Survey (read-only via WS; mutations stay HTTP for D1 catalog sync)
  'get-survey': { request: Record<string, never>; response: SurveyWithDetailsPayload };
  'export-definition': { request: Record<string, never>; response: SurveyDefinitionPayload };

  // Sections
  'create-section': { request: CreateSectionInput; response: SectionRow };
  'update-section': { request: { id: string } & UpdateSectionInput; response: SectionRow };
  'delete-section': { request: { id: string }; response: Record<string, never> };
  'reorder-sections': { request: { items: ReorderItem[] }; response: Record<string, never> };

  // Questions
  'create-question': {
    request: { sectionId: string } & CreateQuestionInput;
    response: QuestionRow;
  };
  'update-question': { request: { id: string } & UpdateQuestionInput; response: QuestionRow };
  'delete-question': { request: { id: string }; response: Record<string, never> };
  'reorder-questions': {
    request: { sectionId: string; items: ReorderItem[] };
    response: Record<string, never>;
  };

  // Results
  'get-results': { request: Record<string, never>; response: ResultsPayload };
  'get-live-results': { request: Record<string, never>; response: LiveResultsPayload };
  'get-timeline': { request: { granularity: 'minute' | 'hour' | 'day' }; response: TimelineDataPoint[] };
  'get-completion-times': { request: Record<string, never>; response: CompletionTimesPayload };
  'get-question-timings': { request: Record<string, never>; response: QuestionTimingEntry[] };
  'get-dropoff': { request: Record<string, never>; response: DropoffDataPoint[] };
  'list-respondents': {
    request: { offset?: number; limit?: number };
    response: { respondents: RespondentSummary[]; total: number };
  };
  'get-respondent': { request: { respondentId: string }; response: RespondentDetailPayload };
  'delete-respondent': { request: { respondentId: string }; response: Record<string, never> };
  'search-answers': { request: SearchInput; response: SearchResultsPayload };

  // Public respondent
  'get-public-survey': { request: Record<string, never>; response: PublicSurveyPayload };
  resume: { request: Record<string, never>; response: ResumePayload };
  'submit-answers': { request: { answers: AnswerInput[] }; response: Record<string, never> };
  complete: { request: Record<string, never>; response: Record<string, never> };
}

// ============================================================
// Push Events — server-initiated messages
// ============================================================

export interface WsPushEvents {
  counts: { activeViewers: number; activeRespondents: number };
  stats: { total: number; completed: number; completionRate: number };
  results: ResultsPayload;
  analytics: SlowAnalyticsPayload;
}

// ============================================================
// Wire format types
// ============================================================

/** Client → Server */
export type WsRequestMessage = {
  [K in keyof WsOperations]: {
    type: 'request';
    requestId: string;
    op: K;
    data: WsOperations[K]['request'];
  };
}[keyof WsOperations];

/** Server → Client (response to a request) */
export type WsResponseMessage =
  | {
      [K in keyof WsOperations]: {
        type: 'response';
        requestId: string;
        op: K;
        data: WsOperations[K]['response'];
      };
    }[keyof WsOperations]
  | {
      type: 'response';
      requestId: string;
      op: keyof WsOperations;
      error: string;
    };

/** Server → Client (unsolicited push) */
export type WsPushMessage = {
  [K in keyof WsPushEvents]: {
    type: 'push';
    event: K;
    data: WsPushEvents[K];
  };
}[keyof WsPushEvents];

/** Any message the server can send */
export type WsServerMessage = WsResponseMessage | WsPushMessage;

/** Any message the client can send */
export type WsClientMessage = WsRequestMessage;
