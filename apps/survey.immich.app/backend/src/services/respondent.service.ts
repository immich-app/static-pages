import { RespondentRepository, AnswerRepository, type AnswerRow } from '../repositories/respondent.repository';
import { SurveyRepository, QuestionRepository, type QuestionRow, type SurveyRow } from '../repositories/survey.repository';
import { ServiceError } from './survey.service';

export interface ResumeResult {
  answers: Record<string, { value: string; otherText?: string }>;
  nextQuestionIndex: number;
  isComplete: boolean;
  respondentId: string;
  isNewRespondent: boolean;
}

export interface BatchAnswerInput {
  questionId: string;
  value: string;
  otherText?: string;
}

export interface AggregatedResult {
  questionId: string;
  answers: Array<{ value: string; otherText: string | null; count: number }>;
}

export class RespondentService {
  constructor(
    private respondents: RespondentRepository,
    private answers: AnswerRepository,
    private surveys: SurveyRepository,
    private questions: QuestionRepository,
  ) {}

  private checkSurveyClosed(survey: SurveyRow): void {
    if (survey.closes_at && new Date(survey.closes_at) < new Date()) {
      throw new ServiceError('This survey has closed', 403);
    }
  }

  private async checkResponseLimit(survey: SurveyRow): Promise<void> {
    if (survey.max_responses) {
      const counts = await this.respondents.countBySurveyId(survey.id);
      if (counts.completed >= survey.max_responses) {
        throw new ServiceError('This survey has reached its maximum number of responses', 403);
      }
    }
  }

  async resume(slug: string, respondentId: string | undefined, ipAddress: string): Promise<ResumeResult> {
    const survey = await this.surveys.getBySlug(slug);
    if (!survey || survey.status !== 'published') {
      throw new ServiceError('Survey not found', 404);
    }

    this.checkSurveyClosed(survey);
    await this.checkResponseLimit(survey);

    if (!respondentId) {
      return this.createNewRespondent(survey.id, ipAddress);
    }

    const respondent = await this.respondents.getById(respondentId);
    if (!respondent || respondent.survey_id !== survey.id) {
      return this.createNewRespondent(survey.id, ipAddress);
    }

    if (respondent.is_complete) {
      return {
        answers: {},
        nextQuestionIndex: 0,
        isComplete: true,
        respondentId: respondent.id,
        isNewRespondent: false,
      };
    }

    const answerRows = await this.answers.getByRespondentId(respondentId);
    const answersMap: Record<string, { value: string; otherText?: string }> = {};
    for (const row of answerRows) {
      answersMap[row.question_id] = {
        value: row.answer,
        ...(row.other_text ? { otherText: row.other_text } : {}),
      };
    }

    const questions = await this.questions.getBySurveyId(survey.id);
    const nextQuestionIndex = this.findNextUnanswered(questions, answersMap);

    return {
      answers: answersMap,
      nextQuestionIndex,
      isComplete: false,
      respondentId: respondent.id,
      isNewRespondent: false,
    };
  }

  async submitBatch(slug: string, respondentId: string, inputs: BatchAnswerInput[]): Promise<void> {
    if (!inputs || !Array.isArray(inputs) || inputs.length === 0 || inputs.length > 20) {
      throw new ServiceError('Invalid answers payload: must be 1-20 answers', 400);
    }

    const respondent = await this.respondents.getById(respondentId);
    if (!respondent) {
      throw new ServiceError('Respondent not found', 400);
    }

    const survey = await this.surveys.getBySlug(slug);
    if (!survey || respondent.survey_id !== survey.id) {
      throw new ServiceError('Respondent does not belong to this survey', 400);
    }

    this.checkSurveyClosed(survey);

    const now = new Date().toISOString();
    const answerRows: AnswerRow[] = inputs.map((a) => ({
      respondent_id: respondentId,
      question_id: a.questionId,
      answer: a.value,
      other_text: a.otherText ?? null,
      answered_at: now,
    }));

    await this.answers.upsertBatch(answerRows);
  }

  async complete(slug: string, respondentId: string): Promise<void> {
    const respondent = await this.respondents.getById(respondentId);
    if (!respondent) {
      throw new ServiceError('Respondent not found', 400);
    }

    const survey = await this.surveys.getBySlug(slug);
    if (!survey || respondent.survey_id !== survey.id) {
      throw new ServiceError('Respondent does not belong to this survey', 400);
    }

    await this.respondents.markComplete(respondentId);
  }

