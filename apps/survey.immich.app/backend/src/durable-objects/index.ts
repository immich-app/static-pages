export { SurveyDO } from './survey-do';

// Legacy alias for the original KV-backed class (see wrangler-do.jsonc v1
// migration: `new_classes: ["SurveySession"]`). Cloudflare rejects a deploy
// that removes a class still declared in the migration chain, so the alias
// stays exported until a future `deleted_classes` migration retires v1.
export { SurveyDO as SurveySession } from './survey-do';

// Durable Object worker — no fetch handler needed, only exports the DO class
export default {
  async fetch(): Promise<Response> {
    return new Response('This worker only hosts Durable Objects', { status: 404 });
  },
};
