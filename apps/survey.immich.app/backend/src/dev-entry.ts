// Combined entry point for local development and CI testing.
// Exports both the API worker fetch handler and the SurveyDO class
// in a single worker, avoiding cross-service DO binding issues.

export { SurveyDO } from './durable-objects/survey-do';
export { default } from './index';
