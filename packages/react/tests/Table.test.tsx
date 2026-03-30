import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Table } from '../src/components/Table.js';
import type { TableConnection } from '@unify/table-core';

function mockDb(opts: {
  rows?: Record<string, unknown>[];
  columns?: { column_name: string; data_type: string; is_nullable: string }[];
} = {}): TableConnection {
  const rows = opts.rows ?? [
    { id: 1, ticker: 'AAPL', pnl: 100, region: 'US' },
    { id: 2, ticker: 'GOOG', pnl: -50, region: 'EMEA' },
    { id: 3, ticker: 'MSFT', pnl: 200, region: 'US' },
  ];
  const columns = opts.columns ?? [
    { column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' },
    { column_name: 'ticker', data_type: 'VARCHAR', is_nullable: 'NO' },
    { column_name: 'pnl', data_type: 'DOUBLE', is_nullable: 'YES' },
    { column_name: 'region', data_type: 'VARCHAR', is_nullable: 'YES' },
  ];

  return {
    run: vi.fn().mockResolvedValue(undefined),
    runAndRead: vi.fn().mockImplementation((sql: string) => {
      if (sql.includes('information_schema.columns')) return Promise.resolve(columns);
      if (sql.includes('COUNT(*)')) return Promise.resolve([{ cnt: rows.length }]);
      if (sql.includes('DISTINCT')) return Promise.resolve(rows.map((r) => ({ val: r.region })));
      return Promise.resolve(rows);
    }),
    runAndReadParquetBlob: vi.fn().mockResolvedValue(new Blob(['mock'])),
  };
}

describe('Table component', () => {
  it('renders with loading state initially', () => {
    const db = mockDb();
    const { container } = render(<Table db={db} table="trades" />);
    // Should render a container div
    expect(container.firstChild).toBeTruthy();
  });

  it('fetches data from DuckDB on mount', async () => {
    const db = mockDb();
    render(<Table db={db} table="trades" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Verify the db connection was called to fetch data
    // In jsdom, TanStack Virtual may not render rows (no layout engine),
    // but we can verify the data was fetched
    expect(db.runAndRead).toHaveBeenCalled();
    const calls = (db.runAndRead as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0] as string);
    expect(calls.some((sql) => sql.includes('information_schema'))).toBe(true);
    expect(calls.some((sql) => sql.includes('COUNT(*)'))).toBe(true);
    expect(calls.some((sql) => sql.includes('trades'))).toBe(true);
  });

  it('auto-discovers columns from schema', async () => {
    const db = mockDb();
    render(<Table db={db} table="trades" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Column headers are rendered
    const headers = document.querySelectorAll('[role="columnheader"]');
    const headerTexts = Array.from(headers).map((h) => h.textContent?.trim());
    expect(headerTexts).toContain('id');
    expect(headerTexts).toContain('ticker');
    expect(headerTexts).toContain('pnl');
    expect(headerTexts).toContain('region');
  });

  it('uses provided column definitions', async () => {
    const db = mockDb();
    render(
      <Table
        db={db}
        table="trades"
        columns={[
          { field: 'ticker', label: 'Symbol' },
          { field: 'pnl', label: 'P&L' },
        ]}
      />
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByText('Symbol')).toBeInTheDocument();
    expect(screen.getByText('P&L')).toBeInTheDocument();
  });

  it('accepts custom column definitions with render functions', async () => {
    const renderFn = vi.fn((v: unknown) => String(v));
    const db = mockDb();
    render(
      <Table
        db={db}
        table="trades"
        columns={[
          { field: 'ticker' },
          { field: 'pnl', render: renderFn },
        ]}
      />
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // DB was queried for columns
    expect(db.runAndRead).toHaveBeenCalled();
    // Custom columns are defined — check that ticker header exists
    const headers = screen.getAllByRole('columnheader');
    expect(headers.some((h) => h.textContent?.includes('ticker'))).toBe(true);
    expect(headers.some((h) => h.textContent?.includes('pnl'))).toBe(true);
  });

  it('shows row count in footer', async () => {
    const db = mockDb();
    render(<Table db={db} table="trades" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getAllByText('3 rows').length).toBeGreaterThan(0);
  });

  it('shows empty state when no rows', async () => {
    const db = mockDb({
      rows: [],
      columns: [{ column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' }],
    });
    render(<Table db={db} table="trades" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('applies custom className', async () => {
    const db = mockDb();
    const { container } = render(<Table db={db} table="trades" className="my-custom" />);

    expect(container.firstChild).toHaveClass('my-custom');
  });

  it('sorts when header is clicked', async () => {
    const db = mockDb();
    render(<Table db={db} table="trades" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Find the ticker header by role
    const headers = document.querySelectorAll('[role="columnheader"]');
    const tickerHeader = Array.from(headers).find((h) => h.textContent?.includes('ticker'));
    expect(tickerHeader).toBeTruthy();

    await act(async () => {
      tickerHeader!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Should show sort indicator (↑)
    expect(tickerHeader!.textContent).toContain('↑');
  });

  it('density affects font size', async () => {
    const db = mockDb();
    const { container } = render(<Table db={db} table="trades" density="compact" />);

    // Compact density uses 0.75rem font size via inline style
    expect(container.innerHTML).toContain('0.75rem');
  });
});
