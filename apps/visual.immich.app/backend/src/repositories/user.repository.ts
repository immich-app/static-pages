import type { Insertable, Kysely } from 'kysely';
import type { DB, UserTable } from '../schema/tables';

export class UserRepository {
  constructor(private db: Kysely<DB>) {}

  upsert(user: Insertable<UserTable>) {
    return this.db
      .insertInto('user')
      .values(user)
      .onConflict((conflict) =>
        conflict.column('oauthId').doUpdateSet((eb) => ({
          email: eb.ref('excluded.email'),
          name: eb.ref('excluded.name'),
          role: eb.ref('excluded.role'),
          updatedAt: eb.ref('excluded.updatedAt'),
        })),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
