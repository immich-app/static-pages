import type { SurveySection, QuestionOption, QuestionType } from '../types';

export interface BuilderSection extends SurveySection {
  questions: BuilderQuestion[];
}

export interface BuilderQuestion {
  id: string;
  text: string;
  description: string;
  type: QuestionType;
  options: QuestionOption[];
  required: boolean;
  hasOther: boolean;
  otherPrompt: string;
  maxLength: number | null;
  placeholder: string;
  sortOrder: number;
  config: Record<string, unknown>;
}
