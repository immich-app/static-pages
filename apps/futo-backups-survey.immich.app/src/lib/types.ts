export type QuestionType = 'radio' | 'email' | 'textarea';

export interface QuestionOption {
  label: string;
  value: string;
}

export interface SurveyQuestion {
  id: string;
  section: number;
  sectionTitle: string;
  text: string;
  description?: string;
  type: QuestionType;
  options?: QuestionOption[];
  hasOther?: boolean;
  otherPrompt?: string;
  maxLength?: number;
  placeholder?: string;
  required: boolean;
  conditional?: {
    showIf: { questionId: string; condition: 'skipped' };
  };
}

export interface SurveySection {
  number: number;
  title: string;
  description?: string;
  questionIds: string[];
}

export interface SurveyAnswer {
  value: string;
  otherText?: string;
}
