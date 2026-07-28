import { Kysely, sql } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import { createPostgres } from 'src/connections/postgres-connection';
import { DatabaseConnectionParams } from 'src/types';
import { GenericContainer, Wait } from 'testcontainers';

const globalSetup = async () => {
  const templateName = 'template';
  const postgresContainer = await new GenericContainer('postgres:14')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_USER: 'postgres',
      POSTGRES_DB: templateName,
    })
    .withCommand([
      'postgres',
      '-c',
      'max_wal_size=2GB',
      '-c',
      'shared_buffers=512MB',
      '-c',
      'fsync=off',
      '-c',
      'full_page_writes=off',
      '-c',
      'synchronous_commit=off',
    ])
    .withWaitStrategy(Wait.forAll([Wait.forLogMessage('database system is ready to accept connections', 2)]))
    .start();

  const postgresPort = postgresContainer.getMappedPort(5432);
  const postgresUrl = `postgres://postgres:postgres@localhost:${postgresPort}/${templateName}`;
  const connection = { connectionType: 'url', url: postgresUrl } as DatabaseConnectionParams;
  const kysely = new Kysely<unknown>({ dialect: new PostgresJSDialect({ postgres: createPostgres({ connection }) }) });

  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`.execute(kysely);

  await kysely.destroy();

  process.env.IMMICH_TEST_POSTGRES_URL = postgresUrl;

  return async () => {
    await postgresContainer.stop();
  };
};

export default globalSetup;
