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
export function createRouter(ctx: AppContext) {
  const nodeRouter = AutoRouter<IRequest & { ctx?: AppContext }>({
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Route WebSocket upgrades to Durable Object
    const url = new URL(request.url);
    const wsMatch = url.pathname.match(/^\/api\/s\/([^/]+)\/ws$/);
    if (wsMatch && request.headers.get('Upgrade') === 'websocket') {
      if (!env.SURVEY_SESSIONS) {
        return new Response('WebSocket not available', { status: 501 });
      }
      const slug = wsMatch[1];
      const id = env.SURVEY_SESSIONS.idFromName(slug);
      const stub = env.SURVEY_SESSIONS.get(id);
      return stub.fetch(request);
    }

    return router.fetch(request, env, ctx);
  },
};
