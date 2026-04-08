export { SurveySession } from './survey-session';

// Durable Object worker — no fetch handler needed, only exports the DO class
export default {
  async fetch(): Promise<Response> {
    return new Response('This worker only hosts Durable Objects', { status: 404 });
  },
};
