import { sql } from 'kysely';
import { Reader } from 'src/types.js';

export const readFunctions: Reader = async (ctx, db) => {
  const routines = await db
    .selectFrom('pg_proc as p')
    .innerJoin('pg_namespace', 'pg_namespace.oid', 'p.pronamespace')
    .leftJoin('pg_depend as d', (join) =>
      join
        .onRef('d.objid', '=', 'p.oid')
        // objid is only unique per catalog, so also match classid to avoid skipping a function
        // whose OID equals that of an extension-owned object in another catalog (e.g. a pg_type)
        .on('d.classid', '=', sql`'pg_proc'::regclass`)
        .on('d.deptype', '=', sql.lit('e')),
    )
    .where('d.objid', 'is', sql.lit(null))
    .where('p.prokind', '=', sql.lit('f'))
    .where('pg_namespace.nspname', '=', ctx.schemaName)
    .select((eb) => [
      'p.proname as name',
      eb.fn<string>('pg_get_function_identity_arguments', ['p.oid']).as('arguments'),
      eb.fn<string>('pg_get_functiondef', ['p.oid']).as('expression'),
    ])
    .execute();

  for (const { name, expression } of routines) {
    ctx.functions.push({
      name,
      // TODO read expression from the overrides table
      expression,
      synchronize: true,
    });
  }
};
