import { statsDisplayType, isIdentityColumn } from '@unify/table-core';
import type { StatsDisplayConfig, StatField, StatAgg, CardSize } from '@unify/table-core';
import type { DisplayDescriptor, DisplayRenderProps, DisplayConfigProps } from './types.js';
import { useDisplayData } from './useDisplayData.js';
import { BarChart3 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Value formatting
// ---------------------------------------------------------------------------

function formatCompact(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatStatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (isNaN(num)) return String(value);

  if (format === 'currency') return `$${formatCompact(num)}`;
  if (format === 'percent') return `${(num * 100).toFixed(1)}%`;
  if (format === 'compact') return formatCompact(num);

  // Auto-compact large numbers
  return formatCompact(num);
}

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

interface StatSizes {
  padding: string;
  gap: number;
  borderRadius: number;
  flexBasis: string;
  iconBox: number;
  iconSize: number;
  iconRadius: number;
  labelFont: string;
  valueFont: string;
  secFont: string;
  secGap: string;
  secPadTop: number;
  containerGap: number;
}

const STAT_SIZES: Record<CardSize, StatSizes> = {
  sm: {
    padding: '10px 14px',
    gap: 6,
    borderRadius: 8,
    flexBasis: '150px',
    iconBox: 22,
    iconSize: 11,
    iconRadius: 5,
    labelFont: '0.6rem',
    valueFont: '1.25rem',
    secFont: '0.6rem',
    secGap: '3px 12px',
    secPadTop: 6,
    containerGap: 8,
  },
  md: {
    padding: '16px 20px',
    gap: 10,
    borderRadius: 10,
    flexBasis: '200px',
    iconBox: 28,
    iconSize: 14,
    iconRadius: 7,
    labelFont: '0.7rem',
    valueFont: '1.75rem',
    secFont: '0.65rem',
    secGap: '4px 16px',
    secPadTop: 8,
    containerGap: 12,
  },
  lg: {
    padding: '24px 28px',
    gap: 14,
    borderRadius: 12,
    flexBasis: '280px',
    iconBox: 36,
    iconSize: 18,
    iconRadius: 9,
    labelFont: '0.8rem',
    valueFont: '2.25rem',
    secFont: '0.75rem',
    secGap: '6px 20px',
    secPadTop: 10,
    containerGap: 16,
  },
};

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const AGG_LABELS: Record<string, string> = {
  count: 'Count',
  sum: 'Sum',
  avg: 'Average',
  min: 'Min',
  max: 'Max',
  median: 'Median',
  stddev: 'Std Dev',
  count_distinct: 'Distinct',
};

function StatsRender({ config, sql, engine }: DisplayRenderProps<StatsDisplayConfig>) {
  const { rows, isLoading, error } = useDisplayData(sql, engine);
  const row = rows[0] ?? {};

  if (error) return <div className="utbl-display-error">{error.message}</div>;
  if (isLoading && rows.length === 0) return <div className="utbl-display-loading">Loading stats...</div>;

  const layout = config.layout ?? 'column';
  const sizes = STAT_SIZES[config.cardSize ?? 'md'];

  return (
    <div style={{
      display: 'flex',
      flexDirection: layout === 'column' ? 'column' : 'row',
      flexWrap: layout === 'row' ? 'wrap' : undefined,
      gap: sizes.containerGap,
      flex: 1,
    }}>
      {config.fields.map((field) => (
        <StatCard key={field.field} field={field} row={row} layout={layout} sizes={sizes} />
      ))}
    </div>
  );
}

function StatCard({ field, row, layout, sizes }: { field: StatField; row: Record<string, unknown>; layout: string; sizes: StatSizes }) {
  const primary = field.highlight === 'primary';

  const mainAgg = field.aggs[0];
  const mainKey = `${field.field}__${mainAgg}`;
  const mainValue = row[mainKey];
  const secondaryAggs = field.aggs.slice(1);

  const bg = primary
    ? 'linear-gradient(135deg, var(--utbl-accent), color-mix(in srgb, var(--utbl-accent) 70%, #8b5cf6))'
    : undefined;

  return (
    <div style={{
      flex: layout === 'row' ? `1 1 ${sizes.flexBasis}` : undefined,
      padding: sizes.padding,
      background: bg ?? 'var(--utbl-surface-alt)',
      borderRadius: sizes.borderRadius,
      border: primary ? 'none' : '1px solid var(--utbl-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: sizes.gap,
    }}>
      {/* Header: icon + label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {sizes.iconBox > 0 && (
          <div style={{
            width: sizes.iconBox,
            height: sizes.iconBox,
            borderRadius: sizes.iconRadius,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: primary ? 'rgba(255,255,255,0.15)' : 'color-mix(in srgb, var(--utbl-accent) 12%, transparent)',
            color: primary ? 'rgba(255,255,255,0.9)' : 'var(--utbl-accent)',
            flexShrink: 0,
          }}>
            <BarChart3 size={sizes.iconSize} />
          </div>
        )}
        <span style={{
          fontSize: sizes.labelFont,
          fontWeight: 600,
          color: primary ? 'rgba(255,255,255,0.7)' : 'var(--utbl-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {field.label ?? field.field} &middot; {AGG_LABELS[mainAgg] ?? mainAgg}
        </span>
      </div>

      {/* Main value */}
      <div style={{
        fontSize: sizes.valueFont,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        color: primary ? '#fff' : 'var(--utbl-text)',
        lineHeight: 1,
      }}>
        {formatStatValue(mainValue, field.format)}
      </div>

      {/* Secondary values */}
      {secondaryAggs.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: sizes.secGap,
          paddingTop: sizes.secPadTop,
          borderTop: primary ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--utbl-border)',
        }}>
          {secondaryAggs.map((agg) => {
            const key = `${field.field}__${agg}`;
            return (
              <div key={agg} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: sizes.secFont,
                color: primary ? 'rgba(255,255,255,0.55)' : 'var(--utbl-text-muted)',
              }}>
                <span style={{
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                }}>
                  {AGG_LABELS[agg] ?? agg}
                </span>
                <span style={{
                  fontVariantNumeric: 'tabular-nums',
                  color: primary ? 'rgba(255,255,255,0.7)' : 'var(--utbl-text-secondary)',
                  fontWeight: 600,
                }}>
                  {formatStatValue(row[key], field.format)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Config panel
// ---------------------------------------------------------------------------

const STAT_AGGS: StatAgg[] = ['count', 'sum', 'avg', 'min', 'max', 'median', 'stddev', 'count_distinct'];

function StatsConfig({ config, onChange, columns }: DisplayConfigProps<StatsDisplayConfig>) {
  const numericCols = columns.filter((c) => (c.mappedType === 'number' || c.mappedType === 'bigint') && !isIdentityColumn(c.name));
  const selectedFields = new Set(config.fields.map((f) => f.field));

  function toggleField(colName: string) {
    if (selectedFields.has(colName)) {
      onChange({ ...config, fields: config.fields.filter((f) => f.field !== colName) });
    } else {
      onChange({
        ...config,
        fields: [...config.fields, { field: colName, aggs: ['sum', 'avg', 'min', 'max'] }],
      });
    }
  }

  function toggleAgg(fieldName: string, agg: StatAgg) {
    onChange({
      ...config,
      fields: config.fields.map((f) => {
        if (f.field !== fieldName) return f;
        const has = f.aggs.includes(agg);
        const newAggs = has ? f.aggs.filter((a) => a !== agg) : [...f.aggs, agg];
        return { ...f, aggs: newAggs.length > 0 ? newAggs : [agg] };
      }),
    });
  }

  const currentLayout = config.layout ?? 'column';
  const currentSize = config.cardSize ?? 'md';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.75rem' }}>
      {/* Orientation toggle at top */}
      <div className="utbl-segmented">
        <button
          className="utbl-segmented-btn"
          data-active={currentLayout === 'row'}
          onClick={() => onChange({ ...config, layout: 'row' })}
        >
          Row
        </button>
        <button
          className="utbl-segmented-btn"
          data-active={currentLayout === 'column'}
          onClick={() => onChange({ ...config, layout: 'column' })}
        >
          Column
        </button>
      </div>

      {/* Card size toggle */}
      <div className="utbl-segmented">
        <button className="utbl-segmented-btn" data-active={currentSize === 'sm'} onClick={() => onChange({ ...config, cardSize: 'sm' })}>S</button>
        <button className="utbl-segmented-btn" data-active={currentSize === 'md'} onClick={() => onChange({ ...config, cardSize: 'md' })}>M</button>
        <button className="utbl-segmented-btn" data-active={currentSize === 'lg'} onClick={() => onChange({ ...config, cardSize: 'lg' })}>L</button>
      </div>

      {numericCols.map((col) => {
        const isSelected = selectedFields.has(col.name);
        const field = config.fields.find((f) => f.field === col.name);
        return (
          <div key={col.name}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={isSelected} onChange={() => toggleField(col.name)} />
              <span style={{ color: 'var(--utbl-text)' }}>{col.name}</span>
            </label>
            {isSelected && field && (
              <div style={{ marginLeft: 22, marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {STAT_AGGS.map((agg) => (
                  <button
                    key={agg}
                    onClick={() => toggleAgg(col.name, agg)}
                    style={{
                      padding: '2px 6px',
                      border: '1px solid var(--utbl-border)',
                      borderRadius: 3,
                      background: field.aggs.includes(agg) ? 'var(--utbl-accent)' : 'transparent',
                      color: field.aggs.includes(agg) ? '#fff' : 'var(--utbl-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                    }}
                  >
                    {(AGG_LABELS[agg] ?? agg).toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const statsDisplay: DisplayDescriptor<StatsDisplayConfig> = {
  type: statsDisplayType,
  icon: BarChart3,
  render: (props) => <StatsRender {...props} />,
  renderConfig: (props) => <StatsConfig {...props} />,
};
