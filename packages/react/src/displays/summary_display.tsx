import { useMemo, useState, useEffect, useCallback } from 'react';
import { summaryDisplayType, isIdentityColumn } from '@unify/table-core';
import type { SummaryDisplayConfig, CardSize } from '@unify/table-core';
import type { DisplayDescriptor, DisplayRenderProps, DisplayConfigProps } from './types.js';
import { useDisplayData } from './useDisplayData.js';
import type { QueryEngine } from '@unify/table-core';
import { ScanSearch } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNum(v: unknown): string {
  if (v === null || v === undefined || v === '') return '-';
  const num = Number(v);
  if (isNaN(num)) return String(v);
  const abs = Math.abs(num);
  if (abs >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function pctBar(pct: number, color: string, height: number): React.ReactNode {
  return (
    <div style={{ height, borderRadius: height / 2, background: 'var(--utbl-border)', width: '100%' }}>
      <div style={{ height: '100%', borderRadius: height / 2, background: color, width: `${Math.min(pct, 100)}%`, transition: 'width 0.2s' }} />
    </div>
  );
}

const isNumericType = (t: string) => {
  const upper = t.toUpperCase();
  return upper.includes('INT') || upper.includes('FLOAT') || upper.includes('DOUBLE') ||
    upper.includes('DECIMAL') || upper.includes('NUMERIC') || upper.includes('BIGINT') ||
    upper.includes('HUGEINT');
};

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

interface SummarySizes {
  gridMin: string;
  padding: number;
  gap: number;
  borderRadius: number;
  headerFont: string;
  badgeFont: string;
  statsFont: string;
  detailFont: string;
  nullBarHeight: number;
  quartileBarHeight: number;
  histogramHeight: number;
  containerGap: number;
  hideQuartileBar: boolean;
}

const SUMMARY_SIZES: Record<CardSize, SummarySizes> = {
  sm: {
    gridMin: '200px',
    padding: 10,
    gap: 6,
    borderRadius: 6,
    headerFont: '0.65rem',
    badgeFont: '0.5rem',
    statsFont: '0.55rem',
    detailFont: '0.55rem',
    nullBarHeight: 3,
    quartileBarHeight: 4,
    histogramHeight: 24,
    containerGap: 8,
    hideQuartileBar: true,
  },
  md: {
    gridMin: '280px',
    padding: 14,
    gap: 8,
    borderRadius: 8,
    headerFont: '0.75rem',
    badgeFont: '0.55rem',
    statsFont: '0.625rem',
    detailFont: '0.6rem',
    nullBarHeight: 4,
    quartileBarHeight: 6,
    histogramHeight: 32,
    containerGap: 12,
    hideQuartileBar: false,
  },
  lg: {
    gridMin: '360px',
    padding: 20,
    gap: 12,
    borderRadius: 10,
    headerFont: '0.85rem',
    badgeFont: '0.6rem',
    statsFont: '0.7rem',
    detailFont: '0.7rem',
    nullBarHeight: 6,
    quartileBarHeight: 8,
    histogramHeight: 48,
    containerGap: 16,
    hideQuartileBar: false,
  },
};

// ---------------------------------------------------------------------------
// Histogram hook (lazy per-card)
// ---------------------------------------------------------------------------

interface DistData { label: string; count: number }

function useDistribution(
  engine: QueryEngine,
  viewName: string,
  colName: string,
  colType: string,
  bins: number,
  enabled: boolean,
): { data: DistData[]; loading: boolean } {
  const [data, setData] = useState<DistData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!enabled || !colName) return;
    setLoading(true);
    try {
      const qCol = `"${colName.replace(/"/g, '""')}"`;
      const qView = `"${viewName.replace(/"/g, '""')}"`;
      let sql: string;

      if (isNumericType(colType)) {
        sql =
          `WITH bounds AS (SELECT MIN(${qCol}) AS lo, MAX(${qCol}) AS hi FROM ${qView} WHERE ${qCol} IS NOT NULL), ` +
          `binned AS (SELECT width_bucket(${qCol}::DOUBLE, lo::DOUBLE, hi::DOUBLE + 1, ${bins}) AS bucket, COUNT(*) AS cnt ` +
          `FROM ${qView}, bounds WHERE ${qCol} IS NOT NULL GROUP BY bucket ORDER BY bucket) ` +
          `SELECT bucket AS label, cnt AS count FROM binned`;
      } else {
        sql = `SELECT ${qCol} AS label, COUNT(*) AS count FROM ${qView} WHERE ${qCol} IS NOT NULL GROUP BY ${qCol} ORDER BY count DESC LIMIT 10`;
      }

      const rows = await engine.query<{ label: unknown; count: unknown }>(sql);
      setData(rows.map((r) => ({ label: String(r.label ?? ''), count: Number(r.count ?? 0) })));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [engine, viewName, colName, colType, bins, enabled]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------

interface SummaryRow {
  column_name: string;
  column_type: string;
  min: unknown;
  max: unknown;
  approx_unique: unknown;
  avg: unknown;
  std: unknown;
  q25: unknown;
  q50: unknown;
  q75: unknown;
  count: unknown;
  null_percentage: unknown;
}

function SummaryCard({
  row,
  engine,
  viewName,
  bins,
  showDist,
  sizes,
}: {
  row: SummaryRow;
  engine: QueryEngine;
  viewName: string;
  bins: number;
  showDist: boolean;
  sizes: SummarySizes;
}) {
  const numeric = isNumericType(row.column_type);
  const nullPct = Number(row.null_percentage ?? 0);
  const { data: dist } = useDistribution(engine, viewName, row.column_name, row.column_type, bins, showDist);
  const maxCount = Math.max(...dist.map((d) => d.count), 1);

  return (
    <div style={{
      padding: sizes.padding,
      background: 'var(--utbl-surface-alt)',
      borderRadius: sizes.borderRadius,
      border: '1px solid var(--utbl-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: sizes.gap,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: sizes.headerFont, color: 'var(--utbl-text)' }}>
          {row.column_name}
        </span>
        <span style={{
          fontSize: sizes.badgeFont,
          padding: '1px 5px',
          borderRadius: 3,
          background: 'color-mix(in srgb, var(--utbl-accent) 15%, transparent)',
          color: 'var(--utbl-accent)',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {row.column_type}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, fontSize: sizes.statsFont, color: 'var(--utbl-text-secondary)' }}>
        <span>Count <strong style={{ color: 'var(--utbl-text)' }}>{formatNum(row.count)}</strong></span>
        <span>Unique <strong style={{ color: 'var(--utbl-text)' }}>{formatNum(row.approx_unique)}</strong></span>
        <span>Nulls <strong style={{ color: nullPct > 50 ? '#ef4444' : 'var(--utbl-text)' }}>{nullPct.toFixed(1)}%</strong></span>
      </div>

      {/* Null bar */}
      {pctBar(nullPct, nullPct > 50 ? '#ef4444' : 'var(--utbl-accent)', sizes.nullBarHeight)}

      {/* Min / Max */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: sizes.detailFont, color: 'var(--utbl-text-muted)' }}>
        <span>min: <strong style={{ color: 'var(--utbl-text)' }}>{formatNum(row.min)}</strong></span>
        <span>max: <strong style={{ color: 'var(--utbl-text)' }}>{formatNum(row.max)}</strong></span>
      </div>

      {/* Numeric extras */}
      {numeric && (
        <div style={{ display: 'flex', gap: 10, fontSize: sizes.detailFont, color: 'var(--utbl-text-muted)', flexWrap: 'wrap' }}>
          <span>avg: <strong style={{ color: 'var(--utbl-text)' }}>{formatNum(row.avg)}</strong></span>
          <span>med: <strong style={{ color: 'var(--utbl-text)' }}>{formatNum(row.q50)}</strong></span>
          <span>std: <strong style={{ color: 'var(--utbl-text)' }}>{formatNum(row.std)}</strong></span>
        </div>
      )}

      {/* Quartile bar for numerics */}
      {numeric && !sizes.hideQuartileBar && row.q25 != null && row.q75 != null && (
        <div style={{ position: 'relative', height: sizes.quartileBarHeight, borderRadius: sizes.quartileBarHeight / 2, background: 'var(--utbl-border)' }}>
          <div style={{
            position: 'absolute',
            left: '25%',
            width: '50%',
            height: '100%',
            borderRadius: sizes.quartileBarHeight / 2,
            background: 'var(--utbl-accent)',
            opacity: 0.4,
          }} />
          <div style={{
            position: 'absolute',
            left: '50%',
            width: 2,
            height: '100%',
            background: 'var(--utbl-accent)',
            transform: 'translateX(-1px)',
          }} />
        </div>
      )}

      {/* Distribution */}
      {showDist && dist.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: sizes.histogramHeight, marginTop: 2 }}>
          {dist.map((d, i) => (
            <div
              key={i}
              title={`${d.label}: ${d.count}`}
              style={{
                flex: 1,
                height: `${Math.max((d.count / maxCount) * 100, 2)}%`,
                background: 'var(--utbl-accent)',
                borderRadius: '2px 2px 0 0',
                opacity: 0.7,
                minWidth: 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function SummaryRender({ config, sql, engine, viewName }: DisplayRenderProps<SummaryDisplayConfig>) {
  const { rows, isLoading, error } = useDisplayData(sql, engine);
  const sizes = SUMMARY_SIZES[config.cardSize ?? 'md'];

  const filtered = useMemo(() => {
    const exclude = new Set(config.excludeColumns);
    return (rows as unknown as SummaryRow[]).filter((r) => !exclude.has(r.column_name));
  }, [rows, config.excludeColumns]);

  if (error) return <div className="utbl-display-error">{error.message}</div>;
  if (isLoading && rows.length === 0) return <div className="utbl-display-loading">Loading summary...</div>;
  if (filtered.length === 0) return <div className="utbl-display-loading">No columns to profile</div>;

  const layout = config.layout ?? 'grid';

  return (
    <div style={{
      flex: 1,
      overflow: 'auto',
      padding: 12,
      display: layout === 'grid' ? 'grid' : 'flex',
      flexDirection: layout === 'list' ? 'column' : undefined,
      gridTemplateColumns: layout === 'grid' ? `repeat(auto-fill, minmax(${sizes.gridMin}, 1fr))` : undefined,
      gap: sizes.containerGap,
    }}>
      {filtered.map((row) => (
        <SummaryCard
          key={row.column_name}
          row={row}
          engine={engine}
          viewName={viewName}
          bins={config.histogramBins ?? 20}
          showDist={config.showDistributions}
          sizes={sizes}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config panel
// ---------------------------------------------------------------------------

function SummaryConfig({ config, onChange, columns }: DisplayConfigProps<SummaryDisplayConfig>) {
  const currentLayout = config.layout ?? 'grid';
  const currentSize = config.cardSize ?? 'md';
  const excluded = new Set(config.excludeColumns);

  function toggleExclude(name: string) {
    const next = excluded.has(name)
      ? config.excludeColumns.filter((c) => c !== name)
      : [...config.excludeColumns, name];
    onChange({ ...config, excludeColumns: next });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.75rem' }}>
      <div className="utbl-segmented">
        <button className="utbl-segmented-btn" data-active={currentLayout === 'grid'} onClick={() => onChange({ ...config, layout: 'grid' })}>Grid</button>
        <button className="utbl-segmented-btn" data-active={currentLayout === 'list'} onClick={() => onChange({ ...config, layout: 'list' })}>List</button>
      </div>

      {/* Card size toggle */}
      <div className="utbl-segmented">
        <button className="utbl-segmented-btn" data-active={currentSize === 'sm'} onClick={() => onChange({ ...config, cardSize: 'sm' })}>S</button>
        <button className="utbl-segmented-btn" data-active={currentSize === 'md'} onClick={() => onChange({ ...config, cardSize: 'md' })}>M</button>
        <button className="utbl-segmented-btn" data-active={currentSize === 'lg'} onClick={() => onChange({ ...config, cardSize: 'lg' })}>L</button>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--utbl-text)' }}>
        <input type="checkbox" checked={config.showDistributions} onChange={() => onChange({ ...config, showDistributions: !config.showDistributions })} />
        Show Distributions
      </label>

      {config.showDistributions && (
        <div>
          <span className="utbl-field-label">Histogram Bins</span>
          <input
            className="utbl-input"
            type="number"
            min={2}
            max={100}
            value={config.histogramBins}
            onChange={(e) => onChange({ ...config, histogramBins: Number(e.target.value) || 20 })}
            style={{ width: 60 }}
          />
        </div>
      )}

      <div>
        <span className="utbl-field-label">Exclude Columns</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
          {columns.filter((c) => !isIdentityColumn(c.name)).map((c) => (
            <label key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--utbl-text)' }}>
              <input type="checkbox" checked={excluded.has(c.name)} onChange={() => toggleExclude(c.name)} />
              {c.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const summaryDisplay: DisplayDescriptor<SummaryDisplayConfig> = {
  type: summaryDisplayType,
  icon: ScanSearch,
  render: (props) => <SummaryRender {...props} />,
  renderConfig: (props) => <SummaryConfig {...props} />,
};
