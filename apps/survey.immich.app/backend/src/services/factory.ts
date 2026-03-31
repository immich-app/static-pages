import { SurveyService } from './survey.service';
import { RespondentService } from './respondent.service';
import { TagService } from './tag.service';
import { AuditService } from './audit.service';
import { SurveyRepository, SectionRepository, QuestionRepository } from '../repositories/survey.repository';
import { RespondentRepository, AnswerRepository } from '../repositories/respondent.repository';
import { TagRepository } from '../repositories/tag.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { createDatabase } from '../db';

export function createSurveyService(env: Env): SurveyService {
  const db = createDatabase(env.DB);
  return new SurveyService(new SurveyRepository(db), new SectionRepository(db), new QuestionRepository(db));
}

export function createRespondentService(env: Env): RespondentService {
  const db = createDatabase(env.DB);
  return new RespondentService(
    new RespondentRepository(db),
    new AnswerRepository(db),
    new SurveyRepository(db),
    new QuestionRepository(db),
  );
}

export function createTagService(env: Env): TagService {
  return new TagService(new TagRepository(createDatabase(env.DB)));
}

export function createAuditService(env: Env): AuditService {
  return new AuditService(new AuditRepository(createDatabase(env.DB)));
}
