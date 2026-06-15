import { parse } from 'pg-connection-string';
import postgres from 'postgres';
import { DatabaseConnectionParams, DatabasePostgresOptions, DatabaseSslMode, PostgresSsl } from 'src/types';

export const isPostgresSsl = (ssl?: string | boolean | object): ssl is PostgresSsl =>
  typeof ssl !== 'string' || ssl === 'require' || ssl === 'allow' || ssl === 'prefer' || ssl === 'verify-full';

export const asPostgresConfig = (params: DatabaseConnectionParams) => {
  if (params.connectionType === 'parts') {
    return {
      host: params.host,
      port: params.port,
      username: params.username,
      password: params.password,
      database: params.database,
      ssl: params.ssl === DatabaseSslMode.Disable ? false : params.ssl,
    };
  }

  const { host, port, user, password, database, ssl } = parse(params.url);

  if (ssl !== undefined && !isPostgresSsl(ssl)) {
    throw new Error(`Invalid ssl option: ${ssl}`);
  }

  return {
    host: host ?? undefined,
    port: port ? Number(port) : undefined,
    username: user,
    password,
    database: database ?? undefined,
    ssl,
  };
};

export const createPostgres = (options: DatabasePostgresOptions = {}) => {
  const {
    connection = { connectionType: 'url', url: 'postgres://postgres:postgres@localhost:5432/postgres' },
    maxConnections = 10,
    timeZone = 'UTC',
    convertToJsDate = true,
    convertBigIntToNumber = true,
    onNotice,
    onClose,
  } = options;

  const config = asPostgresConfig(connection);

  const types: Record<string, postgres.PostgresType> = {};

  if (convertToJsDate) {
    types.date = {
      to: 1184,
      from: [1082, 1114, 1184],
      serialize: (x: Date | string) => (x instanceof Date ? x.toISOString() : x),
      parse: (x: string) => new Date(x),
    };
  }

  if (convertBigIntToNumber) {
    types.bigint = {
      to: 20,
      from: [20, 1700],
      parse: (value: string) => Number.parseInt(value),
      serialize: (value: number) => value.toString(),
    };
  }

  return postgres({
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
    max: maxConnections,
    connection: {
      TimeZone: timeZone,
    },
    types,
    onnotice: onNotice,
    onclose: onClose,
  });
};
