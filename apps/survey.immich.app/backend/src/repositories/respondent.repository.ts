import { ACTIVE_RESPONDENT_WINDOW_MS, SEARCH_RESULT_LIMIT } from '../constants';

export interface RespondentRow {
  id: string;
  survey_id: string;
  ip_address: string | null;
  is_complete: number;
  created_at: string;
  completed_at: string | null;
}

export interface AnswerRow {
  respondent_id: string;
  question_id: string;
  answer: string;
  other_text: string | null;
  answered_at: string;
}

export class RespondentRepository {
  constructor(private db: D1Database) {}

  async getById(id: string): Promise<RespondentRow | null> {
    return this.db.prepare('SELECT * FROM respondents WHERE id = ?').bind(id).first<RespondentRow>();
  }

  async create(respondent: RespondentRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO respondents (id, survey_id, ip_address, is_complete, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        respondent.id,
        respondent.survey_id,
        respondent.ip_address,
        respondent.is_complete,
        respondent.created_at,
        respondent.completed_at,
      )
      .run();
  }

  async markComplete(id: string): Promise<void> {
    await this.db
      .prepare('UPDATE respondents SET is_complete = 1, completed_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), id)
      .run();
  }

  async getAllCompletedBySurveyId(surveyId: string): Promise<Array<{ id: string; completed_at: string | null }>> {
    const result = await this.db
      .prepare('SELECT id, completed_at FROM respondents WHERE survey_id = ? AND is_complete = 1 ORDER BY completed_at')
      .bind(surveyId)
      .all<{ id: string; completed_at: string | null }>();
    return result.results;
  }

  async countBySurveyId(surveyId: string): Promise<{ total: number; completed: number }> {
    const row = await this.db
      .prepare(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN is_complete = 1 THEN 1 ELSE 0 END) as completed
         FROM respondents WHERE survey_id = ?`,
      )
      .bind(surveyId)
      .first<{ total: number; completed: number }>();
    return { total: row?.total ?? 0, completed: row?.completed ?? 0 };
  }

  async countActiveBySurveyId(surveyId: string): Promise<number> {
    const fiveMinAgo = new Date(Date.now() - ACTIVE_RESPONDENT_WINDOW_MS).toISOString();
    const row = await this.db
      .prepare('SELECT COUNT(*) as count FROM respondents WHERE survey_id = ? AND is_complete = 0 AND created_at > ?')
      .bind(surveyId, fiveMinAgo)
      .first<{ count: number }>();
    return row?.count ?? 0;
  }

  async getTimelineData(surveyId: string, granularity: 'day' | 'hour'): Promise<Array<{ period: string; started: number; completed: number }>> {
    const dateExpr = granularity === 'day'
      ? "substr(created_at, 1, 10)"
      : "substr(created_at, 1, 13)";
    const completedExpr = granularity === 'day'
      ? "substr(completed_at, 1, 10)"
      : "substr(completed_at, 1, 13)";

    // Get started counts
    const startedResult = await this.db
      .prepare(`SELECT ${dateExpr} as period, COUNT(*) as count FROM respondents WHERE survey_id = ? GROUP BY period ORDER BY period`)
      .bind(surveyId)
      .all<{ period: string; count: number }>();

    // Get completed counts
    const completedResult = await this.db
      .prepare(`SELECT ${completedExpr} as period, COUNT(*) as count FROM respondents WHERE survey_id = ? AND is_complete = 1 AND completed_at IS NOT NULL GROUP BY period ORDER BY period`)
      .bind(surveyId)
      .all<{ period: string; count: number }>();

    const completedMap = new Map<string, number>(completedResult.results.map((r) => [r.period, r.count]));
    return startedResult.results.map((r) => ({
      period: r.period,
      started: r.count,
      completed: completedMap.get(r.period) ?? 0,
    }));
  }

  async listBySurveyId(surveyId: string, offset: number, limit: number): Promise<{ respondents: Array<{ id: string; created_at: string; completed_at: string | null; is_complete: number; answer_count: number }>; total: number }> {
    const countResult = await this.db
      .prepare('SELECT COUNT(*) as total FROM respondents WHERE survey_id = ?')
      .bind(surveyId)
      .first<{ total: number }>();

    const result = await this.db
      .prepare(`SELECT r.id, r.created_at, r.completed_at, r.is_complete, (SELECT COUNT(*) FROM answers a WHERE a.respondent_id = r.id) as answer_count FROM respondents r WHERE r.survey_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`)
      .bind(surveyId, limit, offset)
      .all<{ id: string; created_at: string; completed_at: string | null; is_complete: number; answer_count: number }>();

    return { respondents: result.results, total: countResult?.total ?? 0 };
  }
}

export class AnswerRepository {
  constructor(private db: D1Database) {}

  async getByRespondentId(respondentId: string): Promise<AnswerRow[]> {
    const result = await this.db
      .prepare('SELECT * FROM answers WHERE respondent_id = ?')
      .bind(respondentId)
      .all<AnswerRow>();
    return result.results;
  }

  async upsertBatch(answers: AnswerRow[]): Promise<void> {
    const statements = answers.map((a) =>
      this.db
        .prepare(
          `INSERT INTO answers (respondent_id, question_id, answer, other_text, answered_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (respondent_id, question_id)
           DO UPDATE SET answer = excluded.answer, other_text = excluded.other_text, answered_at = excluded.answered_at`,
        )
        .bind(a.respondent_id, a.question_id, a.answer, a.other_text, a.answered_at),
    );
    await this.db.batch(statements);
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
    const result = await this.db
      .prepare(
        `SELECT a.respondent_id, r.completed_at, a.question_id, a.answer, a.other_text
         FROM answers a
         JOIN respondents r ON a.respondent_id = r.id
         WHERE r.survey_id = ? AND r.is_complete = 1
         ORDER BY r.completed_at, a.respondent_id, a.question_id`,
      )
      .bind(surveyId)
      .all<{
        respondent_id: string;
        completed_at: string | null;
        question_id: string;
        answer: string;
        other_text: string | null;
      }>();
    return result.results;
  }

  async getAggregatedResults(
    surveyId: string,
  ): Promise<Array<{ question_id: string; answer: string; other_text: string | null; count: number }>> {
    const result = await this.db
      .prepare(
        `SELECT a.question_id, a.answer, a.other_text, COUNT(*) as count
         FROM answers a
         JOIN respondents r ON a.respondent_id = r.id
         WHERE r.survey_id = ? AND r.is_complete = 1
         GROUP BY a.question_id, a.answer, a.other_text
         ORDER BY a.question_id, count DESC`,
      )
      .bind(surveyId)
      .all<{ question_id: string; answer: string; other_text: string | null; count: number }>();
    return result.results;
  }

  async getDropoffData(surveyId: string): Promise<Array<{ question_id: string; question_text: string; sort_order: number; section_sort_order: number; answer_count: number }>> {
    const result = await this.db
      .prepare(`
        SELECT q.id as question_id, q.text as question_text, q.sort_order, s.sort_order as section_sort_order,
          COUNT(DISTINCT a.respondent_id) as answer_count
        FROM survey_questions q
        JOIN survey_sections s ON q.section_id = s.id
        LEFT JOIN answers a ON q.id = a.question_id
        LEFT JOIN respondents r ON a.respondent_id = r.id AND r.survey_id = ?
        WHERE q.survey_id = ?
        GROUP BY q.id
        ORDER BY s.sort_order, q.sort_order
      `)
      .bind(surveyId, surveyId)
      .all<{ question_id: string; question_text: string; sort_order: number; section_sort_order: number; answer_count: number }>();
    return result.results;
  }

  async searchTextAnswers(surveyId: string, query: string, questionId?: string): Promise<Array<{ respondent_id: string; question_id: string; question_text: string; answer: string }>> {
    const likeQuery = `%${query}%`;
    if (questionId) {
      const result = await this.db
        .prepare(`
          SELECT a.respondent_id, a.question_id, q.text as question_text, a.answer
          FROM answers a
          JOIN respondents r ON a.respondent_id = r.id
          JOIN survey_questions q ON a.question_id = q.id
          WHERE r.survey_id = ? AND a.question_id = ? AND a.answer LIKE ?
          ORDER BY a.answered_at DESC
          LIMIT ?
        `)
        .bind(surveyId, questionId, likeQuery, SEARCH_RESULT_LIMIT)
        .all<{ respondent_id: string; question_id: string; question_text: string; answer: string }>();
      return result.results;
    }
    const result = await this.db
      .prepare(`
        SELECT a.respondent_id, a.question_id, q.text as question_text, a.answer
        FROM answers a
        JOIN respondents r ON a.respondent_id = r.id
        JOIN survey_questions q ON a.question_id = q.id
        WHERE r.survey_id = ? AND a.answer LIKE ?
        ORDER BY a.answered_at DESC
        LIMIT ?
      `)
      .bind(surveyId, likeQuery, SEARCH_RESULT_LIMIT)
      .all<{ respondent_id: string; question_id: string; question_text: string; answer: string }>();
    return result.results;
  }

  async getAnswersForRespondent(respondentId: string): Promise<Array<{ question_id: string; question_text: string; question_type: string; answer: string; other_text: string | null }>> {
    const result = await this.db
      .prepare(`
        SELECT a.question_id, q.text as question_text, q.type as question_type, a.answer, a.other_text
        FROM answers a
        JOIN survey_questions q ON a.question_id = q.id
        WHERE a.respondent_id = ?
        ORDER BY q.sort_order
      `)
      .bind(respondentId)
      .all<{ question_id: string; question_text: string; question_type: string; answer: string; other_text: string | null }>();
    return result.results;
  }
}
