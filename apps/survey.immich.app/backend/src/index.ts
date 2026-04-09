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

async function slugToRow(db: D1Database, slug: string): Promise<{ id: string; password_hash: string | null } | null> {
  return db
    .prepare('SELECT id, password_hash FROM surveys WHERE slug = ?')
    .bind(slug)
    .first<{ id: string; password_hash: string | null }>();
}

function getDOStub(env: Env, surveyId: string): DurableObjectStub {
  const id = env.SURVEY_SESSIONS.idFromName(surveyId);
  return env.SURVEY_SESSIONS.get(id);
}

/** After forwarding a mutation to the DO, sync catalog fields back to D1 */
async function syncCatalog(response: Response, db: D1Database, surveyId: string): Promise<void> {
  const syncHeader = response.headers.get('X-Catalog-Sync');
  if (!syncHeader) return;
  try {
    const fields = JSON.parse(syncHeader) as Record<string, unknown>;
    const keys = Object.keys(fields);
    if (keys.length === 0) return;
    const setClauses = keys.map((k) => `${k} = ?`).join(', ');
    const values = [...keys.map((k) => fields[k]), surveyId];
    await db
      .prepare(`UPDATE surveys SET ${setClauses} WHERE id = ?`)
      .bind(...values)
      .run();
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

// ============================================================
// Per-survey route patterns that go to DO
// ============================================================

// /api/surveys/:id/* (but NOT /api/surveys which is the list, or POST /api/surveys which is create)
const SURVEY_ID_PATTERN = /^\/api\/surveys\/([^/]+)(\/.*)?$/;
// /api/s/:slug/*
const PUBLIC_PATTERN = /^\/api\/s\/([^/]+)(\/.*)?$/;

/** Check if this route should be forwarded to the DO */
function matchDORoute(method: string, pathname: string): { surveyId?: string; slug?: string } | null {
  // /api/surveys/:id/...
  const surveyMatch = pathname.match(SURVEY_ID_PATTERN);
  if (surveyMatch) {
    const id = surveyMatch[1];
    // Exclude list and create (handled by itty-router)
    if (id === 'import') return null; // POST /api/surveys/import
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
        return Response.json(body, { status: response.status, headers: response.headers });
      }

      return response;
    }

    const db = createD1Database(env.DB);
    const config = configFromEnv(env);

    // Resolve survey ID
    let surveyId: string;
    let passwordHash: string | null = null;

    if (doMatch.surveyId) {
      surveyId = doMatch.surveyId;
    } else if (doMatch.slug) {
      const row = await slugToRow(env.DB, doMatch.slug);
      if (!row) return Response.json({ error: 'Survey not found' }, { status: 404 });
      surveyId = row.id;
      passwordHash = row.password_hash;
    } else {
      return router.fetch(request, env, ctx);
    }

    const isPublicRoute = !!doMatch.slug;

    // Authenticate: admin routes need auth, public routes need password check
    if (!isPublicRoute) {
      // Admin route — authenticate via middleware
      const authResult = await authenticateRequest(request, config);
      if (authResult) return authResult; // Returns error response if auth fails
    } else {
      // Public route — check password session if needed
      if (doMatch.slug) {
        // Look up password_hash if not already loaded
        if (passwordHash === undefined) {
          const row = await slugToRow(env.DB, doMatch.slug);
          passwordHash = row?.password_hash ?? null;
        }

        const subPathPublic = pathname.match(PUBLIC_PATTERN)?.[2] || '';
        const needsPasswordCheck =
          subPathPublic === '/resume' || subPathPublic === '/answers/batch' || subPathPublic === '/complete';

        if (needsPasswordCheck && passwordHash) {
          const token = getCookie(request, `spw_${doMatch.slug}`);
          if (!token || !(await verifyToken(surveyId, token, config.passwordSecret))) {
            return Response.json({ error: 'Authentication required' }, { status: 403 });
          }
        }
      }
    }

    // WebSocket upgrade — forward original request directly to preserve upgrade semantics
    const stub = getDOStub(env, surveyId);
    if (request.headers.get('Upgrade') === 'websocket') {
      return stub.fetch(request);
    }

    // Build headers for the DO request
    const doHeaders = new Headers(request.headers);

    if (isPublicRoute) {
      // Add respondent ID header for public endpoints
      const slug = doMatch.slug!;
      const respondentId = getRespondentId(request, slug);
      if (respondentId) doHeaders.set('X-Respondent-Id', respondentId);

      // Add password authentication status
      if (passwordHash) {
        const token = getCookie(request, `spw_${slug}`);
        const isAuthenticated = token ? await verifyToken(surveyId, token, config.passwordSecret) : false;
        doHeaders.set('X-Authenticated', isAuthenticated ? 'true' : 'false');
      } else {
        doHeaders.set('X-Authenticated', 'true');
      }
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

    // Handle delete: also remove D1 catalog row (and dependent rows lacking ON DELETE CASCADE)
    if (method === 'DELETE' && doResponse.status === 204 && doMatch.surveyId && !pathname.includes('/results/')) {
      ctx.waitUntil(
        (async () => {
          await env.DB.batch([
            env.DB.prepare('DELETE FROM answers WHERE respondent_id IN (SELECT id FROM respondents WHERE survey_id = ?)').bind(surveyId),
            env.DB.prepare('DELETE FROM respondents WHERE survey_id = ?').bind(surveyId),
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

// Auth check for admin routes (outside itty-router) — verifies HMAC signature
async function authenticateRequest(request: Request, config: import('./config').AppConfig): Promise<Response | null> {
  const sessionCookie = getCookie(request, 'survey_session');
  if (!sessionCookie) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }
  try {
    const parts = sessionCookie.split('.');
    if (parts.length !== 3) return Response.json({ error: 'Invalid session' }, { status: 401 });

    // Verify HMAC signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(config.sessionSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const sigBytes = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return Response.json({ error: 'Invalid session' }, { status: 401 });

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.sub || !payload.exp || payload.exp * 1000 < Date.now()) {
      return Response.json({ error: 'Session expired' }, { status: 401 });
    }
    return null; // Auth OK
  } catch {
    return Response.json({ error: 'Invalid session' }, { status: 401 });
  }
}
