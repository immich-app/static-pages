// Local dev / CI entry point: the worker and the DO ship in one worker so there
// is no cross-service DO binding to configure.

export { SurveyDO } from './durable-objects/survey-do';
export { default } from './index';
