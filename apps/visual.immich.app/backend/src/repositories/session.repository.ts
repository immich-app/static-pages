import type { Insertable, Kysely } from 'kysely';
import type { DB, SessionTable } from '../schema/tables';

export class SessionRepository {
  constructor(private db: Kysely<DB>) {}

  async create(session: Insertable<SessionTable>): Promise<void> {
    await this.db.insertInto('session').values(session).execute();
  }

  getByToken(token: string) {
    return this.db
      .selectFrom('session')
      .innerJoin('user', 'user.id', 'session.userId')
      .where('session.token', '=', token)
      .select(['session.id', 'session.expiresAt', 'session.userId', 'user.email', 'user.name', 'user.role'])
      .executeTakeFirst();
  }
}
