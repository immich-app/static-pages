import { sql, type Kysely } from 'kysely';
import type { Database } from '../db';
import { ACTIVE_RESPONDENT_WINDOW_MS, SEARCH_RESULT_LIMIT } from '../constants';

export type { RespondentRow, AnswerRow } from '../db';

export class RespondentRepository {
  constructor(private db: Kysely<Database>) {}

  async getById(id: string) {
    return this.db.selectFrom('respondents').selectAll().where('id', '=', id).executeTakeFirst() ?? null;
  }

  async create(respondent: {
    id: string;
    survey_id: string;
    ip_address: string | null;
    is_complete: number;
    created_at: string;
    completed_at: string | null;
  }): Promise<void> {
    await this.db.insertInto('respondents').values(respondent).execute();
  }

  async markComplete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.updateTable('respondents').set({ is_complete: 1, completed_at: now }).where('id', '=', id).execute();
  }

  async countBySurveyId(surveyId: string): Promise<{ total: number; completed: number }> {
    const row = await this.db
      .selectFrom('respondents')
      .select(({ fn }) => [
        fn.count('id').as('total'),
        fn.sum(sql`CASE WHEN is_complete = 1 THEN 1 ELSE 0 END`).as('completed'),
      ])
      .where('survey_id', '=', surveyId)
      .executeTakeFirst();
    return { total: Number(row?.total ?? 0), completed: Number(row?.completed ?? 0) };
  }

  async countActiveBySurveyId(surveyId: string): Promise<number> {
    const fiveMinAgo = new Date(Date.now() - ACTIVE_RESPONDENT_WINDOW_MS).toISOString();
    const row = await this.db
      .selectFrom('respondents')
      .select(({ fn }) => [fn.count('id').as('count')])
      .where('survey_id', '=', surveyId)
      .where('is_complete', '=', 0)
      .where('created_at', '>', fiveMinAgo)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async getTimelineData(
    surveyId: string,
    granularity: 'day' | 'hour',
  ): Promise<Array<{ period: string; started: number; completed: number }>> {
    const dateExpr = granularity === 'day' ? sql`substr(created_at, 1, 10)` : sql`substr(created_at, 1, 13)`;
    const completedExpr = granularity === 'day' ? sql`substr(completed_at, 1, 10)` : sql`substr(completed_at, 1, 13)`;

    const startedResults = await this.db
      .selectFrom('respondents')
      .select([dateExpr.as('period'), ({ fn }) => fn.count('id').as('count')])
      .where('survey_id', '=', surveyId)
      .groupBy('period')
      .orderBy('period')
      .execute();

    const completedResults = await this.db
      .selectFrom('respondents')
      .select([completedExpr.as('period'), ({ fn }) => fn.count('id').as('count')])
      .where('survey_id', '=', surveyId)
      .where('is_complete', '=', 1)
      .where('completed_at', 'is not', null)
      .groupBy('period')
      .orderBy('period')
      .execute();

    const completedMap = new Map<string, number>(completedResults.map((r) => [String(r.period), Number(r.count)]));
    return startedResults.map((r) => ({
      period: String(r.period),
      started: Number(r.count),
      completed: completedMap.get(String(r.period)) ?? 0,
    }));
  }

  async deleteWithAnswers(id: string): Promise<void> {
    await this.db.deleteFrom('answers').where('respondent_id', '=', id).execute();
    await this.db.deleteFrom('respondents').where('id', '=', id).execute();
  }

  async listBySurveyId(
    surveyId: string,
    offset: number,
    limit: number,
  ): Promise<{
    respondents: Array<{
      id: string;
      created_at: string;
      completed_at: string | null;
      is_complete: number;
      answer_count: number;
    }>;
    total: number;
  }> {
    const countResult = await this.db
      .selectFrom('respondents')
      .select(({ fn }) => [fn.count('id').as('total')])
      .where('survey_id', '=', surveyId)
      .executeTakeFirst();

    const respondents = await this.db
      .selectFrom('respondents as r')
      .select([
        'r.id',
        'r.created_at',
        'r.completed_at',
        'r.is_complete',
        sql<number>`(SELECT COUNT(*) FROM answers a WHERE a.respondent_id = r.id)`.as('answer_count'),
      ])
      .where('r.survey_id', '=', surveyId)
      .orderBy('r.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      respondents: respondents as Array<{
        id: string;
        created_at: string;
        completed_at: string | null;
        is_complete: number;
        answer_count: number;
      }>,
      total: Number(countResult?.total ?? 0),
    };
  }
}

export class AnswerRepository {
  constructor(private db: Kysely<Database>) {}

  async getByRespondentId(respondentId: string) {
    return this.db.selectFrom('answers').selectAll().where('respondent_id', '=', respondentId).execute();
  }

