import { QueryResult, sql } from 'kysely';
import { Reader } from 'src/types';

export const readName: Reader = async (ctx, db) => {
  const result = (await sql`SELECT current_database() as name`.execute(db)) as QueryResult<{ name: string }>;

  ctx.databaseName = result.rows[0].name;
};
