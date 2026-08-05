# SQL Tools

Kysely-based tools and utilities for managing postgres schema.

## Install

```bash
npm i @immich/sql-tools
```

## Migration order file

If an `ORDER` file exists in the migration folder, `migrations create`, `migrations generate`, and `migrations revert` keep it in sync: one migration name per line, in the (sorted) order the migrator will run them. The file gives concurrent migration PRs a merge conflict instead of silently landing out of order, and gives CI something cheap to verify. Every file in the folder except `ORDER` itself is treated as a migration — stray files will fail verification, deliberately.

```bash
# create or refresh the file (defaults to src/schema/migrations, override with --source-folder)
sql-tools migrations sync-order

# verify it matches the migration files on disk
sql-tools migrations verify-order

# additionally verify no entries were inserted or removed relative to a baseline (e.g. the merge base in CI)
sql-tools migrations verify-order --append-only-from /tmp/base-order
```

Repositories that don't have an `ORDER` file are unaffected.
