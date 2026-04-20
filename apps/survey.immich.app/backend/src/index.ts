import { AutoRouter, cors, IRequest } from 'itty-router';
import { ServiceError } from './services/errors';
import { registerAuthRoutes } from './routes/auth';
import { registerSurveyRoutes } from './routes/surveys';
import { registerRespondentRoutes } from './routes/respondents';
import { registerResultRoutes } from './routes/results';
import { registerTagRoutes } from './routes/tags';
import { registerAuditRoutes } from './routes/audit';
import { registerBackupRoutes } from './routes/backup';
import { authMiddleware } from './middleware/auth';
import { configFromEnv, type AppContext } from './config';
import { createD1Database } from './db';
import { getCookie, getRespondentId, setRespondentCookie } from './cookie';
import { verifyToken } from './utils/crypto';
import { verifySessionToken } from './utils/session';
import { ROLE_HIERARCHY, type UserRole } from './constants';
import { SURVEY_ID_PATTERN, PUBLIC_PATTERN } from './routing';

const { preflight, corsify } = cors();

function securityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

function registerAllRoutes(router: ReturnType<typeof AutoRouter>) {
  registerAuthRoutes(router as any);
  registerSurveyRoutes(router as any);
  registerRespondentRoutes(router as any);
  registerResultRoutes(router as any);
  registerTagRoutes(router as any);
  registerAuditRoutes(router as any);
  registerBackupRoutes(router as any);
}

// Factory for Node.js server: creates a router with pre-built context
// In Node.js, Response.json() returns an undici Response that fails `instanceof Response`
// checks in itty-router. This custom format handler detects Response-like objects by
// checking for the `status` and `headers` properties instead of using instanceof.
const nodeFormat = (value: unknown) => {
  if (value === undefined || value === null) return value;
  if (typeof value === 'object' && 'status' in (value as object) && 'headers' in (value as object)) return value;
  return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};

