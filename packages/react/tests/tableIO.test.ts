import { describe, it, expect, vi } from 'vitest';
import { tableIO } from '../src/plugins/tableIO.js';
import { emptySelection } from '../src/utils.js';
import type { TableContext } from '../src/types.js';

// Mock downloadBlob to avoid DOM operations
vi.mock('../src/utils.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../src/utils.js')>();
  return {
    ...orig,
    downloadBlob: vi.fn(),
  };
});

import { downloadBlob } from '../src/utils.js';

function makeCtx(overrides: Record<string, any> = {}): TableContext {
  const ctx: any = {
    table: 'trades',
    columns: [
      { field: 'id', currentWidth: 80 },
      { field: 'ticker', currentWidth: 120 },
      { field: 'price', currentWidth: 100 },
    ],
    selection: emptySelection(),
    engine: {
      execute: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      exportBlob: vi.fn().mockResolvedValue(new Blob(['mock'])),
      columns: vi.fn().mockResolvedValue([]),
    },
    refresh: vi.fn().mockResolvedValue(undefined),
    getLatest: () => ctx,
    ...overrides,
  };
  return ctx;
}

describe('tableIO plugin', () => {
  it('has correct name', () => {
    expect(tableIO().name).toBe('tableIO');
  });

  it('resets handle on init', () => {
    const plugin = tableIO();
    const ctx = makeCtx();
    // Get a handle
    const handle1 = plugin.getHandle(ctx);
    expect(handle1).toBeDefined();
    // Init resets it
    plugin.init!(ctx);
    // Next getHandle returns a new instance
    const handle2 = plugin.getHandle(ctx);
    expect(handle2).toBeDefined();
  });

  it('returns same handle on repeated getHandle calls', () => {
    const plugin = tableIO();
    const ctx = makeCtx();
    const h1 = plugin.getHandle(ctx);
    const h2 = plugin.getHandle(ctx);
    expect(h1).toBe(h2);
  });

  describe('exportCSV', () => {
    it('exports all rows with default filename', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.exportCSV();
      expect(ctx.engine.exportBlob).toHaveBeenCalledWith('trades', 'csv');
      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'trades.csv');
    });

    it('exports with custom filename', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.exportCSV({ filename: 'custom.csv' });
      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'custom.csv');
    });

    it('exports selection only when selection flag is set', async () => {
      const ctx = makeCtx({
        selection: {
          ...emptySelection(),
          selectedIds: new Set(['1', '2']),
          count: 2,
        },
      });
      const handle = tableIO().getHandle(ctx);
      await handle.exportCSV({ selection: true });

      // Should create temp table with selection filter
      const executeCalls = (ctx.engine.execute as any).mock.calls;
      const createSql = executeCalls[0][0] as string;
      expect(createSql).toContain('CREATE TEMP TABLE');
      expect(createSql).toContain('IN (1,2)');

      // Should drop temp table after export
      const dropSql = executeCalls[1][0] as string;
      expect(dropSql).toContain('DROP TABLE IF EXISTS');
    });

    it('escapes string IDs in selection export', async () => {
      const ctx = makeCtx({
        selection: {
          ...emptySelection(),
          selectedIds: new Set(["it's", 'normal']),
          count: 2,
        },
      });
      const handle = tableIO().getHandle(ctx);
      await handle.exportCSV({ selection: true });

      const createSql = (ctx.engine.execute as any).mock.calls[0][0] as string;
      expect(createSql).toContain("'it''s'");
      expect(createSql).toContain("'normal'");
    });

    it('falls back to full export when selection flag is set but no selection', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.exportCSV({ selection: true });
      // No temp table — direct export
      expect(ctx.engine.execute).not.toHaveBeenCalled();
      expect(ctx.engine.exportBlob).toHaveBeenCalledWith('trades', 'csv');
    });
  });

  describe('exportJSON', () => {
    it('exports with default filename', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.exportJSON();
      expect(ctx.engine.exportBlob).toHaveBeenCalledWith('trades', 'json');
      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'trades.json');
    });
  });

  describe('exportParquet', () => {
    it('exports with default filename', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.exportParquet();
      expect(ctx.engine.exportBlob).toHaveBeenCalledWith('trades', 'parquet');
      expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'trades.parquet');
    });
  });

  describe('importFile', () => {
    function makeFile(name: string, content = 'a,b\n1,2'): File {
      const file = new File([content], name, { type: 'text/plain' });
      // jsdom File doesn't implement arrayBuffer — polyfill it
      if (!file.arrayBuffer) {
        file.arrayBuffer = () =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.readAsArrayBuffer(file);
          });
      }
      return file;
    }

    it('imports CSV file with CREATE OR REPLACE TABLE', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.importFile(makeFile('data.csv'));

      const sql = (ctx.engine.execute as any).mock.calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('read_csv_auto'),
      );
      expect(sql).toBeDefined();
      expect(sql[0]).toContain('CREATE OR REPLACE TABLE');
      expect(ctx.refresh).toHaveBeenCalled();
    });

    it('imports CSV with append mode using INSERT INTO', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.importFile(makeFile('data.csv'), { append: true });

      const calls = (ctx.engine.execute as any).mock.calls;
      const insertCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('INSERT INTO'),
      );
      expect(insertCall).toBeDefined();
    });

    it('imports JSON file', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.importFile(makeFile('data.json', '[]'));

      const calls = (ctx.engine.execute as any).mock.calls;
      const jsonCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('read_json_auto'),
      );
      expect(jsonCall).toBeDefined();
    });

    it('imports Parquet file', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.importFile(makeFile('data.parquet', ''));

      const calls = (ctx.engine.execute as any).mock.calls;
      const parquetCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('read_parquet'),
      );
      expect(parquetCall).toBeDefined();
    });

    it('uses custom table name when provided', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.importFile(makeFile('data.csv'), { tableName: 'my_table' });

      const calls = (ctx.engine.execute as any).mock.calls;
      const createCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('"my_table"'),
      );
      expect(createCall).toBeDefined();
    });

    it('sanitizes filename for table name', async () => {
      const ctx = makeCtx();
      const handle = tableIO().getHandle(ctx);
      await handle.importFile(makeFile('my-data file.csv'));

      // "my-data file" becomes "my_data_file" (non-alphanumeric replaced with _)
      const calls = (ctx.engine.execute as any).mock.calls;
      const createCall = calls.find(
        (c: any[]) => typeof c[0] === 'string' && c[0].includes('"my_data_file"'),
      );
      expect(createCall).toBeDefined();
    });
  });
});
