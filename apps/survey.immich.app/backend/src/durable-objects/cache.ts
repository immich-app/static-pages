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

/**
 * Minimal per-respondent state held in memory during a session.
 *
 * We DON'T cache all answers — that's what SQLite is for. We only cache:
 *   - isComplete: so we know the respondent's status
 *   - hasSubmitted: enables the resume fast path (new users skip SQL entirely)
 *   - choiceAnswers: only answers to choice questions (radio, dropdown, etc.)
 *     because updateTalliesOnCompletion needs them — text/textarea answers
 *     are never tallied, so they don't need to live in memory.
 *
 * This keeps the per-user memory cost small and bounded by the choice-question
 * count, independent of how much text the user types.
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

  /** Debounce flag for scheduled broadcasts — shared between ws-handler and survey-do */
  readonly broadcastScheduled = { value: false };

  /**
   * Fast-tier alarm tick counter. The slow-tier analytics broadcast fires
   * every Nth fast tick (see SLOW_TICKS_PER_CYCLE in ws-broadcaster). This
   * lives on the cache so it survives between alarm invocations without
   * needing to be stored in DO storage.
   */
  fastTick = 0;

  constructor(private sql: SqlStorage) {}

  /** Check if a respondent exists. Uses in-memory state first, falls back to a fast PK lookup. */
  hasRespondent(id: string): boolean {
    if (this._respondentState.has(id)) return true;
    const row = this.sql.exec('SELECT 1 FROM respondents WHERE id = ? LIMIT 1', id).toArray()[0];
    return !!row;
  }

  /** Add a brand-new respondent to the in-memory state. Called on WS upgrade for new users. */
  initRespondent(id: string): void {
    this._respondentState.set(id, { isComplete: false, hasSubmitted: false, choiceAnswers: new Map() });
  }

  /**
   * Get cached respondent state without touching SQL. Returns undefined if not cached.
   * Callers that need to know the full respondent state (including text answers) must
   * query SQL themselves — we only keep choice answers in memory.
   */
  getCachedRespondent(id: string): RespondentState | undefined {
    return this._respondentState.get(id);
  }

  /**
   * Record a submitted answer in memory. Only choice answers are kept (for later
   * tally updates); text/textarea/email/number answers are discarded from cache
   * since they're already persisted to SQL and not needed for in-memory ops.
   */
  setAnswer(respondentId: string, questionId: string, value: string, otherText: string | null): void {
    const state = this._respondentState.get(respondentId);
    if (!state) return;
    state.hasSubmitted = true;
    if (this.choiceQuestionIds.has(questionId)) {
      state.choiceAnswers.set(questionId, { value, otherText });
    }
  }

  /** Mark a respondent complete in memory. */
  markRespondentComplete(id: string): void {
    const state = this._respondentState.get(id);
    if (state) state.isComplete = true;
  }

  /** Evict a respondent's state from memory (called on complete to reclaim memory). */
  removeRespondent(id: string): void {
    this._respondentState.delete(id);
  }

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

  /** Pre-computed set of choice question IDs — used to filter which answers to cache */
  get choiceQuestionIds(): Set<string> {
    if (this._choiceQuestionIds) return this._choiceQuestionIds;
    this._choiceQuestionIds = new Set(this.questions.filter((q) => CHOICE_TYPES.has(q.type)).map((q) => q.id));
    return this._choiceQuestionIds;
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
    this._choiceQuestionIds = null;
  }

  invalidateResults(): void {
    this._counters = null;
    this._tallies = null;
    this._respondentState.clear();
  }

  incrementTotal(): void {
    if (this._counters) this._counters.total++;
  }

  incrementCompleted(): void {
    if (this._counters) this._counters.completed++;
  }

  /**
   * Update tallies incrementally when a respondent completes — uses in-memory
   * choice answers, no SQL query needed.
   *
   * If the respondent's choice answers aren't in memory (HTTP-only respondent
   * via sendBeacon, WS reconnect after DO hibernation, or an op race), we
   * have no in-memory state to fold in. Drop _tallies so the next read
   * rebuilds the full set from SQL — without this, `incrementCompleted`
   * would still bump the completion counter while per-option tallies stayed
   * frozen, causing live-results charts to silently drift.
   */
  updateTalliesOnCompletion(respondentId: string): void {
    if (!this._tallies) return;
    const state = this._respondentState.get(respondentId);
    if (!state) {
      this._tallies = null;
      return;
    }

    for (const [qId, ans] of state.choiceAnswers) {
      if (!this._tallies.has(qId)) this._tallies.set(qId, []);
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
   * Build results for CHOICE questions only, entirely from the in-memory tallies
   * Map. No SQL queries — used by the 5-second broadcast loop so periodic pushes
   * stay fully in-memory. Text/textarea/email/number questions are omitted; the
   * frontend merges these with the existing results from the initial HTTP load.
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
