import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQueryEngine } from '../src/engine.js';
import type { TableConnection } from '../src/engine.js';

function mockConnection(data: Record<string, unknown>[][] = [[]]): TableConnection {
  let callIndex = 0;
  return {
    run: vi.fn().mockResolvedValue(undefined),
    runAndRead: vi.fn().mockImplementation(() => {
      const result = data[Math.min(callIndex, data.length - 1)];
      callIndex++;
      return Promise.resolve(result);
    }),
    runAndReadParquetBlob: vi.fn().mockResolvedValue(new Blob(['mock'])),
  };
}

describe('QueryEngine', () => {
  describe('query', () => {
    it('passes SQL to connection and returns rows', async () => {
      const rows = [{ id: 1, name: 'test' }];
      const conn = mockConnection([rows]);
      const engine = createQueryEngine(conn);

      const result = await engine.query('SELECT * FROM trades');
      expect(result).toEqual(rows);
      expect(conn.runAndRead).toHaveBeenCalledWith('SELECT * FROM trades');
    });
  });

  describe('execute', () => {
    it('calls run without returning data', async () => {
      const conn = mockConnection();
      const engine = createQueryEngine(conn);

      await engine.execute('CREATE TABLE t (id INT)');
      expect(conn.run).toHaveBeenCalledWith('CREATE TABLE t (id INT)');
    });
  });

  describe('columns', () => {
    it('queries information_schema and maps types', async () => {
      const schemaRows = [
        { column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' },
        { column_name: 'name', data_type: 'VARCHAR', is_nullable: 'YES' },
        { column_name: 'price', data_type: 'DOUBLE', is_nullable: 'YES' },
        { column_name: 'active', data_type: 'BOOLEAN', is_nullable: 'NO' },
        { column_name: 'created', data_type: 'TIMESTAMP', is_nullable: 'YES' },
        { column_name: 'birth', data_type: 'DATE', is_nullable: 'YES' },
        { column_name: 'big', data_type: 'BIGINT', is_nullable: 'NO' },
        { column_name: 'data', data_type: 'BLOB', is_nullable: 'YES' },
        { column_name: 'tags', data_type: 'LIST', is_nullable: 'YES' },
        { column_name: 'meta', data_type: 'STRUCT', is_nullable: 'YES' },
        { column_name: 'status', data_type: 'ENUM', is_nullable: 'NO' },
        { column_name: 'other', data_type: 'CUSTOM_TYPE', is_nullable: 'YES' },
      ];
      const conn = mockConnection([schemaRows]);
      const engine = createQueryEngine(conn);

      const cols = await engine.columns('trades');
      expect(cols).toHaveLength(12);
      expect(cols[0]).toEqual({ name: 'id', type: 'INTEGER', mappedType: 'number', nullable: false });
      expect(cols[1]).toEqual({ name: 'name', type: 'VARCHAR', mappedType: 'string', nullable: true });
      expect(cols[2]).toEqual({ name: 'price', type: 'DOUBLE', mappedType: 'number', nullable: true });
      expect(cols[3]).toEqual({ name: 'active', type: 'BOOLEAN', mappedType: 'boolean', nullable: false });
      expect(cols[4]).toEqual({ name: 'created', type: 'TIMESTAMP', mappedType: 'timestamp', nullable: true });
      expect(cols[5]).toEqual({ name: 'birth', type: 'DATE', mappedType: 'date', nullable: true });
      expect(cols[6]).toEqual({ name: 'big', type: 'BIGINT', mappedType: 'bigint', nullable: false });
      expect(cols[7]).toEqual({ name: 'data', type: 'BLOB', mappedType: 'blob', nullable: true });
      expect(cols[8]).toEqual({ name: 'tags', type: 'LIST', mappedType: 'list', nullable: true });
      expect(cols[9]).toEqual({ name: 'meta', type: 'STRUCT', mappedType: 'struct', nullable: true });
      expect(cols[10]).toEqual({ name: 'status', type: 'ENUM', mappedType: 'enum', nullable: false });
      expect(cols[11]).toEqual({ name: 'other', type: 'CUSTOM_TYPE', mappedType: 'unknown', nullable: true });
    });

    it('escapes table name in query', async () => {
      const conn = mockConnection([[]]);
      const engine = createQueryEngine(conn);

      await engine.columns("my'table");
      expect(conn.runAndRead).toHaveBeenCalledWith(
        expect.stringContaining("my''table")
      );
    });
  });

  describe('count', () => {
    it('counts all rows', async () => {
      const conn = mockConnection([[{ cnt: 42 }]]);
      const engine = createQueryEngine(conn);

      const result = await engine.count('trades');
      expect(result).toBe(42);
      expect(conn.runAndRead).toHaveBeenCalledWith('SELECT COUNT(*) AS cnt FROM "trades"');
    });

    it('counts with where clause', async () => {
      const conn = mockConnection([[{ cnt: 10 }]]);
      const engine = createQueryEngine(conn);

      const result = await engine.count('trades', '"region" = \'EMEA\'');
      expect(result).toBe(10);
      expect(conn.runAndRead).toHaveBeenCalledWith(
        'SELECT COUNT(*) AS cnt FROM "trades" WHERE "region" = \'EMEA\''
      );
    });

    it('returns 0 for empty result', async () => {
      const conn = mockConnection([[{}]]);
      const engine = createQueryEngine(conn);

      const result = await engine.count('trades');
      expect(result).toBe(0);
    });
  });

  describe('distinct', () => {
    it('returns distinct values', async () => {
      const conn = mockConnection([[{ val: 'EMEA' }, { val: 'US' }, { val: 'APAC' }]]);
      const engine = createQueryEngine(conn);

      const result = await engine.distinct('trades', 'region');
      expect(result).toEqual(['EMEA', 'US', 'APAC']);
    });

    it('respects limit', async () => {
      const conn = mockConnection([[{ val: 'A' }]]);
      const engine = createQueryEngine(conn);

      await engine.distinct('trades', 'region', 10);
      expect(conn.runAndRead).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 10')
      );
    });

    it('defaults to limit 50', async () => {
      const conn = mockConnection([[{ val: 'A' }]]);
      const engine = createQueryEngine(conn);

      await engine.distinct('trades', 'region');
      expect(conn.runAndRead).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 50')
      );
    });
  });

  describe('exportBlob', () => {
    it('calls runAndReadParquetBlob with COPY', async () => {
      const conn = mockConnection();
      const engine = createQueryEngine(conn);

      await engine.exportBlob('trades', 'csv');
      expect(conn.runAndReadParquetBlob).toHaveBeenCalledWith(
        expect.stringContaining('FORMAT csv')
      );
    });
  });
});