  async upsertBatch(
    answers: Array<{
      respondent_id: string;
      question_id: string;
      answer: string;
      other_text: string | null;
      answered_at: string;
    }>,
  ): Promise<void> {
    for (const a of answers) {
      await sql`INSERT INTO answers (respondent_id, question_id, answer, other_text, answered_at)
        VALUES (${a.respondent_id}, ${a.question_id}, ${a.answer}, ${a.other_text}, ${a.answered_at})
        ON CONFLICT (respondent_id, question_id)
        DO UPDATE SET answer = excluded.answer, other_text = excluded.other_text, answered_at = excluded.answered_at`.execute(
        this.db,
      );
    }
  }

  async getAllResponsesForSurvey(surveyId: string): Promise<
    Array<{
      respondent_id: string;
      completed_at: string | null;
      question_id: string;
      answer: string;
      other_text: string | null;
    }>
  > {
    return this.db
      .selectFrom('answers as a')
      .innerJoin('respondents as r', 'a.respondent_id', 'r.id')
      .select(['a.respondent_id', 'r.completed_at', 'a.question_id', 'a.answer', 'a.other_text'])
      .where('r.survey_id', '=', surveyId)
      .where('r.is_complete', '=', 1)
      .orderBy('r.completed_at')
      .orderBy('a.respondent_id')
      .orderBy('a.question_id')
      .execute();
  }

  async getAggregatedResults(
    surveyId: string,
  ): Promise<Array<{ question_id: string; answer: string; other_text: string | null; count: number }>> {
    const results = await this.db
      .selectFrom('answers as a')
      .innerJoin('respondents as r', 'a.respondent_id', 'r.id')
      .select(({ fn }) => ['a.question_id', 'a.answer', 'a.other_text', fn.count('a.respondent_id').as('count')])
      .where('r.survey_id', '=', surveyId)
      .where('r.is_complete', '=', 1)
      .groupBy(['a.question_id', 'a.answer', 'a.other_text'])
      .orderBy('a.question_id')
      .orderBy('count', 'desc')
      .execute();
    return results.map((r) => ({ ...r, count: Number(r.count) }));
  }

  async getDropoffData(surveyId: string): Promise<
    Array<{
      question_id: string;
      question_text: string;
      sort_order: number;
      section_sort_order: number;
      answer_count: number;
    }>
  > {
    const results = await this.db
      .selectFrom('survey_questions as q')
      .innerJoin('survey_sections as s', 'q.section_id', 's.id')
      .leftJoin('answers as a', 'q.id', 'a.question_id')
      .leftJoin('respondents as r', (join) =>
        join.onRef('a.respondent_id', '=', 'r.id').on('r.survey_id', '=', surveyId),
      )
      .select([
        'q.id as question_id',
        'q.text as question_text',
        'q.sort_order',
        's.sort_order as section_sort_order',
        sql<number>`COUNT(DISTINCT a.respondent_id)`.as('answer_count'),
      ])
      .where('q.survey_id', '=', surveyId)
      .groupBy('q.id')
      .orderBy('s.sort_order')
      .orderBy('q.sort_order')
      .execute();
    return results as Array<{
      question_id: string;
      question_text: string;
      sort_order: number;
      section_sort_order: number;
      answer_count: number;
    }>;
  }

  async searchTextAnswers(
    surveyId: string,
    query: string,
    questionId?: string,
  ): Promise<Array<{ respondent_id: string; question_id: string; question_text: string; answer: string }>> {
    const escaped = query.replace(/[%_]/g, (ch) => `\\${ch}`);
    const likeQuery = `%${escaped}%`;

    let qb = this.db
      .selectFrom('answers as a')
      .innerJoin('respondents as r', 'a.respondent_id', 'r.id')
      .innerJoin('survey_questions as q', 'a.question_id', 'q.id')
      .select(['a.respondent_id', 'a.question_id', 'q.text as question_text', 'a.answer'])
      .where('r.survey_id', '=', surveyId)
      .where(sql`a.answer LIKE ${likeQuery} ESCAPE '\\'`)
      .orderBy('a.answered_at', 'desc')
      .limit(SEARCH_RESULT_LIMIT);

    if (questionId) {
      qb = qb.where('a.question_id', '=', questionId);
    }

    return qb.execute();
  }

  async getAnswersForRespondent(respondentId: string): Promise<
    Array<{
      question_id: string;
      question_text: string;
      question_type: string;
      answer: string;
      other_text: string | null;
    }>
  > {
    return this.db
      .selectFrom('answers as a')
      .innerJoin('survey_questions as q', 'a.question_id', 'q.id')
      .select(['a.question_id', 'q.text as question_text', 'q.type as question_type', 'a.answer', 'a.other_text'])
      .where('a.respondent_id', '=', respondentId)
      .orderBy('q.sort_order')
      .execute();
  }
}