export function createRouter(ctx: AppContext) {
  const nodeRouter = AutoRouter<IRequest & { ctx?: AppContext }>({
    format: nodeFormat,
    before: [
      preflight,
      (request: IRequest & { ctx?: AppContext }) => {
        request.ctx = ctx;
      },
      (request: IRequest & { ctx?: AppContext }) => authMiddleware(request.ctx!)(request),
    ],
    finally: [securityHeaders, corsify],
    catch: (error) => {
      if (error instanceof ServiceError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      console.error('Unhandled error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    },
  });
  registerAllRoutes(nodeRouter);
  return nodeRouter;
}

// Workers entry point: creates context from Env per-request
const router = AutoRouter<IRequest & { ctx?: AppContext }, [Env, ExecutionContext]>({
  before: [
    preflight,
    (request: IRequest & { ctx?: AppContext }, env: Env) => {
      const config = configFromEnv(env);
      const db = createD1Database(env.DB);
      request.ctx = { db, config };
    },
    (request: IRequest & { ctx?: AppContext }) => authMiddleware(request.ctx!)(request),
  ],
  finally: [securityHeaders, corsify],
  catch: (error) => {
    if (error instanceof ServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('Unhandled error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  },
});

registerAllRoutes(router);

// ============================================================
// DO routing helpers
// ============================================================

/**
 * Per-isolate cache for slug → survey ID lookups.
 *
 * Every public HTTP request and every WS upgrade on /api/s/:slug/* needs to
 * translate the slug to a survey ID before forwarding to the DO. Without
 * caching, this hits D1 on every request — under load the D1 read throughput
 * limit (~2000/s) becomes the bottleneck for WS connects.
 *
 * The cache lives in module scope, so it's shared across all requests handled
 * by the same Workers isolate (isolates last minutes). A 60-second TTL bounds
 * cross-isolate staleness for slug renames.
 *
 * We deliberately do NOT cache password_hash — its value gates an auth check
 * (whether a password is required at all), and a stale `null` after an admin
 * adds a password would let unauthenticated respondents through in other
 * isolates for the TTL window. Instead, the DO itself enforces the password
 * requirement using its own properly-invalidated cache, and the worker just
 * verifies the spw_ cookie if present and forwards X-Authenticated.
 */
interface CachedSlugEntry {
  id: string;
  cachedAt: number;
}
const SLUG_CACHE_TTL_MS = 60_000;
const slugCache = new Map<string, CachedSlugEntry>();

/**
 * Internal headers that the API worker uses to tell the DO the verified
 * identity of a request. These MUST never be sourced from the client — a
 * client sending any of these is trying to spoof auth. We strip them from
 * every inbound request before forwarding, then the worker explicitly sets
 * the ones it has verified.
 */
const INTERNAL_HEADERS = ['X-WS-Role', 'X-Respondent-Id', 'X-Authenticated'];

function stripInternalHeaders(headers: Headers): void {
  for (const h of INTERNAL_HEADERS) headers.delete(h);
}

async function slugToRow(db: D1Database, slug: string): Promise<{ id: string } | null> {
  const cached = slugCache.get(slug);
  if (cached && Date.now() - cached.cachedAt < SLUG_CACHE_TTL_MS) {
    return { id: cached.id };
  }

  const row = await db.prepare('SELECT id FROM surveys WHERE slug = ?').bind(slug).first<{ id: string }>();

  if (row) {
    slugCache.set(slug, { id: row.id, cachedAt: Date.now() });
    // Bound the cache size — unlikely to grow large (one entry per published survey)
    // but cap it to prevent unbounded growth in pathological cases
    if (slugCache.size > 1000) {
      const firstKey = slugCache.keys().next().value;
      if (firstKey) slugCache.delete(firstKey);
    }
  }
  return row;
}

/**
 * Drop all slug-cache entries that point at the given survey. Call this after
 * any mutation that invalidates the slug→surveyId mapping — delete, slug
 * change, or password_hash change — so the current isolate doesn't serve
 * stale routes. Other isolates still rely on the TTL to expire; keeping that
 * short (60s) bounds cross-isolate staleness.
 */
function invalidateSlugCacheBySurveyId(surveyId: string): void {
  for (const [slug, entry] of slugCache.entries()) {
    if (entry.id === surveyId) slugCache.delete(slug);
  }
}

function getDOStub(env: Env, surveyId: string): DurableObjectStub {
  const id = env.SURVEY_SESSIONS.idFromName(surveyId);
  return env.SURVEY_SESSIONS.get(id);
}

const CATALOG_SYNC_COLUMNS = new Set([
  'title',
  'slug',
  'status',
  'description',
  'password_hash',
  'archived_at',
  'updated_at',
  'welcome_title',
  'welcome_description',
  'thank_you_title',
  'thank_you_description',
  'closes_at',
  'max_responses',
  'randomize_questions',
  'randomize_options',
]);

/** After forwarding a mutation to the DO, sync catalog fields back to D1 */
async function syncCatalog(response: Response, db: D1Database, surveyId: string): Promise<void> {
  const syncHeader = response.headers.get('X-Catalog-Sync');
  if (!syncHeader) return;
  try {
    const fields = JSON.parse(syncHeader) as Record<string, unknown>;
    const keys = Object.keys(fields).filter((k) => CATALOG_SYNC_COLUMNS.has(k));
    if (keys.length === 0) return;
    const setClauses = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => fields[k]), surveyId];
    await db
      .prepare(`UPDATE surveys SET ${setClauses} WHERE id = ?`)
      .bind(...values)
      .run();
    // If the slug changed, drop stale entries from the per-isolate cache so
    // future requests for the new slug rebuild the mapping. Other isolates
    // rely on the TTL to expire — keeping that short (60s) bounds the window.
    // password_hash changes don't need invalidation here because the cache no
    // longer stores it; the DO enforces the password gate authoritatively.
    if ('slug' in fields) {
      invalidateSlugCacheBySurveyId(surveyId);
    }
  } catch {
    console.error('Failed to sync catalog for survey', surveyId);
  }
}

/** Initialize a DO with survey data after creation. Throws on failure. */
async function initDO(env: Env, surveyId: string, data: unknown): Promise<void> {
  const stub = getDOStub(env, surveyId);
  const res = await stub.fetch(
    new Request('https://do/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DO init failed (${res.status}): ${text}`);
  }
}

/** Create a clean response copy (stripping internal headers) */
function cleanResponse(response: Response): Response {
  const cleaned = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  cleaned.headers.delete('X-Catalog-Sync');
  cleaned.headers.delete('X-Respondent-Id');
  cleaned.headers.delete('X-New-Respondent');
  return cleaned;
}

/** Check if this route should be forwarded to the DO */
function matchDORoute(method: string, pathname: string): { surveyId?: string; slug?: string } | null {
  // /api/surveys/:id/...
  const surveyMatch = pathname.match(SURVEY_ID_PATTERN);
  if (surveyMatch) {
    const id = surveyMatch[1];
    // Exclude list and create (handled by itty-router)
    if (id === 'import') return null; // POST /api/surveys/import
    // Tags live in D1, not in the DO — let itty-router handle them
    const subPath = surveyMatch[2] || '';
    if (subPath === '/tags') return null;
    return { surveyId: id };
  }

  // /api/s/:slug/...
  const publicMatch = pathname.match(PUBLIC_PATTERN);
  if (publicMatch) {
    const slug = publicMatch[1];
    const subPath = publicMatch[2] || '';
    // /api/s/:slug/auth and /api/s/:slug/reset are handled by the worker
    if (subPath === '/auth' || subPath === '/reset') return null;
    return { slug };
  }

  return null;
}

// ============================================================
// Main export
// ============================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Skip DO routing if DOs not available (shouldn't happen in Workers but safety check)
    if (!env.SURVEY_SESSIONS) {
      return router.fetch(request, env, ctx);
    }

    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // CORS preflight — let itty-router handle it
    if (method === 'OPTIONS') {
      return router.fetch(request, env, ctx);
    }

    // Check if this route should go to the DO
    const doMatch = matchDORoute(method, pathname);

    if (!doMatch) {
      // Not a DO route — goes through itty-router (list, create, import, tags, audit, auth, backup)
      const response = await router.fetch(request, env, ctx);

      // After survey creation/import, initialize the DO with the survey data
      if (response.ok && method === 'POST' && (pathname === '/api/surveys' || pathname === '/api/surveys/import')) {
        const body = await response.json();
        const surveyData = body.survey ?? body;
        if (surveyData?.id) {
          try {
            await initDO(env, surveyData.id, body.survey ? body : { survey: surveyData });
          } catch (e) {
            // DO init failed — roll back the D1 catalog entry
            console.error('Rolling back survey creation after DO init failure:', e);
            await env.DB.prepare('DELETE FROM surveys WHERE id = ?').bind(surveyData.id).run();
            return Response.json({ error: 'Failed to initialize survey storage. Please try again.' }, { status: 503 });
          }
        }
        // Re-wrap with the new body. Strip headers that describe the original
        // body's encoding/length — Response.json will recompute them against
        // the re-serialized body, and a stale content-length would be rejected
        // by downstream infra.
        const newHeaders = new Headers(response.headers);
        newHeaders.delete('content-length');
        newHeaders.delete('content-type');
        return Response.json(body, { status: response.status, headers: newHeaders });
      }

      return response;
    }

    const db = createD1Database(env.DB);
    const config = configFromEnv(env);

    // Resolve survey ID
    let surveyId: string;

    if (doMatch.surveyId) {
      surveyId = doMatch.surveyId;
    } else if (doMatch.slug) {
      const row = await slugToRow(env.DB, doMatch.slug);
      if (!row) return Response.json({ error: 'Survey not found' }, { status: 404 });
      surveyId = row.id;
    } else {
      return router.fetch(request, env, ctx);
    }

    const isPublicRoute = !!doMatch.slug;

    // Authenticate: admin routes need auth + role check.
    // Public routes: the worker doesn't gate on password requirements (which
    // would require knowing the current password_hash and risk cross-isolate
    // staleness). Instead, the worker verifies the spw_ cookie if present and
    // forwards an X-Authenticated header — the DO checks its own
    // (always-current) survey.password_hash and rejects with 403 when needed.
    if (!isPublicRoute) {
      const authResult = await authenticateRequest(request, config);
      if (authResult instanceof Response) return authResult;

      const subPath = pathname.match(SURVEY_ID_PATTERN)?.[2] || '/';
      const requiredRole = getRequiredDORole(method, subPath);
      if (!checkRole(authResult, requiredRole)) {
        return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // WebSocket upgrade — forward original request directly to preserve upgrade semantics
    const stub = getDOStub(env, surveyId);
    if (request.headers.get('Upgrade') === 'websocket') {
      const wsUrl = new URL(request.url);
      const wsType = wsUrl.searchParams.get('type');

      // Viewer and editor WS connections are admin features — authenticate via session cookie
      // and pass the real role to the DO so it can allow/deny per-op based on role hierarchy.
      let wsRole = 'public';
      if (wsType === 'viewer' || wsType === 'editor') {
        const authResult = await authenticateRequest(request, config);
        if (authResult instanceof Response) return authResult;
        const minRole = wsType === 'editor' ? 'editor' : 'viewer';
        if (!checkRole(authResult, minRole)) {
          return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        wsRole = authResult; // actual role (viewer/editor/admin) so DO can enforce fine-grained checks
      }

      // Strip any client-supplied internal headers — these MUST come from
      // the worker's own verification, never from the client.
      const wsHeaders = new Headers(request.headers);
      stripInternalHeaders(wsHeaders);
      wsHeaders.set('X-WS-Role', wsRole);

      if (isPublicRoute && doMatch.slug) {
        // Forward respondent cookie ID so the DO can tag the connection for
        // authenticated-once respondent sessions (no need to re-auth per message).
        // The header is only set from a verified rid cookie — never from the
        // client's request headers directly.
        const respondentId = getRespondentId(request, doMatch.slug);
        if (respondentId) wsHeaders.set('X-Respondent-Id', respondentId);

        // Always verify the spw_ cookie (independent of whether we know the
        // survey requires a password — the DO will gate based on its own
        // current password_hash). Forwarding "user holds a valid token for
        // this survey" lets the DO trust the result without re-verifying.
        const token = getCookie(request, `spw_${doMatch.slug}`);
        const isAuthenticated = token ? await verifyToken(surveyId, token, config.passwordSecret) : false;
        wsHeaders.set('X-Authenticated', isAuthenticated ? 'true' : 'false');
      }

      return stub.fetch(new Request(request.url, { method: request.method, headers: wsHeaders }));
    }

    // Build headers for the DO request. Strip any client-supplied internal
    // headers up front — the worker is the only thing allowed to set them.
    const doHeaders = new Headers(request.headers);
    stripInternalHeaders(doHeaders);

    if (isPublicRoute) {
      // Add respondent ID header for public endpoints — ONLY from a verified
      // rid cookie, never from the client's own X-Respondent-Id header.
      const slug = doMatch.slug!;
      const respondentId = getRespondentId(request, slug);
      if (respondentId) doHeaders.set('X-Respondent-Id', respondentId);

      // X-Authenticated reports the true validity of the spw_ cookie. The DO
      // decides whether a password is required based on its own up-to-date
      // survey.password_hash and rejects unauthenticated requests when needed.
      const token = getCookie(request, `spw_${slug}`);
      const isAuthenticated = token ? await verifyToken(surveyId, token, config.passwordSecret) : false;
      doHeaders.set('X-Authenticated', isAuthenticated ? 'true' : 'false');
    }

    // Forward to DO
    const doRequest = new Request(request.url, {
      method: request.method,
      headers: doHeaders,
      body: request.body,
    });
    const doResponse = await stub.fetch(doRequest);

    // Handle duplicate: DO returns new survey data, we create D1 entry + new DO
    const isDuplicate = method === 'POST' && pathname.endsWith('/duplicate') && doResponse.status === 201;
    if (isDuplicate) {
      const dupData = (await doResponse.json()) as {
        survey: Record<string, unknown>;
        sections: unknown[];
        questions: unknown[];
      };
      const newId = dupData.survey.id as string;
      // Create D1 catalog entry
      const s = dupData.survey;
      await env.DB.prepare(
        `INSERT INTO surveys (id, title, description, slug, status, welcome_title, welcome_description,
          thank_you_title, thank_you_description, closes_at, max_responses, randomize_questions,
          randomize_options, password_hash, archived_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
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
        )
        .run();
      // Init new DO
      ctx.waitUntil(initDO(env, newId, dupData));
      const dupResponse = Response.json(dupData, { status: 201 });
      securityHeaders(dupResponse);
      return dupResponse;
    }

    // Handle delete: remove D1 catalog row and tag associations.
    // ONLY for the top-level DELETE /api/surveys/:id — nested deletes
    // (sections, questions, respondents) must leave the catalog intact.
    const surveySubPath = pathname.match(SURVEY_ID_PATTERN)?.[2] ?? '';
    const isTopLevelSurveyDelete = surveySubPath === '' || surveySubPath === '/';
    if (method === 'DELETE' && doResponse.status === 204 && doMatch.surveyId && isTopLevelSurveyDelete) {
      // Drop any stale slug→id entries for this survey from the per-isolate
      // cache so a later request (e.g. same slug re-used by a brand new
      // survey) can't route through to the deleted DO.
      invalidateSlugCacheBySurveyId(surveyId);
      ctx.waitUntil(
        (async () => {
          await env.DB.batch([
            env.DB.prepare('DELETE FROM survey_tags WHERE survey_id = ?').bind(surveyId),
            env.DB.prepare('DELETE FROM surveys WHERE id = ?').bind(surveyId),
          ]);
        })(),
      );
    }

    // Sync catalog back to D1 (for mutations)
    if (method !== 'GET' && method !== 'HEAD') {
      ctx.waitUntil(syncCatalog(doResponse, env.DB, surveyId));
    }

    // Handle respondent cookie from DO response
    const response = cleanResponse(doResponse);
    if (isPublicRoute && doMatch.slug) {
      const newRespondentId = doResponse.headers.get('X-Respondent-Id');
      const isNew = doResponse.headers.get('X-New-Respondent') === 'true';
      if (isNew && newRespondentId) {
        setRespondentCookie(response.headers, doMatch.slug, newRespondentId, config.cookieSecure);
      }
    }

    // Apply security headers and CORS
    securityHeaders(response);
    const origin = request.headers.get('Origin');
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  },
};

function checkRole(role: UserRole, minRole: UserRole): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

/** Determine the minimum role required for a DO admin route */
function getRequiredDORole(method: string, subPath: string): UserRole {
  if (method === 'DELETE') {
    // Delete survey or delete respondent requires admin
    if (subPath === '/' || subPath === '' || /^\/results\/respondents\//.test(subPath)) {
      return 'admin';
    }
    return 'editor';
  }
  if (method !== 'GET' && method !== 'HEAD') return 'editor';
  if (subPath === '/definition') return 'editor';
  return 'viewer';
}

// Auth check for admin routes (outside itty-router). Delegates to the shared
// session-token validator so this path and the authMiddleware (AuthService)
// path can't drift on signature / exp handling.
async function authenticateRequest(
  request: Request,
  config: import('./config').AppConfig,
): Promise<Response | UserRole> {
  const sessionCookie = getCookie(request, 'survey_session');
  if (!sessionCookie) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  const user = await verifySessionToken(sessionCookie, config.sessionSecret);
  if (!user) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
  return user.role;
}
