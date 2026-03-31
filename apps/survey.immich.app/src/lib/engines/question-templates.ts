import type { BuilderQuestion } from './builder-engine.svelte';

export interface QuestionTemplate {
  id: string;
  name: string;
  category: string;
  question: Omit<BuilderQuestion, 'id' | 'sortOrder'>;
}

export const questionTemplates: QuestionTemplate[] = [
  {
    id: 'nps',
    name: 'Net Promoter Score',
    category: 'Feedback',
    question: {
      text: 'How likely are you to recommend us to a friend or colleague?',
      description: '',
      type: 'nps',
      options: [],
      required: true,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: '',
      config: { scaleMax: 10 },
    },
  },
  {
    id: 'csat',
    name: 'Customer Satisfaction',
    category: 'Feedback',
    question: {
      text: 'How satisfied are you with our service?',
      description: '',
      type: 'rating',
      options: [],
      required: true,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: '',
      config: { scaleMax: 5, lowLabel: 'Very Dissatisfied', highLabel: 'Very Satisfied' },
    },
  },
  {
    id: 'name',
    name: 'Full Name',
    category: 'Demographics',
    question: {
      text: 'What is your name?',
      description: '',
      type: 'text',
      options: [],
      required: true,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: 'Enter your full name',
      config: {},
    },
  },
  {
    id: 'email',
    name: 'Email Address',
    category: 'Demographics',
    question: {
      text: 'What is your email address?',
      description: '',
      type: 'email',
      options: [],
      required: true,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: 'you@example.com',
      config: {},
    },
  },
  {
    id: 'age',
    name: 'Age',
    category: 'Demographics',
    question: {
      text: 'How old are you?',
      description: '',
      type: 'number',
      options: [],
      required: false,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: '',
      config: { min: 13, max: 120 },
    },
  },
  {
    id: 'country',
    name: 'Country',
    category: 'Demographics',
    question: {
      text: 'What country are you from?',
      description: '',
      type: 'dropdown',
      options: [
        { label: 'United States', value: 'United States' },
        { label: 'United Kingdom', value: 'United Kingdom' },
        { label: 'Canada', value: 'Canada' },
        { label: 'Australia', value: 'Australia' },
        { label: 'Germany', value: 'Germany' },
        { label: 'France', value: 'France' },
        { label: 'India', value: 'India' },
        { label: 'Japan', value: 'Japan' },
        { label: 'Brazil', value: 'Brazil' },
        { label: 'Other', value: 'Other' },
      ],
      required: false,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: '',
      config: {},
    },
  },
  {
    id: 'open-feedback',
    name: 'Open Feedback',
    category: 'Feedback',
    question: {
      text: 'Any additional comments or feedback?',
      description: '',
      type: 'textarea',
      options: [],
      required: false,
      hasOther: false,
      otherPrompt: '',
      maxLength: 5000,
      placeholder: 'Share your thoughts...',
      config: {},
    },
  },
  {
    id: 'overall-experience',
    name: 'Overall Experience',
    category: 'Feedback',
    question: {
      text: 'How would you rate your overall experience?',
      description: '',
      type: 'rating',
      options: [],
      required: true,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: '',
      config: { scaleMax: 5, lowLabel: 'Poor', highLabel: 'Excellent' },
    },
  },
  {
    id: 'agreement',
    name: 'Agreement Scale',
    category: 'Feedback',
    question: {
      text: 'I am satisfied with the quality of service provided.',
      description: '',
      type: 'likert',
      options: [],
      required: true,
      hasOther: false,
      otherPrompt: '',
      maxLength: null,
      placeholder: '',
      config: { scaleMax: 5, lowLabel: 'Strongly Disagree', highLabel: 'Strongly Agree' },
    },
  },
];

export function getTemplatesByCategory(): Map<string, QuestionTemplate[]> {
  const map = new Map<string, QuestionTemplate[]>();
  for (const t of questionTemplates) {
    if (!map.has(t.category)) {
      map.set(t.category, []);
    }
    map.get(t.category)!.push(t);
  }
  return map;
}
