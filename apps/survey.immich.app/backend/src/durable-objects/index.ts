export { SurveyDO } from './survey-do';

// Keep old class export so Cloudflare doesn't reject the deploy
// (existing DOs depend on it). Will be removed via delete-class migration later.
export { SurveyDO as SurveySession } from './survey-do';

// Durable Object worker — no fetch handler needed, only exports the DO class
export default {
  async fetch(): Promise<Response> {
    return new Response('This worker only hosts Durable Objects', { status: 404 });
  },
};
