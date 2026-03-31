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
  createdAt: string;
  updatedAt: string;
}

export interface SurveyWithDetails {
  survey: Survey;
  sections: SurveySection[];
  questions: SurveyQuestion[];
}
