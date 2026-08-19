/**
 * In-memory cache for the SurveyDO. Cleared whenever the DO hibernates or is
 * evicted, so every field must be rebuildable from SQLite on demand.
 * Reads bypass Kysely (direct SqlStorage) for speed.
 */

import type { SurveyRow, SectionRow, QuestionRow } from '../db';
import { ServiceError } from '../services/errors';

const CHOICE_TYPES = new Set(['radio', 'checkbox', 'dropdown', 'rating', 'nps', 'likert']);

export interface AnswerTally {
  value: string;
  otherText: string | null;
  count: number;
}

/**
 * Minimal per-respondent state held in memory during a session. Only choice
 * answers are cached (updateTalliesOnCompletion needs them; text answers are never
 * tallied), keeping per-user memory bounded by the choice-question count rather
 * than by how much text the user types.
 */
export interface RespondentState {
  isComplete: boolean;
  hasSubmitted: boolean;
  choiceAnswers: Map<string, { value: string; otherText: string | null }>;
}

export class SurveyCache {
  private _survey: SurveyRow | null = null;
  private _sections: SectionRow[] | null = null;
  private _questions: QuestionRow[] | null = null;
  private _counters: { total: number; completed: number } | null = null;
  private _tallies: Map<string, AnswerTally[]> | null = null;
  private _choiceQuestionIds: Set<string> | null = null;

  /**
   * Per-respondent state for active sessions. Populated on upgrade (new respondents
   * start empty) and lazily on resume (returning respondents load from SQL once).
   * Evicted on complete or hibernation. Avoids SQL hits for submit-answers and
   * updateTalliesOnCompletion since the choice answers are already in memory.
   */
  private _respondentState = new Map<string, RespondentState>();

  /**
  Debounce flag for scheduled broadcasts — shared between ws-handler and survey-do
  */
  readonly broadcastScheduled = { value: false };

  /**
  Fast-tier alarm tick counter, held in memory rather than DO storage (see SLOW_TICKS_PER_CYCLE).
  */
  fastTick = 0;

  constructor(private sql: SqlStorage) {}

  hasRespondent(id: string): boolean {
    if (this._respondentState.has(id)) {return true;}
    const row = this.sql.exec('SELECT 1 FROM respondents WHERE id = ? LIMIT 1', id).toArray()[0];
    return !!row;
  }

  initRespondent(id: string): void {
    this._respondentState.set(id, { isComplete: false, hasSubmitted: false, choiceAnswers: new Map() });
  }

  /**
  Callers needing text answers must query SQL — only choice answers are cached.
  */
  getCachedRespondent(id: string): RespondentState | undefined {
    return this._respondentState.get(id);
  }

  setAnswer(respondentId: string, questionId: string, value: string, otherText: string | null): void {
    const state = this._respondentState.get(respondentId);
    if (!state) {return;}
    state.hasSubmitted = true;
    if (this.choiceQuestionIds.has(questionId)) {
      state.choiceAnswers.set(questionId, { value, otherText });
    }
  }

  markRespondentComplete(id: string): void {
    const state = this._respondentState.get(id);
    if (state) {state.isComplete = true;}
  }

  removeRespondent(id: string): void {
    this._respondentState.delete(id);
  }

  get survey(): SurveyRow {
    if (this._survey) {return this._survey;}
    const rows = this.sql.exec('SELECT * FROM surveys LIMIT 1').toArray();
    if (rows.length === 0) {throw new ServiceError('Survey not found', 404);}
    this._survey = rows[0] as unknown as SurveyRow;
    return this._survey;
  }

  get sections(): SectionRow[] {
    if (this._sections) {return this._sections;}
    this._sections = this.sql
      .exec('SELECT * FROM survey_sections ORDER BY sort_order')
      .toArray() as unknown as SectionRow[];
    return this._sections;
  }

  get questions(): QuestionRow[] {
    if (this._questions) {return this._questions;}
    this._questions = this.sql
      .exec('SELECT * FROM survey_questions ORDER BY sort_order')
      .toArray() as unknown as QuestionRow[];
    return this._questions;
  }

  get choiceQuestionIds(): Set<string> {
    if (this._choiceQuestionIds) {return this._choiceQuestionIds;}
    this._choiceQuestionIds = new Set(this.questions.filter((q) => CHOICE_TYPES.has(q.type)).map((q) => q.id));
    return this._choiceQuestionIds;
  }

  get counters(): { total: number; completed: number } {
    if (this._counters) {return this._counters;}
    const row = this.sql
      .exec(`SELECT COUNT(*) as total, SUM(CASE WHEN is_complete = 1 THEN 1 ELSE 0 END) as completed FROM respondents`)
      .toArray()[0];
    this._counters = { total: Number(row?.total ?? 0), completed: Number(row?.completed ?? 0) };
    return this._counters;
  }

  get tallies(): Map<string, AnswerTally[]> {
    if (this._tallies) {return this._tallies;}
    const choiceIds = this.questions.filter((q) => CHOICE_TYPES.has(q.type)).map((q) => q.id);
    this._tallies = new Map();
    if (choiceIds.length === 0) {return this._tallies;}

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
      if (!this._tallies.has(qId)) {this._tallies.set(qId, []);}
      this._tallies.get(qId)!.push({
        value: row.answer as string,
        otherText: (row.other_text as string) || null,
        count: Number(row.count),
      });
    }
    return this._tallies;
  }

  get hasSurvey(): boolean {
    if (this._survey) {return true;}
    const rows = this.sql.exec('SELECT id FROM surveys LIMIT 1').toArray();
    return rows.length > 0;
  }

  invalidateSurvey(): void {
    this._survey = null;
    this._sections = null;
    this._questions = null;
    this._choiceQuestionIds = null;
  }

  invalidateResults(): void {
    this._counters = null;
    this._tallies = null;
    this._respondentState.clear();
  }

  incrementTotal(): void {
    if (this._counters) {this._counters.total++;}
  }

  incrementCompleted(): void {
    if (this._counters) {this._counters.completed++;}
  }

  /**
   * Folds the respondent's in-memory choice answers into the tallies. When that
   * state is missing (sendBeacon-only respondent, reconnect after hibernation, op
   * race) we drop _tallies so the next read rebuilds from SQL — otherwise
   * incrementCompleted keeps bumping the total while per-option tallies stay frozen
   * and the live charts silently drift.
   */
  updateTalliesOnCompletion(respondentId: string): void {
    if (!this._tallies) {return;}
    const state = this._respondentState.get(respondentId);
    if (!state) {
      this._tallies = null;
      return;
    }

    for (const [qId, ans] of state.choiceAnswers) {
      if (!this._tallies.has(qId)) {this._tallies.set(qId, []);}
      const qTallies = this._tallies.get(qId)!;
      const existing = qTallies.find((t) => t.value === ans.value && t.otherText === ans.otherText);
      if (existing) {
        existing.count++;
      } else {
        qTallies.push({
          value: ans.value,
          otherText: ans.otherText,
          count: 1,
        });
      }
    }
  }

  /**
   * Choice questions only, straight from the in-memory tallies (no SQL) for the
   * broadcast loop. Text-style questions are omitted — the frontend merges these
   * with the results from its initial HTTP load.
   */
  buildChoiceResults(): Array<{ questionId: string; answers: AnswerTally[] }> {
    const tallies = this.tallies;
    const results: Array<{ questionId: string; answers: AnswerTally[] }> = [];
    for (const q of this.questions) {
      if (CHOICE_TYPES.has(q.type)) {
        results.push({ questionId: q.id, answers: tallies.get(q.id) ?? [] });
      }
    }
    return results;
  }

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
