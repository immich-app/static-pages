import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kysely } from 'kysely';
import { WebSocketServer } from 'ws';
import { configFromProcessEnv, type AppContext } from './config';
import { detectDbType, type Database, type DbConfig } from './db';
import { runMigrations } from './migrator';
import { handlePresenceUpgrade } from './services/in-memory-presence';

async function createDatabase(dbConfig: DbConfig): Promise<Kysely<Database>> {
  if (dbConfig.type === 'sqlite') {
    const BetterSqlite3 = (await import('better-sqlite3')).default;
    const { SqliteDialect } = await import('kysely');
    return new Kysely<Database>({
      dialect: new SqliteDialect({ database: new BetterSqlite3(dbConfig.url ?? ':memory:') }),
    });
  }
  if (dbConfig.type === 'postgres') {
    const { Pool } = await import('pg');
    const { PostgresDialect } = await import('kysely');
    return new Kysely<Database>({
      dialect: new PostgresDialect({ pool: new Pool({ connectionString: dbConfig.url }) }),
    });
  }
  throw new Error(`Unsupported database type for self-hosted mode: ${dbConfig.type}`);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const config = configFromProcessEnv();

  const dbType = detectDbType(process.env.DATABASE_URL);
  const db = await createDatabase({
    type: dbType,
    url: process.env.DATABASE_URL ?? join(process.cwd(), 'data', 'survey.db'),
  });

  // Run migrations
  const migrationsDir = join(__dirname, '..', 'migrations');
  try {
    await runMigrations(db, migrationsDir);
  } catch (e) {
    console.error('Migration error:', e);
  }

  const ctx: AppContext = { db, config };

  // Import the router builder (the refactored index.ts exports a function that creates the router)
  const { createRouter } = await import('./index');
  const router = createRouter(ctx);

  const app = new Hono();

  // Serve static frontend if STATIC_DIR is set
  const staticDir = process.env.STATIC_DIR;
  if (staticDir) {
    app.use('/*', serveStatic({ root: staticDir }));
  }

  // Delegate API requests to itty-router
  app.all('/api/*', async (c) => {
    const response = await router.fetch(c.req.raw);
    return response;
  });

  // SPA fallback
  if (staticDir) {
    app.get('*', serveStatic({ root: staticDir, path: 'index.html' }));
  }

  const port = Number(process.env.PORT ?? 3000);
  console.log(`Survey server starting on port ${port}`);
  console.log(`Database: ${dbType} (${process.env.DATABASE_URL ?? 'default SQLite'})`);

  const server = serve({ fetch: app.fetch, port });
  console.log(`Server ready at http://localhost:${port}`);

  // WebSocket server for live presence tracking
  const wss = new WebSocketServer({ noServer: true });

  (server as import('node:http').Server).on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', `http://localhost:${port}`);
    const wsMatch = url.pathname.match(/^\/api\/s\/([^/]+)\/ws$/);
    if (!wsMatch) {
      socket.destroy();
      return;
    }

    const slug = wsMatch[1];
    const type = url.searchParams.get('type');
    if (type !== 'viewer' && type !== 'respondent') {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      handlePresenceUpgrade(ws as any, slug, type);
    });
  });
}

main().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
