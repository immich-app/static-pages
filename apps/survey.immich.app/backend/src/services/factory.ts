import type { Kysely } from 'kysely';
import type { Database } from '../db';
import { SurveyService } from './survey.service';
import { RespondentService } from './respondent.service';
import { TagService } from './tag.service';
import { AuditService } from './audit.service';
import { SurveyRepository, SectionRepository, QuestionRepository } from '../repositories/survey.repository';
import { RespondentRepository, AnswerRepository } from '../repositories/respondent.repository';
import { TagRepository } from '../repositories/tag.repository';
import { AuditRepository } from '../repositories/audit.repository';

export function createSurveyService(db: Kysely<Database>): SurveyService {
  return new SurveyService(new SurveyRepository(db), new SectionRepository(db), new QuestionRepository(db));
}

export function createRespondentService(db: Kysely<Database>): RespondentService {
  return new RespondentService(
    new RespondentRepository(db),
    new AnswerRepository(db),
    new SurveyRepository(db),
    new QuestionRepository(db),
  );
}

export function createTagService(db: Kysely<Database>): TagService {
  return new TagService(new TagRepository(db));
}

export function createAuditService(db: Kysely<Database>): AuditService {
  return new AuditService(new AuditRepository(db));
}
