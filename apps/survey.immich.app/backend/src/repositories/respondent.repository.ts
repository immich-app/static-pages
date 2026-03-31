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
}
