#!/usr/bin/env node
import { Command } from 'commander';
import { sql } from 'kysely';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ORDER_FILENAME, parseOrder, readOrder, syncOrder, verifyOrder } from 'src/migration-order';
import { Migrator } from 'src/migration';

const withMigrator =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn: (migrator: Migrator, options: Record<string, any>, args: string[]) => unknown | Promise<unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function (...args: any[]) {
      const command: Command = args.at(-1);
      const options = command.optsWithGlobals();
      if (!options.url) {
        throw new Error(`Missing required option '-u, --url <url>'`);
      }

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
  .option('-u, --url <url>', 'Database connection url')
  .option(
    '-f, --folder <migrationsFolder>',
    'Path to the runnable (compiled) migration files',
    'dist/schema/migrations',
  )
  .option('--source-folder <migrationsSourceFolder>', 'Path to the migration source files', 'src/schema/migrations');

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
  .action(withMigrator((migrator, { sourceFolder }) => migrator.revert(join(process.cwd(), sourceFolder))));

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
  .command('sync-order')
  .description(`Regenerate the ${ORDER_FILENAME} file from the migration files on disk`)
  .action((_: unknown, command: Command) => {
    const folder = resolve(process.cwd(), command.optsWithGlobals().sourceFolder);
    const { changed, next } = syncOrder(folder);
    console.log(
      changed
        ? `Wrote ${join(folder, ORDER_FILENAME)} (${next.length} migrations)`
        : `${ORDER_FILENAME} is already up to date (${next.length} migrations)`,
    );
  });

migrations
  .command('verify-order')
  .description(`Verify the ${ORDER_FILENAME} file matches the migration files on disk`)
  .option('--append-only-from <path>', `Baseline ${ORDER_FILENAME} file that must be a prefix of the current one`)
  .action((options: { appendOnlyFrom?: string }, command: Command) => {
    const folder = resolve(process.cwd(), command.optsWithGlobals().sourceFolder);
    const appendOnlyFrom = options.appendOnlyFrom
      ? parseOrder(readFileSync(options.appendOnlyFrom, 'utf8'))
      : undefined;

    const errors = verifyOrder(folder, { appendOnlyFrom });
    if (errors.length > 0) {
      throw new Error(errors.map((error) => `- ${error}`).join('\n'));
    }

    console.log(`${ORDER_FILENAME} is consistent (${readOrder(folder)?.length ?? 0} migrations)`);
  });

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
  // eslint-disable-next-line unicorn/prefer-await
  .then(() => {
    process.exit(0);
  })
  // eslint-disable-next-line unicorn/prefer-await
  .catch((error) => {
    console.error(error);
    console.log('Something went wrong');
    process.exit(1);
  });
