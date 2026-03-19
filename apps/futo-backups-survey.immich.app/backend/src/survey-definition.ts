interface SurveyQuestion {
  id: string;
  conditional?: {
    showIf: { questionId: string; condition: 'skipped' };
  };
}

const opt = (label: string) => ({ label, value: label });

export const questions: SurveyQuestion[] = [
  { id: 'q1' },
  { id: 'q2' },
  { id: 'q3' },
  { id: 'q4' },
  { id: 'q5' },
  { id: 'q6' },
  { id: 'q7' },
  { id: 'q8' },
  { id: 'q9' },
  { id: 'q10' },
  { id: 'q11' },
  { id: 'q12' },
  { id: 'q13' },
  { id: 'q14' },
  { id: 'q15' },
  { id: 'q16' },
  { id: 'q17' },
  {
    id: 'q18',
    conditional: {
      showIf: { questionId: 'q17', condition: 'skipped' },
    },
  },
  { id: 'q19' },
];
