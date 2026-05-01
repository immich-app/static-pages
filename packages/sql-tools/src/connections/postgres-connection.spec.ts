import { asPostgresConfig } from 'src/connections/postgres-connection';
import { describe, expect, it } from 'vitest';

describe('database  utils', () => {
  describe('asPostgresConfig', () => {
    it('should handle sslmode=require', () => {
      expect(
        asPostgresConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=require',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=prefer', () => {
      expect(
        asPostgresConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=prefer',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=verify-ca', () => {
      expect(
        asPostgresConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=verify-ca',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=verify-full', () => {
      expect(
        asPostgresConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=verify-full',
        }),
      ).toMatchObject({ ssl: {} });
    });

    it('should handle sslmode=no-verify', () => {
      expect(
        asPostgresConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?sslmode=no-verify',
        }),
      ).toMatchObject({ ssl: { rejectUnauthorized: false } });
    });

    it('should handle ssl=true', () => {
      expect(
        asPostgresConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?ssl=true',
        }),
      ).toMatchObject({ ssl: true });
    });

    it('should reject invalid ssl', () => {
      expect(() =>
        asPostgresConfig({
          connectionType: 'url',
          url: 'postgres://postgres1:postgres2@database1:54320/immich?ssl=invalid',
        }),
      ).toThrowError('Invalid ssl option');
    });

    it('should handle socket: URLs', () => {
      expect(asPostgresConfig({ connectionType: 'url', url: 'socket:/run/postgresql?db=database1' })).toMatchObject({
        host: '/run/postgresql',
        database: 'database1',
      });
    });

    it('should handle sockets in postgres: URLs', () => {
      expect(
        asPostgresConfig({ connectionType: 'url', url: 'postgres:///database2?host=/path/to/socket' }),
      ).toMatchObject({
        host: '/path/to/socket',
        database: 'database2',
      });
    });
  });
});
