import { sql, type Kysely, type SqlBool } from 'kysely';
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

  /**
   * Mark a respondent complete, but only if they aren't already complete.
   * Returns true on the actual 0→1 transition so callers can keep counters
   * and tallies in sync; returns false when the call was a no-op (duplicate
   * complete from a flaky client retry, or malicious replay).
   */
  async markComplete(id: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .updateTable('respondents')
      .set({ is_complete: 1, completed_at: now })
      .where('id', '=', id)
      .where('is_complete', '=', 0)
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0) > 0;
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
    granularity: 'minute' | 'hour' | 'day',
  ): Promise<Array<{ period: string; started: number; completed: number }>> {
    const sliceLen = granularity === 'day' ? 10 : granularity === 'hour' ? 13 : 16;
    const dateExpr = sql`substr(created_at, 1, ${sql.lit(sliceLen)})`;
    const completedExpr = sql`substr(completed_at, 1, ${sql.lit(sliceLen)})`;

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

  /**
   * Returns per-question answer durations (ms) grouped by question. Only
   * includes non-null answer_ms values. Used for the per-question timing
   * analytics — caller aggregates medians/means in JS.
   */
  async getAnswerDurationsByQuestion(
    surveyId: string,
  ): Promise<Array<{ question_id: string; question_text: string; question_sort: number; answer_ms: number }>> {
    const rows = await this.db
      .selectFrom('answers as a')
      .innerJoin('respondents as r', 'a.respondent_id', 'r.id')
      .innerJoin('survey_questions as q', 'a.question_id', 'q.id')
      .where('r.survey_id', '=', surveyId)
      .where('a.answer_ms', 'is not', null)
      .select([
        'a.question_id as question_id',
        'q.text as question_text',
        'q.sort_order as question_sort',
        'a.answer_ms as answer_ms',
      ])
      .execute();
    return rows.map((r) => ({
      question_id: String(r.question_id),
      question_text: String(r.question_text),
      question_sort: Number(r.question_sort),
      answer_ms: Number(r.answer_ms),
    }));
  }

  async getCompletionDurationsSeconds(surveyId: string): Promise<number[]> {
    const rows = await this.db
      .selectFrom('respondents')
      .select([sql<number>`CAST((julianday(completed_at) - julianday(created_at)) * 86400 AS INTEGER)`.as('duration')])
      .where('survey_id', '=', surveyId)
      .where('is_complete', '=', 1)
      .where('completed_at', 'is not', null)
      .execute();
    return rows.map((r) => Number(r.duration)).filter((d) => d >= 0 && Number.isFinite(d));
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
      answer_ms: number | null;
    }>,
  ): Promise<void> {
    if (answers.length === 0) return;

    // Single multi-row INSERT ... ON CONFLICT — one round-trip regardless of
    // batch size. The WS path in ws-handler submits the same way; keeping the
    // HTTP fallback equally fast matters because self-hosted respondents also
    // submit whole-page batches that would otherwise do N round-trips.
    const values = sql.join(
      answers.map(
        (a) =>
          sql`(${a.respondent_id}, ${a.question_id}, ${a.answer}, ${a.other_text}, ${a.answered_at}, ${a.answer_ms})`,
      ),
    );
    await sql`INSERT INTO answers (respondent_id, question_id, answer, other_text, answered_at, answer_ms)
      VALUES ${values}
      ON CONFLICT (respondent_id, question_id)
      DO UPDATE SET answer = excluded.answer, other_text = excluded.other_text, answered_at = excluded.answered_at, answer_ms = excluded.answer_ms`.execute(
      this.db,
    );
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
      reached_count: number;
    }>
  > {
    // For a true funnel, "reached" must be the count of respondents who
    // submitted an answer to ANY question at this position or later — that's
    // the only definition that produces a strictly non-increasing series.
    // Conditional skip-logic and optional questions mean per-question
    // answer counts are not monotonic: Q4 can have more answers than Q3 if
    // Q3 was conditional. The correlated subquery computes that tail
    // distinct-count from the SQL side; runs once per minute via the DO
    // analytics broadcast.
    const results = await sql<{
      question_id: string;
      question_text: string;
      sort_order: number;
      section_sort_order: number;
      answer_count: number;
      reached_count: number;
    }>`
      SELECT
        q.id AS question_id,
        q.text AS question_text,
        q.sort_order,
        s.sort_order AS section_sort_order,
        COUNT(DISTINCT a.respondent_id) AS answer_count,
        (
          SELECT COUNT(DISTINCT a2.respondent_id)
          FROM answers a2
          INNER JOIN survey_questions q2 ON a2.question_id = q2.id
          INNER JOIN survey_sections s2 ON q2.section_id = s2.id
          INNER JOIN respondents r2 ON a2.respondent_id = r2.id
          WHERE r2.survey_id = ${surveyId}
            AND (
              s2.sort_order > s.sort_order
              OR (s2.sort_order = s.sort_order AND q2.sort_order >= q.sort_order)
            )
        ) AS reached_count
      FROM survey_questions q
      INNER JOIN survey_sections s ON q.section_id = s.id
      LEFT JOIN answers a ON q.id = a.question_id
      LEFT JOIN respondents r ON a.respondent_id = r.id AND r.survey_id = ${surveyId}
      WHERE q.survey_id = ${surveyId}
      GROUP BY q.id, q.text, q.sort_order, s.sort_order
      ORDER BY s.sort_order, q.sort_order
    `.execute(this.db);
    return results.rows.map((r) => ({
      ...r,
      sort_order: Number(r.sort_order),
      section_sort_order: Number(r.section_sort_order),
      answer_count: Number(r.answer_count),
      reached_count: Number(r.reached_count),
    }));
  }

  async searchTextAnswers(
    surveyId: string,
    query: string,
    questionId?: string,
    offset = 0,
    limit = SEARCH_RESULT_LIMIT,
  ): Promise<{
    results: Array<{ respondent_id: string; question_id: string; question_text: string; answer: string }>;
    total: number;
  }> {
    const escaped = query.replace(/[%_]/g, (ch) => `\\${ch}`);
    const likeQuery = `%${escaped}%`;

    let baseQb = this.db
      .selectFrom('answers as a')
      .innerJoin('respondents as r', 'a.respondent_id', 'r.id')
      .innerJoin('survey_questions as q', 'a.question_id', 'q.id')
      .where('r.survey_id', '=', surveyId)
      .where(sql<SqlBool>`a.answer LIKE ${likeQuery} ESCAPE '\\'`);

    if (questionId) {
      baseQb = baseQb.where('a.question_id', '=', questionId);
    }

    const countResult = await baseQb.select(({ fn }) => [fn.count('a.respondent_id').as('total')]).executeTakeFirst();

    const results = await baseQb
      .select(['a.respondent_id', 'a.question_id', 'q.text as question_text', 'a.answer'])
      .orderBy('a.answered_at', 'desc')
      .limit(Math.min(limit, SEARCH_RESULT_LIMIT))
      .offset(offset)
      .execute();

    return {
      results,
      total: Number(countResult?.total ?? 0),
    };
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
