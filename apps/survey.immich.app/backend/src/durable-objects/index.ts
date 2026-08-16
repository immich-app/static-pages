export { SurveyDO } from './survey-do';

export default {
  async fetch(): Promise<Response> {
    return new Response('This worker only hosts Durable Objects', { status: 404 });
  },
};
