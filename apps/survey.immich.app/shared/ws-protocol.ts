/**
 * Typed WebSocket protocol shared by the frontend WS client and the backend DO
 * WS handler — a change here changes both sides of the wire at once.
 */

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
  conditional?: { showIf: { questionId: string; condition: string; value?: string; values?: string[] } };
  config?: Record<string, unknown>;
}

/** Server rejects a larger submit-answers batch with a 400, so the client chunks its flush to match. */
export const BATCH_ANSWER_LIMIT = 20;

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
  conditional?: { showIf: { questionId: string; condition: string; value?: string; values?: string[] } } | null;
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
  meanMs: number | null;
  medianMs: number | null;
  p5Ms: number | null;
  p25Ms: number | null;
  p75Ms: number | null;
  p95Ms: number | null;
  minMs: number | null;
  maxMs: number | null;
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

export interface WsOperations {
  // Read-only over WS — survey mutations stay on HTTP so the D1 catalog stays in sync.
  'get-survey': { request: Record<string, never>; response: SurveyWithDetailsPayload };
  'export-definition': { request: Record<string, never>; response: SurveyDefinitionPayload };

  'create-section': { request: CreateSectionInput; response: SectionRow };
  'update-section': { request: { id: string } & UpdateSectionInput; response: SectionRow };
  'delete-section': { request: { id: string }; response: Record<string, never> };
  'reorder-sections': { request: { items: ReorderItem[] }; response: Record<string, never> };

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

  'get-public-survey': { request: Record<string, never>; response: PublicSurveyPayload };
  resume: { request: Record<string, never>; response: ResumePayload };
  'submit-answers': { request: { answers: AnswerInput[] }; response: Record<string, never> };
  complete: { request: Record<string, never>; response: Record<string, never> };
}

export interface WsPushEvents {
  counts: { activeViewers: number; activeRespondents: number };
  stats: { total: number; completed: number; completionRate: number };
  results: ResultsPayload;
  analytics: SlowAnalyticsPayload;
}

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

export type WsServerMessage = WsResponseMessage | WsPushMessage;

export type WsClientMessage = WsRequestMessage;
