/**
 * In-memory cache for the SurveyDO.
 *
 * Holds lazy-loaded survey definition, response counters, and choice tallies.
 * Cleared on hibernation, reloaded on demand from SQLite.
 * Bypasses Kysely for reads (direct ctx.storage.sql for perf).
 */

import type { SurveyRow, SectionRow, QuestionRow } from '../db';

const CHOICE_TYPES = new Set(['radio', 'checkbox', 'dropdown', 'rating', 'nps', 'likert']);

export interface AnswerTally {
  value: string;
  otherText: string | null;
  count: number;
}

export class SurveyCache {
  private _survey: SurveyRow | null = null;
  private _sections: SectionRow[] | null = null;
  private _questions: QuestionRow[] | null = null;
  private _counters: { total: number; completed: number } | null = null;
  private _tallies: Map<string, AnswerTally[]> | null = null;

  constructor(private sql: SqlStorage) {}

  get survey(): SurveyRow {
    if (this._survey) return this._survey;
    const rows = this.sql.exec('SELECT * FROM surveys LIMIT 1').toArray();
    if (rows.length === 0) throw new Error('Survey not initialized');
    this._survey = rows[0] as unknown as SurveyRow;
    return this._survey;
  }

  get sections(): SectionRow[] {
    if (this._sections) return this._sections;
    this._sections = this.sql
      .exec('SELECT * FROM survey_sections ORDER BY sort_order')
      .toArray() as unknown as SectionRow[];
    return this._sections;
  }

  get questions(): QuestionRow[] {
    if (this._questions) return this._questions;
    this._questions = this.sql
      .exec('SELECT * FROM survey_questions ORDER BY sort_order')
      .toArray() as unknown as QuestionRow[];
    return this._questions;
  }

  get counters(): { total: number; completed: number } {
    if (this._counters) return this._counters;
    const row = this.sql
      .exec(`SELECT COUNT(*) as total, SUM(CASE WHEN is_complete = 1 THEN 1 ELSE 0 END) as completed FROM respondents`)
      .toArray()[0];
    this._counters = { total: Number(row?.total ?? 0), completed: Number(row?.completed ?? 0) };
    return this._counters;
  }

  get tallies(): Map<string, AnswerTally[]> {
    if (this._tallies) return this._tallies;
    const choiceIds = this.questions.filter((q) => CHOICE_TYPES.has(q.type)).map((q) => q.id);
    this._tallies = new Map();
    if (choiceIds.length === 0) return this._tallies;

    const placeholders = choiceIds.map(() => '?').join(',');
    const rows = this.sql
      .exec(
        `SELECT a.question_id, a.answer, a.other_text, COUNT(*) as count
         FROM answers a JOIN respondents r ON a.respondent_id = r.id
         WHERE r.is_complete = 1 AND a.question_id IN (${placeholders})
         GROUP BY a.question_id, a.answer, a.other_text`,
        ...choiceIds,
      )
      .toArray();

    for (const row of rows) {
      const qId = row.question_id as string;
      if (!this._tallies.has(qId)) this._tallies.set(qId, []);
      this._tallies.get(qId)!.push({
        value: row.answer as string,
        otherText: (row.other_text as string) || null,
        count: Number(row.count),
      });
    }
    return this._tallies;
  }

  /** Check if the survey has been loaded (without triggering a load) */
  get hasSurvey(): boolean {
    if (this._survey) return true;
    const rows = this.sql.exec('SELECT id FROM surveys LIMIT 1').toArray();
    return rows.length > 0;
  }

  invalidateSurvey(): void {
    this._survey = null;
    this._sections = null;
    this._questions = null;
  }

  invalidateResults(): void {
    this._counters = null;
    this._tallies = null;
  }

  incrementTotal(): void {
    if (this._counters) this._counters.total++;
  }

  incrementCompleted(): void {
    if (this._counters) this._counters.completed++;
  }

  /** Update tallies incrementally when a respondent completes */
  updateTalliesOnCompletion(respondentId: string): void {
    if (!this._tallies) return;
    const choiceIds = new Set(this.questions.filter((q) => CHOICE_TYPES.has(q.type)).map((q) => q.id));
    if (choiceIds.size === 0) return;

    const answers = this.sql
      .exec('SELECT question_id, answer, other_text FROM answers WHERE respondent_id = ?', respondentId)
      .toArray();

    for (const a of answers) {
      const qId = a.question_id as string;
      if (!choiceIds.has(qId)) continue;
      if (!this._tallies.has(qId)) this._tallies.set(qId, []);
      const qTallies = this._tallies.get(qId)!;
      const existing = qTallies.find(
        (t) => t.value === (a.answer as string) && t.otherText === ((a.other_text as string) || null),
      );
      if (existing) {
        existing.count++;
      } else {
        qTallies.push({
          value: a.answer as string,
          otherText: (a.other_text as string) || null,
          count: 1,
        });
      }
    }
  }

  /** Build aggregated results from cache (choice questions) + SQLite (text questions) */
  buildAggregatedResults(): Array<{ questionId: string; answers: AnswerTally[] }> {
    const tallies = this.tallies;
    const results: Array<{ questionId: string; answers: AnswerTally[] }> = [];

    for (const q of this.questions) {
      if (CHOICE_TYPES.has(q.type)) {
        results.push({ questionId: q.id, answers: tallies.get(q.id) ?? [] });
      } else {
        const rows = this.sql
          .exec(
            `SELECT a.answer, a.other_text, COUNT(*) as count
             FROM answers a JOIN respondents r ON a.respondent_id = r.id
             WHERE r.is_complete = 1 AND a.question_id = ?
             GROUP BY a.answer, a.other_text ORDER BY count DESC`,
            q.id,
          )
          .toArray();
        results.push({
          questionId: q.id,
          answers: rows.map((r) => ({
            value: r.answer as string,
            otherText: (r.other_text as string) || null,
            count: Number(r.count),
          })),
        });
      }
    }
    return results;
  }
}
