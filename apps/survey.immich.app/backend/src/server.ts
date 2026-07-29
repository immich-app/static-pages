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
import { verifySessionToken } from './utils/session';
import { getCookie } from './cookie';
import { SESSION_COOKIE_NAME, ROLE_HIERARCHY } from './constants';

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

  const migrationsDir = join(__dirname, '..', 'migrations');
  try {
    await runMigrations(db, migrationsDir);
  } catch (e) {
    console.error('Migration error:', e);
  }

  const ctx: AppContext = { db, config };

  const { createRouter } = await import('./index');
  const router = createRouter(ctx);

  const app = new Hono();

  const staticDir = process.env.STATIC_DIR;
  if (staticDir) {
    app.use('/*', serveStatic({ root: staticDir }));
  }

  app.all('/api/*', async (c) => {
    const response = await router.fetch(c.req.raw);
    return new Response(response.body, response);
  });

  if (staticDir) {
    app.get('*', serveStatic({ root: staticDir, path: 'index.html' }));
  }

  const port = Number(process.env.PORT ?? 3000);
  console.log(`Survey server starting on port ${port}`);
  console.log(`Database: ${dbType} (${process.env.DATABASE_URL ?? 'default SQLite'})`);

  const server = serve({ fetch: app.fetch, port });
  console.log(`Server ready at http://localhost:${port}`);

  const wss = new WebSocketServer({ noServer: true });

  (server as import('node:http').Server).on('upgrade', (req, socket, head) => {
    void (async () => {
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

      if (type === 'viewer') {
        const cookieHeader = req.headers.cookie ?? '';
        const token = getCookie({ headers: { get: () => cookieHeader } }, SESSION_COOKIE_NAME);
        const user = token ? await verifySessionToken(token, config.sessionSecret) : null;
        if (!user || (ROLE_HIERARCHY[user.role] ?? 0) < ROLE_HIERARCHY.viewer) {
          socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
          socket.destroy();
          return;
        }
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        handlePresenceUpgrade(ws as any, slug, type);
      });
    })();
  });
}

main().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
