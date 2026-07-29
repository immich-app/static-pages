import type { BuilderSection } from './builder-engine.svelte';
import { questionTemplates } from './question-templates';

export interface SurveyTemplate {
  id: string;
  name: string;
  description: string;
  sections: Omit<BuilderSection, 'id'>[];
}

function templateQuestion(templateId: string, sortOrder: number, overrides?: { text?: string }) {
  const t = questionTemplates.find((q) => q.id === templateId);
  if (!t) throw new Error(`Template ${templateId} not found`);
  return { ...t.question, id: '', sortOrder, ...overrides };
}

export const surveyTemplates: SurveyTemplate[] = [
  {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction',
    description: 'CSAT rating, NPS score, and open feedback',
    sections: [
      {
        title: 'Satisfaction',
        description: 'Tell us about your experience',
        sortOrder: 0,
        questions: [templateQuestion('csat', 0), templateQuestion('overall-experience', 1)],
      },
      {
        title: 'Recommendation',
        description: '',
        sortOrder: 1,
        questions: [templateQuestion('nps', 0)],
      },
      {
        title: 'Additional Feedback',
        description: '',
        sortOrder: 2,
        questions: [templateQuestion('open-feedback', 0)],
      },
    ],
  },
  {
    id: 'event-feedback',
    name: 'Event Feedback',
    description: 'Rate the event, speakers, and leave comments',
    sections: [
      {
        title: 'Event Rating',
        description: 'How was the event overall?',
        sortOrder: 0,
        questions: [
          {
            ...templateQuestion('overall-experience', 0),
            text: 'How would you rate the event overall?',
          },
          {
            ...templateQuestion('overall-experience', 1),
            text: 'How would you rate the speakers/presenters?',
          },
          {
            ...templateQuestion('overall-experience', 2),
            text: 'How would you rate the venue/platform?',
          },
        ],
      },
      {
        title: 'Your Thoughts',
        description: '',
        sortOrder: 1,
        questions: [
          {
            ...templateQuestion('agreement', 0),
            text: 'The event met my expectations.',
          },
          {
            ...templateQuestion('agreement', 1),
            text: 'I would attend a similar event in the future.',
          },
          templateQuestion('open-feedback', 2),
        ],
      },
    ],
  },
  {
    id: 'employee-engagement',
    name: 'Employee Engagement',
    description: 'Measure team satisfaction across work areas',
    sections: [
      {
        title: 'Work Environment',
        description: 'Rate your agreement with each statement',
        sortOrder: 0,
        questions: [
          {
            ...templateQuestion('agreement', 0),
            text: 'I feel valued as a member of my team.',
          },
          {
            ...templateQuestion('agreement', 1),
            text: 'I have the tools and resources I need to do my job well.',
          },
          {
            ...templateQuestion('agreement', 2),
            text: 'My manager provides clear expectations.',
          },
        ],
      },
      {
        title: 'Growth & Development',
        description: '',
        sortOrder: 1,
        questions: [
          {
            ...templateQuestion('agreement', 0),
            text: 'I have opportunities for professional growth.',
          },
          {
            ...templateQuestion('agreement', 1),
            text: 'I receive regular and constructive feedback.',
          },
        ],
      },
      {
        title: 'Overall',
        description: '',
        sortOrder: 2,
        questions: [
          templateQuestion('nps', 0, {
            text: 'How likely are you to recommend this company as a place to work?',
          }),
          templateQuestion('open-feedback', 1, {
            text: 'What is one thing we could do to improve your experience?',
          }),
        ],
      },
    ],
  },
];
