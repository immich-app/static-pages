#!/usr/bin/env node
import { Command } from 'commander';
import { sql } from 'kysely';
import { join } from 'node:path';
import { Migrator } from 'src/migration';

const withMigrator =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn: (migrator: Migrator, options: Record<string, any>, args: string[]) => unknown | Promise<unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function (...args: any[]) {
      const command: Command = args.at(-1);
      const options = command.optsWithGlobals();

      const migrator = new Migrator({
        connectionParams: { connectionType: 'url', url: options.url },
        allowUnorderedMigrations: false,
        migrationFolder: join(process.cwd(), options.folder),
      });
      await fn(migrator, options, command.args);
      await migrator.destroy();
    };

const program = new Command('sql-tools');

program
  .requiredOption('-u, --url <url>', 'Database connection url')
  .option('-f, --folder <migrationsFolder>', 'Path to the migration files', 'dist/schema/migrations');

program
  .command('query')
  .description('Run an arbitrary query against the database')
  .argument('<query>', 'The query to run')
  .action(
    withMigrator(async (migrator, _, [query]) => console.log(await sql.raw(query).execute(migrator.getDatabase()))),
  );

const migrations = program
  .command('migrations')
  .description('Commands to handle schema migration')
  .argument('[command]');

migrations
  .command('run')
  .description('Run all migrations')
  .action(withMigrator((migrator) => migrator.runMigrations()));

migrations
  .command('revert')
  .description('Revert the most recent migration')
  .requiredOption(
    '-f, --folder <migrationsFolder>',
    'Path to the folder the migration files are in',
    'src/schema/migrations',
  )
  .action(withMigrator((migrator, { folder }) => migrator.revert(join(process.cwd(), folder))));

migrations
  .command('create')
  .description('Create a new, barebones migration file')
  .argument(
    '[path]',
    'Optional path where the migration file should be written to. Defaults to `src/Migration`',
    'src/Migration',
  )
  .action(withMigrator((migrator, _, [path]) => migrator.create(join(process.cwd(), path ?? 'src/Migration'), [], [])));

migrations
  .command('generate')
  .description('Generate a new migration file that contains the UP and DOWN queries to migrate the schema')
  .option('--debug', 'Generate the migration file with extra comments', false)
  .option('-s, --schemaDist <path>', 'Path to the built schema files', 'dist/schema')
  .argument(
    '[path]',
    'Optional path where the migration file should be written to. Defaults to `src/Migration`',
    'src/Migration',
  )
  .action(
    withMigrator((migrator, { debug, schemaDist }, [path]) =>
      migrator.generate({
        dist: join(process.cwd(), schemaDist),
        targetPath: join(process.cwd(), path ?? 'src/Migration'),
        withComments: debug,
      }),
    ),
  );

program
  .parseAsync()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    console.log('Something went wrong');
    process.exit(1);
  });
