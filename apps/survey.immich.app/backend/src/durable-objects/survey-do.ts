/**
 * SurveyDO — Per-survey Durable Object with SQLite storage.
 *
 * Thin orchestrator that delegates to:
 * - Existing SurveyService / RespondentService (via Kysely adapter)
 * - SurveyCache (in-memory hot data)
 * - WsHandler (typed WebSocket dispatch)
 * - WsBroadcaster (alarm-based viewer updates)
 */

import { DurableObject } from 'cloudflare:workers';
import { Kysely } from 'kysely';
import { CloudflareDODialect } from './do-sqlite-dialect';
import { ensureSchema } from './schema';
import { SurveyCache } from './cache';
import { createSurveyService, createRespondentService } from '../services/factory';
import type { SurveyService } from '../services/survey.service';
import type { RespondentService } from '../services/respondent.service';
import { ServiceError } from '../services/errors';
import { dispatch as wsDispatch } from './ws/ws-handler';
import { broadcastToViewers, scheduleBroadcast, getPresenceCounts } from './ws/ws-broadcaster';
import { execute, type CommandContext } from './do-commands';
import type { Database, SurveyRow, SectionRow, QuestionRow } from '../db';

export class SurveyDO extends DurableObject {
  private cache: SurveyCache;
  private db: Kysely<Database>;
  private surveyService: SurveyService;
  private respondentService: RespondentService;

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    ensureSchema(ctx.storage.sql);
    this.cache = new SurveyCache(ctx.storage.sql);
    this.db = new Kysely<Database>({ dialect: new CloudflareDODialect({ storage: ctx.storage.sql }) });
    this.surveyService = createSurveyService(this.db);
    this.respondentService = createRespondentService(this.db);
  }

  // ============================================================
  // Fetch handler
  // ============================================================

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(url, request);
    }

    // HTTP routes (only for operations that stay HTTP)
    try {
      return await this.handleHttp(request, url);
    } catch (e) {
      if (e instanceof ServiceError) {
        return Response.json({ error: e.message }, { status: e.status });
      }
      console.error('SurveyDO error:', e);
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  // ============================================================
  // WebSocket lifecycle
  // ============================================================

  private handleWebSocketUpgrade(url: URL, request: Request): Response {
    const type = url.searchParams.get('type');
    if (type !== 'viewer' && type !== 'respondent' && type !== 'editor') {
      return new Response('type must be viewer, respondent, or editor', { status: 400 });
    }

    // Use the verified role from the API worker (set after authentication)
    const verifiedRole = request.headers.get('X-WS-Role') ?? 'public';

    let respondentId: string | null = null;
    let setCookieHeader: string | null = null;

    // For respondent connections: all validation uses the in-memory cache (zero DB lookups
    // for survey state), and we create/verify the respondent record here on the upgrade.
    if (type === 'respondent') {
      const survey = this.cache.survey;

      // Survey state checks — all in-memory via cache
      if (survey.status !== 'published') {
        return new Response('Survey not found', { status: 404 });
      }
      if (survey.closes_at && new Date(survey.closes_at) < new Date()) {
        return new Response('This survey has closed', { status: 403 });
      }
      if (survey.max_responses && this.cache.counters.completed >= survey.max_responses) {
        return new Response('This survey has reached its maximum number of responses', { status: 403 });
      }

      // Existing respondent from cookie (forwarded via X-Respondent-Id by the API worker)
      // Existence check is O(1) in memory via the cache's Set<respondentId>
      const existingId = request.headers.get('X-Respondent-Id');
      if (existingId && this.cache.hasRespondent(existingId)) {
        respondentId = existingId;
      } else {
        // Create a new respondent row — single SQL INSERT, no validation queries
        respondentId = crypto.randomUUID();
        const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown';
        this.ctx.storage.sql.exec(
          `INSERT INTO respondents (id, survey_id, ip_address, is_complete, created_at, completed_at)
           VALUES (?, ?, ?, 0, ?, NULL)`,
          respondentId,
          survey.id,
          ip,
          new Date().toISOString(),
        );
        // Initialize empty in-memory state — zero SQL queries needed for
        // subsequent resume/submit/complete operations for this new respondent
        this.cache.initRespondent(respondentId);
        this.cache.incrementTotal();

        // Set cookie on the WS upgrade response — this is what enables the HTTP
        // sendBeacon fallback on page unload to identify the respondent
        if (survey.slug) {
          const secure = request.url.startsWith('https://') ? 'Secure; ' : '';
          setCookieHeader = `rid_${survey.slug}=${respondentId}; Path=/; HttpOnly; ${secure}SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}`;
        }
      }
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Tag with presence type, verified auth role, and respondent ID (if present)
    const tags: string[] = [type, `role:${verifiedRole}`];
    if (respondentId) tags.push(`rid:${respondentId}`);
    this.ctx.acceptWebSocket(server, tags);

    // Send initial counts
    const counts = getPresenceCounts(this.ctx);
    server.send(JSON.stringify(counts));
    scheduleBroadcast(this.ctx, this.cache.broadcastScheduled);

    const headers = new Headers();
    if (setCookieHeader) headers.set('Set-Cookie', setCookieHeader);

    return new Response(null, { status: 101, webSocket: client, headers });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    const services = {
      survey: this.surveyService,
      respondent: this.respondentService,
    };
    await wsDispatch(ws, message, services, this.cache, this.ctx);
  }

  webSocketClose(): void {
    scheduleBroadcast(this.ctx, this.cache.broadcastScheduled);
  }

  webSocketError(ws: WebSocket): void {
    ws.close(1011, 'WebSocket error');
    scheduleBroadcast(this.ctx, this.cache.broadcastScheduled);
  }

  async alarm(): Promise<void> {
    this.cache.broadcastScheduled.value = false;
    broadcastToViewers(this.ctx, this.cache);
  }

  // ============================================================
  // HTTP routes (operations that stay HTTP)
  // ============================================================

  private async handleHttp(request: Request, url: URL): Promise<Response> {
    const path = this.internalPath(url.pathname);
    const method = request.method;

    // Init (called by API worker on survey creation)
    if (method === 'POST' && path === '/init') return this.handleInit(request);

    // Survey CRUD (stays HTTP for D1 catalog sync)
    if ((path === '/' || path === '') && method === 'GET') return this.handleGetSurvey();
    if ((path === '/' || path === '') && method === 'PUT') return this.handleUpdateSurvey(request);
    if ((path === '/' || path === '') && method === 'DELETE') return this.handleDeleteSurvey();
    if (method === 'PUT' && path === '/publish') return this.handlePublish();
    if (method === 'PUT' && path === '/unpublish') return this.handleUnpublish();
    if (method === 'PUT' && path === '/archive') return this.handleArchive();
    if (method === 'PUT' && path === '/unarchive') return this.handleUnarchive();
    if (method === 'POST' && path === '/duplicate') return this.handleDuplicate();

    // Results export (binary download, stays HTTP)
    if (method === 'GET' && path === '/results/export') return this.handleExportResults(url);

    // Public respondent (cookie-setting endpoints stay HTTP)
    if (method === 'GET' && path === '/public') return this.handleGetPublicSurvey(request);
    if (method === 'GET' && path === '/public/resume') return this.handleResume(request);
    if (method === 'POST' && path === '/public/answers/batch') return this.handleSubmitAnswers(request);
    if (method === 'POST' && path === '/public/complete') return this.handleComplete(request);

    // Section/question CRUD + results via HTTP (self-hosted fallback)
    return this.handleSelfHostedFallback(method, path, request, url);
  }

  // ---- Init ----

  private async handleInit(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      survey: SurveyRow;
      sections?: SectionRow[];
      questions?: QuestionRow[];
    };

    const s = body.survey;
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO surveys (id, title, description, slug, status, welcome_title,
        welcome_description, thank_you_title, thank_you_description, closes_at, max_responses,
        randomize_questions, randomize_options, password_hash, archived_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      s.id,
      s.title,
      s.description,
      s.slug,
      s.status,
      s.welcome_title,
      s.welcome_description,
      s.thank_you_title,
      s.thank_you_description,
      s.closes_at,
      s.max_responses,
      s.randomize_questions,
      s.randomize_options,
      s.password_hash,
      s.archived_at,
      s.created_at,
      s.updated_at,
    );

    for (const sec of body.sections ?? []) {
      this.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO survey_sections (id, survey_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)`,
        sec.id,
        sec.survey_id,
        sec.title,
        sec.description,
        sec.sort_order,
      );
    }

    for (const q of body.questions ?? []) {
      this.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO survey_questions (id, survey_id, section_id, text, description, type, options,
          required, has_other, other_prompt, max_length, placeholder, sort_order, conditional, config)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        q.id,
        q.survey_id,
        q.section_id,
        q.text,
        q.description,
        q.type,
        q.options,
        q.required,
        q.has_other,
        q.other_prompt,
        q.max_length,
        q.placeholder,
        q.sort_order,
        q.conditional,
        q.config,
      );
    }

    this.cache.invalidateSurvey();
    return new Response(null, { status: 204 });
  }

  // ---- Survey CRUD (HTTP for catalog sync) ----

  private handleGetSurvey(): Response {
    return Response.json({
      survey: this.cache.survey,
      sections: this.cache.sections,
      questions: this.cache.questions,
    });
  }

  private async handleUpdateSurvey(request: Request): Promise<Response> {
    const input = await request.json();
    const result = await this.surveyService.updateSurvey(this.cache.survey.id, input, this.cache.survey);
    this.cache.invalidateSurvey();
    return Response.json(result, { headers: this.catalogSyncHeaders() });
  }

  private handleDeleteSurvey(): Response {
    this.ctx.storage.sql.exec('DELETE FROM answers');
    this.ctx.storage.sql.exec('DELETE FROM respondents');
    this.ctx.storage.sql.exec('DELETE FROM survey_questions');
    this.ctx.storage.sql.exec('DELETE FROM survey_sections');
    this.ctx.storage.sql.exec('DELETE FROM surveys');
    this.cache.invalidateSurvey();
    this.cache.invalidateResults();
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.close(1000, 'Survey deleted');
      } catch {
        /* ignore */
      }
    }
    return new Response(null, { status: 204 });
  }

  private async handlePublish(): Promise<Response> {
    const details = { survey: this.cache.survey, sections: this.cache.sections, questions: this.cache.questions };
    const result = await this.surveyService.publishSurvey(this.cache.survey.id, details);
    this.cache.invalidateSurvey();
    return Response.json(result, { headers: this.catalogSyncHeaders() });
  }

  private async handleUnpublish(): Promise<Response> {
    const result = await this.surveyService.unpublishSurvey(this.cache.survey.id, this.cache.survey);
    this.cache.invalidateSurvey();
    return Response.json(result, { headers: this.catalogSyncHeaders() });
  }

  private async handleArchive(): Promise<Response> {
    const result = await this.surveyService.archiveSurvey(this.cache.survey.id, this.cache.survey);
    this.cache.invalidateSurvey();
    return Response.json(result, { headers: this.catalogSyncHeaders() });
  }

  private async handleUnarchive(): Promise<Response> {
    const result = await this.surveyService.unarchiveSurvey(this.cache.survey.id, this.cache.survey);
    this.cache.invalidateSurvey();
    return Response.json(result, { headers: this.catalogSyncHeaders() });
  }

  private handleDuplicate(): Response {
    const survey = this.cache.survey;
    const sections = this.cache.sections;
    const questions = this.cache.questions;
    const now = new Date().toISOString();

    const newSurvey: SurveyRow = {
      ...survey,
      id: crypto.randomUUID(),
      title: `${survey.title} (Copy)`,
      slug: null,
      status: 'draft',
      password_hash: null,
      archived_at: null,
      created_at: now,
      updated_at: now,
    };

    const sectionIdMap = new Map<string, string>();
    const newSections = sections.map((s) => {
      const newId = crypto.randomUUID();
      sectionIdMap.set(s.id, newId);
      return { ...s, id: newId, survey_id: newSurvey.id };
    });

    const newQuestions = questions.map((q) => ({
      ...q,
      id: crypto.randomUUID(),
      survey_id: newSurvey.id,
      section_id: sectionIdMap.get(q.section_id) ?? q.section_id,
    }));

    return Response.json({ survey: newSurvey, sections: newSections, questions: newQuestions }, { status: 201 });
  }

  // ---- Results export (HTTP for binary download) ----

  private async handleExportResults(url: URL): Promise<Response> {
    const format = url.searchParams.get('format');
    if (format !== 'csv' && format !== 'json') {
      return Response.json({ error: 'format must be csv or json' }, { status: 400 });
    }
    const result = await this.respondentService.exportResponses(this.cache.survey.id, format);
    return new Response(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  }

  // ---- Public respondent (HTTP for cookies) ----

  private handleGetPublicSurvey(request: Request): Response {
    const survey = this.cache.survey;
    if (survey.status !== 'published') {
      return Response.json({ error: 'Survey not found' }, { status: 404 });
    }
    const isAuthenticated = request.headers.get('X-Authenticated') === 'true';
    if (survey.password_hash && !isAuthenticated) {
      return Response.json({
        survey: {
          id: survey.id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          status: survey.status,
          welcome_title: survey.welcome_title,
          welcome_description: survey.welcome_description,
        },
        sections: [],
        questions: [],
        requiresPassword: true,
      });
    }
    const { password_hash: _, ...safeSurvey } = survey;
    return Response.json({ survey: safeSurvey, sections: this.cache.sections, questions: this.cache.questions });
  }

  private async handleResume(request: Request): Promise<Response> {
    const survey = this.cache.survey;
    if (survey.status !== 'published') {
      return Response.json({ error: 'Survey not found' }, { status: 404 });
    }
    const respondentId = request.headers.get('X-Respondent-Id') || undefined;
    const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown';
    const result = await this.respondentService.resume(survey.slug!, respondentId, ip, survey);

    if (result.isNewRespondent) {
      this.cache.incrementTotal();
      scheduleBroadcast(this.ctx, this.cache.broadcastScheduled);
    }

    const response = Response.json({
      answers: result.answers,
      nextQuestionIndex: result.nextQuestionIndex,
      isComplete: result.isComplete,
    });
    if (result.isNewRespondent) {
      response.headers.set('X-Respondent-Id', result.respondentId);
      response.headers.set('X-New-Respondent', 'true');
    }
    return response;
  }

  private async handleSubmitAnswers(request: Request): Promise<Response> {
    const respondentId = request.headers.get('X-Respondent-Id');
    if (!respondentId) return Response.json({ error: 'No respondent cookie' }, { status: 400 });
    const { answers } = (await request.json()) as {
      answers: Array<{ questionId: string; value: string; otherText?: string }>;
    };
    await this.respondentService.submitBatch(this.cache.survey.slug!, respondentId, answers, this.cache.survey);
    return new Response(null, { status: 204 });
  }

  private async handleComplete(request: Request): Promise<Response> {
    const respondentId = request.headers.get('X-Respondent-Id');
    if (!respondentId) return Response.json({ error: 'No respondent cookie' }, { status: 400 });
    await this.respondentService.complete(this.cache.survey.slug!, respondentId, this.cache.survey);
    this.cache.incrementCompleted();
    this.cache.updateTalliesOnCompletion(respondentId);
    scheduleBroadcast(this.ctx, this.cache.broadcastScheduled);
    return new Response(null, { status: 204 });
  }

  // ---- HTTP fallback (section/question CRUD, results, definition) ----

  private async handleSelfHostedFallback(method: string, path: string, request: Request, url: URL): Promise<Response> {
    const route = this.matchFallbackRoute(method, path, url);
    if (!route) {
      // Live results has transport-specific ETag handling
      if (method === 'GET' && path === '/results/live') return this.handleLiveResults(request);
      return new Response('Not found', { status: 404 });
    }

    const body = ['POST', 'PUT'].includes(method) ? await request.json() : {};
    const data = { ...route.params, ...body };
    const result = await execute(route.op, data, this.commandContext());

    if (result === undefined) return new Response(null, { status: 204 });
    return Response.json(result, { status: route.status ?? 200 });
  }

  private matchFallbackRoute(
    method: string,
    path: string,
    url: URL,
  ): { op: string; params: Record<string, unknown>; status?: number } | null {
    // Sections — reorder before /:id pattern
    if (method === 'POST' && path === '/sections') return { op: 'create-section', params: {}, status: 201 };
    if (method === 'PUT' && path === '/sections/reorder') return { op: 'reorder-sections', params: {} };
    let match = path.match(/^\/sections\/([^/]+)$/);
    if (match && method === 'PUT') return { op: 'update-section', params: { id: match[1] } };
    if (match && method === 'DELETE') return { op: 'delete-section', params: { id: match[1] } };

    // Questions — reorder before /:id pattern
    match = path.match(/^\/sections\/([^/]+)\/questions\/reorder$/);
    if (match && method === 'PUT') return { op: 'reorder-questions', params: { sectionId: match[1] } };
    match = path.match(/^\/sections\/([^/]+)\/questions$/);
    if (match && method === 'POST') return { op: 'create-question', params: { sectionId: match[1] }, status: 201 };
    match = path.match(/^\/questions\/([^/]+)$/);
    if (match && method === 'PUT') return { op: 'update-question', params: { id: match[1] } };
    if (match && method === 'DELETE') return { op: 'delete-question', params: { id: match[1] } };

    // Results
    if (method === 'GET' && path === '/results') return { op: 'get-results', params: {} };
    if (method === 'GET' && path === '/results/timeline')
      return { op: 'get-timeline', params: { granularity: url.searchParams.get('granularity') } };
    if (method === 'GET' && path === '/results/dropoff') return { op: 'get-dropoff', params: {} };
    if (method === 'GET' && path === '/results/respondents')
      return {
        op: 'list-respondents',
        params: { offset: url.searchParams.get('offset'), limit: url.searchParams.get('limit') },
      };
    match = path.match(/^\/results\/respondents\/([^/]+)$/);
    if (match && method === 'GET') return { op: 'get-respondent', params: { respondentId: match[1] } };
    if (match && method === 'DELETE') return { op: 'delete-respondent', params: { respondentId: match[1] } };
    if (method === 'GET' && path === '/results/search')
      return {
        op: 'search-answers',
        params: {
          query: url.searchParams.get('q') ?? '',
          questionId: url.searchParams.get('questionId') ?? undefined,
          offset: url.searchParams.get('offset'),
          limit: url.searchParams.get('limit'),
        },
      };

    // Definition
    if (method === 'GET' && path === '/definition') return { op: 'export-definition', params: {} };

    return null;
  }

  private async handleLiveResults(request: Request): Promise<Response> {
    const presence = getPresenceCounts(this.ctx).data;
    const results = await this.respondentService.getLiveResults(this.cache.survey.id, presence);
    const etag = `"${results.respondentCounts.completed}-${results.respondentCounts.total}"`;
    if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304 });
    const response = Response.json(results);
    response.headers.set('ETag', etag);
    response.headers.set('Cache-Control', 'private, no-cache');
    return response;
  }

  // ---- Helpers ----

  private commandContext(): CommandContext {
    return {
      surveyService: this.surveyService,
      respondentService: this.respondentService,
      cache: this.cache,
    };
  }

  private internalPath(pathname: string): string {
    const surveyMatch = pathname.match(/^\/api\/surveys\/[^/]+(\/.*)?$/);
    if (surveyMatch) return surveyMatch[1] || '/';
    const publicMatch = pathname.match(/^\/api\/s\/[^/]+(\/.*)?$/);
    if (publicMatch) return '/public' + (publicMatch[1] || '');
    return pathname;
  }

  private catalogSyncHeaders(): HeadersInit {
    const survey = this.cache.survey;
    return {
      'X-Catalog-Sync': JSON.stringify({
        title: survey.title,
        slug: survey.slug,
        status: survey.status,
        description: survey.description,
        password_hash: survey.password_hash,
        archived_at: survey.archived_at,
        updated_at: survey.updated_at,
        welcome_title: survey.welcome_title,
        welcome_description: survey.welcome_description,
        thank_you_title: survey.thank_you_title,
        thank_you_description: survey.thank_you_description,
        closes_at: survey.closes_at,
        max_responses: survey.max_responses,
        randomize_questions: survey.randomize_questions,
        randomize_options: survey.randomize_options,
      }),
    };
  }
}