  async getResults(surveyId: string): Promise<{
    respondentCounts: { total: number; completed: number };
    results: AggregatedResult[];
  }> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }

    const [respondentCounts, rawResults] = await Promise.all([
      this.respondents.countBySurveyId(surveyId),
      this.answers.getAggregatedResults(surveyId),
    ]);

    const grouped = new Map<string, AggregatedResult>();
    for (const row of rawResults) {
      if (!grouped.has(row.question_id)) {
        grouped.set(row.question_id, { questionId: row.question_id, answers: [] });
      }
      grouped.get(row.question_id)!.answers.push({
        value: row.answer,
        otherText: row.other_text,
        count: row.count,
      });
    }

    return {
      respondentCounts,
      results: [...grouped.values()],
    };
  }

  async exportResponses(
    surveyId: string,
    format: 'csv' | 'json',
  ): Promise<{ data: string; contentType: string; filename: string }> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) {
      throw new ServiceError('Survey not found', 404);
    }

    const questions = await this.questions.getBySurveyId(surveyId);
    const responses = await this.answers.getAllResponsesForSurvey(surveyId);

    if (format === 'json') {
      const respondentMap = new Map<
        string,
        {
          respondentId: string;
          completedAt: string | null;
          answers: Record<string, { value: string; otherText: string | null }>;
        }
      >();
      for (const row of responses) {
        if (!respondentMap.has(row.respondent_id)) {
          respondentMap.set(row.respondent_id, {
            respondentId: row.respondent_id,
            completedAt: row.completed_at,
            answers: {},
          });
        }
        respondentMap.get(row.respondent_id)!.answers[row.question_id] = {
          value: row.answer,
          otherText: row.other_text,
        };
      }
      const data = JSON.stringify([...respondentMap.values()], null, 2);
      return { data, contentType: 'application/json', filename: `${survey.slug ?? survey.id}-responses.json` };
    }

    // CSV format
    const questionColumns: Array<{ id: string; text: string; hasOther: boolean }> = questions.map((q) => ({
      id: q.id,
      text: q.text,
      hasOther: q.has_other === 1,
    }));

    const headers = ['respondent_id', 'completed_at'];
    for (const col of questionColumns) {
      headers.push(this.csvSafe(col.text));
      if (col.hasOther) {
        headers.push(this.csvSafe(col.text) + '_other');
      }
    }

    const respondentMap = new Map<
      string,
      { completedAt: string | null; answers: Map<string, { value: string; otherText: string | null }> }
    >();
    for (const row of responses) {
      if (!respondentMap.has(row.respondent_id)) {
        respondentMap.set(row.respondent_id, { completedAt: row.completed_at, answers: new Map() });
      }
      respondentMap.get(row.respondent_id)!.answers.set(row.question_id, {
        value: row.answer,
        otherText: row.other_text,
      });
    }

    const rows: string[] = [headers.map((h) => `"${h}"`).join(',')];
    for (const [respondentId, data] of respondentMap) {
      const row: string[] = [`"${respondentId}"`, `"${data.completedAt ?? ''}"`];
      for (const col of questionColumns) {
        const answer = data.answers.get(col.id);
        row.push(`"${this.csvSafe(answer?.value ?? '')}"`);
        if (col.hasOther) {
          row.push(`"${this.csvSafe(answer?.otherText ?? '')}"`);
        }
      }
      rows.push(row.join(','));
    }

    return { data: rows.join('\n'), contentType: 'text/csv', filename: `${survey.slug ?? survey.id}-responses.csv` };
  }

  private csvSafe(value: string): string {
    return value.replace(/"/g, '""');
  }

  private async createNewRespondent(surveyId: string, ipAddress: string): Promise<ResumeResult> {
    const id = crypto.randomUUID();
    await this.respondents.create({
      id,
      survey_id: surveyId,
      ip_address: ipAddress,
      is_complete: 0,
      created_at: new Date().toISOString(),
      completed_at: null,
    });

    return {
      answers: {},
      nextQuestionIndex: 0,
      isComplete: false,
      respondentId: id,
      isNewRespondent: true,
    };
  }

  private findNextUnanswered(
    questions: QuestionRow[],
    answers: Record<string, { value: string; otherText?: string }>,
  ): number {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (q.conditional) {
        try {
          const cond = JSON.parse(q.conditional) as {
            showIf: { questionId: string; condition: string };
          };
          if (cond.showIf.condition === 'skipped' && answers[cond.showIf.questionId]) {
            continue;
          }
        } catch {
          // skip malformed conditional
        }
      }

      if (!answers[q.id]) {
        return i;
      }
    }
    return questions.length;
  }
}
