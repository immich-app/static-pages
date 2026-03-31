import { AutoRouter, cors, IRequest } from 'itty-router';
import { ServiceError } from './services/errors';
import { registerAuthRoutes } from './routes/auth';
import { registerSurveyRoutes } from './routes/surveys';
import { registerRespondentRoutes } from './routes/respondents';
import { registerResultRoutes } from './routes/results';
import { registerTagRoutes } from './routes/tags';
import { registerAuditRoutes } from './routes/audit';
import { authMiddleware } from './middleware/auth';

const { preflight, corsify } = cors();

function securityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

const router = AutoRouter<IRequest, [Env, ExecutionContext]>({
  before: [preflight, (request: IRequest, env: Env) => authMiddleware(env)(request)],
  finally: [securityHeaders, corsify],
  catch: (error) => {
    if (error instanceof ServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('Unhandled error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  },
});

registerAuthRoutes(router);
registerSurveyRoutes(router);
registerRespondentRoutes(router);
registerResultRoutes(router);
registerTagRoutes(router);
registerAuditRoutes(router);

export default router;
