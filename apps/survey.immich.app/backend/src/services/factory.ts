import { SurveyService } from './survey.service';
import { RespondentService } from './respondent.service';
import { SurveyRepository, SectionRepository, QuestionRepository } from '../repositories/survey.repository';
import { RespondentRepository, AnswerRepository } from '../repositories/respondent.repository';

export function createSurveyService(env: Env): SurveyService {
  return new SurveyService(new SurveyRepository(env.DB), new SectionRepository(env.DB), new QuestionRepository(env.DB));
}

export function createRespondentService(env: Env): RespondentService {
  return new RespondentService(
    new RespondentRepository(env.DB),
    new AnswerRepository(env.DB),
    new SurveyRepository(env.DB),
    new QuestionRepository(env.DB),
  );
}
