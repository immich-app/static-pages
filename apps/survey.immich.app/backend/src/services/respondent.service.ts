import { RespondentRepository, AnswerRepository, type AnswerRow } from '../repositories/respondent.repository';
import {
  SurveyRepository,
  QuestionRepository,
  type QuestionRow,
  type SurveyRow,
} from '../repositories/survey.repository';
import { ServiceError } from './errors';
import { BATCH_ANSWER_LIMIT } from '../constants';

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
  answerMs?: number;
}

const MAX_ANSWER_MS = 24 * 60 * 60 * 1000;

function clampAnswerMs(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null;
  return Math.min(Math.floor(raw), MAX_ANSWER_MS);
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

  async resume(
    slug: string,
    respondentId: string | undefined,
    ipAddress: string,
    knownSurvey?: SurveyRow,
  ): Promise<ResumeResult> {
    const survey = knownSurvey ?? (await this.surveys.getBySlug(slug));
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

  async submitBatch(
    slug: string,
    respondentId: string,
    inputs: BatchAnswerInput[],
    knownSurvey?: SurveyRow,
  ): Promise<void> {
    if (!inputs || !Array.isArray(inputs) || inputs.length === 0 || inputs.length > BATCH_ANSWER_LIMIT) {
      throw new ServiceError(`Invalid answers payload: must be 1-${BATCH_ANSWER_LIMIT} answers`, 400);
    }

    const respondent = await this.respondents.getById(respondentId);
    if (!respondent) {
      throw new ServiceError('Respondent not found', 404);
    }

    const survey = knownSurvey ?? (await this.surveys.getBySlug(slug));
    if (!survey || respondent.survey_id !== survey.id) {
      throw new ServiceError('Respondent does not belong to this survey', 403);
    }

    this.checkSurveyClosed(survey);

    const surveyQuestions = await this.questions.getBySurveyId(survey.id);
    const validQuestionIds = new Set(surveyQuestions.map((q) => q.id));
    for (const input of inputs) {
      if (!validQuestionIds.has(input.questionId)) {
        throw new ServiceError(`Invalid question ID: ${input.questionId}`, 400);
      }
    }

    const now = new Date().toISOString();
    const answerRows: AnswerRow[] = inputs.map((a) => ({
      respondent_id: respondentId,
      question_id: a.questionId,
      answer: a.value,
      other_text: a.otherText ?? null,
      answered_at: now,
      answer_ms: clampAnswerMs(a.answerMs),
    }));

    await this.answers.upsertBatch(answerRows);
  }

  async complete(slug: string, respondentId: string, knownSurvey?: SurveyRow): Promise<void> {
    const respondent = await this.respondents.getById(respondentId);
    if (!respondent) {
      throw new ServiceError('Respondent not found', 404);
    }

    const survey = knownSurvey ?? (await this.surveys.getBySlug(slug));
    if (!survey || respondent.survey_id !== survey.id) {
      throw new ServiceError('Respondent does not belong to this survey', 403);
    }

    await this.respondents.markComplete(respondentId);
  }

  async deleteRespondent(surveyId: string, respondentId: string): Promise<void> {
    const respondent = await this.respondents.getById(respondentId);
    if (!respondent || respondent.survey_id !== surveyId) {
      throw new ServiceError('Respondent not found', 404);
    }
    await this.respondents.deleteWithAnswers(respondentId);
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
      grouped.get(row.question_id)?.answers.push({
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
        const entry = respondentMap.get(row.respondent_id);
        if (entry) {
          entry.answers[row.question_id] = {
            value: row.answer,
            otherText: row.other_text,
          };
        }
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
      const csvEntry = respondentMap.get(row.respondent_id);
      csvEntry?.answers.set(row.question_id, {
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

  async getTimeline(
    surveyId: string,
    granularity: 'minute' | 'hour' | 'day',
  ): Promise<Array<{ period: string; started: number; completed: number }>> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) throw new ServiceError('Survey not found', 404);
    return this.respondents.getTimelineData(surveyId, granularity);
  }

  async getQuestionTimings(surveyId: string): Promise<
    Array<{
      questionId: string;
      questionText: string;
      sampleSize: number;
      medianMs: number | null;
      meanMs: number | null;
    }>
  > {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) throw new ServiceError('Survey not found', 404);

    const rows = await this.respondents.getAnswerDurationsByQuestion(surveyId);
    if (rows.length === 0) return [];

    // Bucket durations by question, preserving survey order.
    const byQ = new Map<string, { questionId: string; questionText: string; sort: number; durations: number[] }>();
    for (const r of rows) {
      let entry = byQ.get(r.question_id);
      if (!entry) {
        entry = { questionId: r.question_id, questionText: r.question_text, sort: r.question_sort, durations: [] };
        byQ.set(r.question_id, entry);
      }
      entry.durations.push(r.answer_ms);
    }

    return [...byQ.values()]
      .sort((a, b) => a.sort - b.sort)
      .map((q) => {
        const sorted = [...q.durations].sort((a, b) => a - b);
        const n = sorted.length;
        const sum = sorted.reduce((acc, v) => acc + v, 0);
        const median = n > 0 ? sorted[Math.floor(n / 2)] : null;
        const mean = n > 0 ? Math.round(sum / n) : null;
        return {
          questionId: q.questionId,
          questionText: q.questionText,
          sampleSize: n,
          medianMs: median,
          meanMs: mean,
        };
      });
  }

  async getCompletionTimes(surveyId: string): Promise<{
    count: number;
    median: number | null;
    mean: number | null;
    p25: number | null;
    p75: number | null;
    min: number | null;
    max: number | null;
    buckets: Array<{ label: string; minSeconds: number; maxSeconds: number | null; count: number }>;
  }> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) throw new ServiceError('Survey not found', 404);
    const durations = await this.respondents.getCompletionDurationsSeconds(surveyId);
    const count = durations.length;

    const buckets: Array<{ label: string; minSeconds: number; maxSeconds: number | null; count: number }> = [
      { label: '<30s', minSeconds: 0, maxSeconds: 30, count: 0 },
      { label: '30s–1m', minSeconds: 30, maxSeconds: 60, count: 0 },
      { label: '1–2m', minSeconds: 60, maxSeconds: 120, count: 0 },
      { label: '2–5m', minSeconds: 120, maxSeconds: 300, count: 0 },
      { label: '5–10m', minSeconds: 300, maxSeconds: 600, count: 0 },
      { label: '10–30m', minSeconds: 600, maxSeconds: 1800, count: 0 },
      { label: '30m–1h', minSeconds: 1800, maxSeconds: 3600, count: 0 },
      { label: '>1h', minSeconds: 3600, maxSeconds: null, count: 0 },
    ];
    for (const d of durations) {
      for (const b of buckets) {
        if (d >= b.minSeconds && (b.maxSeconds === null || d < b.maxSeconds)) {
          b.count += 1;
          break;
        }
      }
    }

    if (count === 0) {
      return { count: 0, median: null, mean: null, p25: null, p75: null, min: null, max: null, buckets };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const percentile = (p: number) => {
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
      return sorted[idx];
    };
    const sum = sorted.reduce((acc, v) => acc + v, 0);

    return {
      count,
      mean: Math.round(sum / count),
      median: percentile(50),
      p25: percentile(25),
      p75: percentile(75),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      buckets,
    };
  }

  async getDropoff(surveyId: string): Promise<
    Array<{
      questionId: string;
      questionText: string;
      respondentsReached: number;
      respondentsAnswered: number;
      dropoffRate: number;
    }>
  > {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) throw new ServiceError('Survey not found', 404);

    const counts = await this.respondents.countBySurveyId(surveyId);
    const dropoffData = await this.answers.getDropoffData(surveyId);
    const totalRespondents = counts.total;

    return dropoffData.map((d, i) => {
      const reached = i === 0 ? totalRespondents : dropoffData[i - 1].answer_count;
      return {
        questionId: d.question_id,
        questionText: d.question_text,
        respondentsReached: reached,
        respondentsAnswered: d.answer_count,
        dropoffRate: reached > 0 ? Math.round(((reached - d.answer_count) / reached) * 100) : 0,
      };
    });
  }

  async listRespondents(
    surveyId: string,
    offset: number,
    limit: number,
  ): Promise<{
    respondents: Array<{ id: string; createdAt: string; completedAt: string | null; answerCount: number }>;
    total: number;
  }> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) throw new ServiceError('Survey not found', 404);

    const data = await this.respondents.listBySurveyId(surveyId, offset, limit);
    return {
      respondents: data.respondents.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        answerCount: r.answer_count,
      })),
      total: data.total,
    };
  }

  async getRespondentDetail(
    surveyId: string,
    respondentId: string,
  ): Promise<{
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
  }> {
    const respondent = await this.respondents.getById(respondentId);
    if (!respondent || respondent.survey_id !== surveyId) {
      throw new ServiceError('Respondent not found', 404);
    }

    const answers = await this.answers.getAnswersForRespondent(respondentId);
    return {
      id: respondent.id,
      createdAt: respondent.created_at,
      completedAt: respondent.completed_at,
      answers: answers.map((a) => ({
        questionId: a.question_id,
        questionText: a.question_text,
        questionType: a.question_type,
        value: a.answer,
        otherText: a.other_text,
      })),
    };
  }

  async searchAnswers(
    surveyId: string,
    query: string,
    questionId?: string,
    pagination?: { offset: number; limit: number },
  ): Promise<{
    results: Array<{ respondentId: string; questionId: string; questionText: string; answer: string }>;
    total: number;
    offset: number;
    limit: number;
  }> {
    const survey = await this.surveys.getById(surveyId);
    if (!survey) throw new ServiceError('Survey not found', 404);

    if (!query || query.trim().length < 2) {
      throw new ServiceError('Search query must be at least 2 characters', 400);
    }

    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? 50;
    const { results: rawResults, total } = await this.answers.searchTextAnswers(
      surveyId,
      query.trim(),
      questionId,
      offset,
      limit,
    );
    return {
      results: rawResults.map((r) => ({
        respondentId: r.respondent_id,
        questionId: r.question_id,
        questionText: r.question_text,
        answer: r.answer,
      })),
      total,
      offset,
      limit,
    };
  }

  async getLiveResults(
    surveyId: string,
    presenceCounts?: { activeViewers: number; activeRespondents: number },
  ): Promise<{
    respondentCounts: { total: number; completed: number };
    results: AggregatedResult[];
    liveCounts: { activeViewers: number; activeRespondents: number };
  }> {
    const baseResults = await this.getResults(surveyId);

    const liveCounts = presenceCounts ?? {
      activeViewers: 0,
      activeRespondents: await this.respondents.countActiveBySurveyId(surveyId),
    };

    return { ...baseResults, liveCounts };
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
          if (cond.showIf.condition === 'skipped' && cond.showIf.questionId in answers) {
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
