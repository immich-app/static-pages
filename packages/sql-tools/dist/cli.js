#!/usr/bin/env node
import { Migrator, ORDER_FILENAME, parseOrder, readOrder, syncOrder, verifyOrder } from "./index.js";
import { sql } from "kysely";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "commander";
//#region src/bin/cli.ts
var withMigrator = (fn) => async function(...args) {
	const command = args.at(-1);
	const options = command.optsWithGlobals();
	if (!options.url) throw new Error(`Missing required option '-u, --url <url>'`);
	const migrator = new Migrator({
		connectionParams: {
			connectionType: "url",
			url: options.url
		},
		allowUnorderedMigrations: false,
		migrationFolder: join(process.cwd(), options.folder)
	});
	await fn(migrator, options, command.args);
	await migrator.destroy();
};
var program = new Command("sql-tools");
program.option("-u, --url <url>", "Database connection url").option("-f, --folder <migrationsFolder>", "Path to the runnable (compiled) migration files", "dist/schema/migrations").option("--source-folder <migrationsSourceFolder>", "Path to the migration source files", "src/schema/migrations");
program.command("query").description("Run an arbitrary query against the database").argument("<query>", "The query to run").action(withMigrator(async (migrator, _, [query]) => console.log(await sql.raw(query).execute(migrator.getDatabase()))));
var migrations = program.command("migrations").description("Commands to handle schema migration").argument("[command]");
migrations.command("run").description("Run all migrations").action(withMigrator((migrator) => migrator.runMigrations()));
migrations.command("revert").description("Revert the most recent migration").action(withMigrator((migrator, { sourceFolder }) => migrator.revert(join(process.cwd(), sourceFolder))));
migrations.command("create").description("Create a new, barebones migration file").argument("[path]", "Optional path where the migration file should be written to. Defaults to `src/Migration`", "src/Migration").action(withMigrator((migrator, _, [path]) => migrator.create(join(process.cwd(), path ?? "src/Migration"), [], [])));
migrations.command("sync-order").description(`Regenerate the ${ORDER_FILENAME} file from the migration files on disk`).action((_, command) => {
	const folder = resolve(process.cwd(), command.optsWithGlobals().sourceFolder);
	const { changed, next } = syncOrder(folder);
	console.log(changed ? `Wrote ${join(folder, ORDER_FILENAME)} (${next.length} migrations)` : `${ORDER_FILENAME} is already up to date (${next.length} migrations)`);
});
migrations.command("verify-order").description(`Verify the ${ORDER_FILENAME} file matches the migration files on disk`).option("--append-only-from <path>", `Baseline ${ORDER_FILENAME} file that must be a prefix of the current one`).action((options, command) => {
	const folder = resolve(process.cwd(), command.optsWithGlobals().sourceFolder);
	const appendOnlyFrom = options.appendOnlyFrom ? parseOrder(readFileSync(options.appendOnlyFrom, "utf8")) : void 0;
	const errors = verifyOrder(folder, { appendOnlyFrom });
	if (errors.length > 0) throw new Error(errors.map((error) => `- ${error}`).join("\n"));
	console.log(`${ORDER_FILENAME} is consistent (${readOrder(folder)?.length ?? 0} migrations)`);
});
migrations.command("generate").description("Generate a new migration file that contains the UP and DOWN queries to migrate the schema").option("--debug", "Generate the migration file with extra comments", false).option("-s, --schemaDist <path>", "Path to the built schema files", "dist/schema").argument("[path]", "Optional path where the migration file should be written to. Defaults to `src/Migration`", "src/Migration").action(withMigrator((migrator, { debug, schemaDist }, [path]) => migrator.generate({
	dist: join(process.cwd(), schemaDist),
	targetPath: join(process.cwd(), path ?? "src/Migration"),
	withComments: debug
})));
program.parseAsync().then(() => {
	process.exit(0);
}).catch((error) => {
	console.error(error);
	console.log("Something went wrong");
	process.exit(1);
});
//#endregion
export {};
