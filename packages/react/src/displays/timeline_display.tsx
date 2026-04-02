import { useMemo } from 'react';
import { timelineDisplayType, isIdentityColumn, isNumericType } from '@unify/table-core';
import type { TimelineDisplayConfig, BucketInterval, TimelineAgg } from '@unify/table-core';
import { buildBarLineOption, EChartsWrapper, type ChartOptionConfig } from '@unify/table-charts';
import type { DisplayDescriptor, DisplayRenderProps, DisplayConfigProps } from './types.js';
import { useDisplayData } from './useDisplayData.js';
import { useChartTheme } from './useChartTheme.js';
import { CalendarRange, BarChart3, LineChart, AreaChart, Layers, ZoomIn } from 'lucide-react';
import { selectStyle } from './shared.js';

// ---------------------------------------------------------------------------
// Bucket formatting
// ---------------------------------------------------------------------------

const BUCKET_FORMATS: Record<BucketInterval, (v: string) => string> = {
  minute: (v) => v.slice(0, 16).replace('T', ' '),
  hour: (v) => v.slice(0, 13).replace('T', ' ') + 'h',
  day: (v) => v.slice(0, 10),
  week: (v) => v.slice(0, 10),
  month: (v) => v.slice(0, 7),
  quarter: (v) => { const d = new Date(v); return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`; },
  year: (v) => v.slice(0, 4),
};

function formatBucket(value: unknown, bucket: BucketInterval): string {
  const s = String(value ?? '');
  const fn = BUCKET_FORMATS[bucket];
  return fn ? fn(s) : s;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function TimelineRender({ config, sql, engine }: DisplayRenderProps<TimelineDisplayConfig>) {
  const { rows, isLoading, error } = useDisplayData(sql, engine);
  const { ref, theme } = useChartTheme();

  const option = useMemo(() => {
    if (rows.length === 0) return null;

    // Format bucket labels
    const formatted = rows.map((r) => ({
      ...r,
      bucket: formatBucket(r.bucket, config.bucket),
    }));

    const chartConfig: ChartOptionConfig = {
      type: config.chartType ?? 'bar',
      x: 'bucket',
      y: { field: 'value', agg: config.agg ?? 'count', label: 'value' },
      series: config.series,
      stacked: config.stacked,
      colorScheme: config.colorScheme,
      zoom: config.zoom,
      xAxis: { label: config.dateField, rotate: 30 },
      yAxis: { label: config.valueField ?? 'Count' },
      theme,
    };

    return buildBarLineOption(formatted, chartConfig);
  }, [rows, config, theme]);

  if (error) return <div ref={ref} className="utbl-display-error">{error.message}</div>;
  if (isLoading && rows.length === 0) return <div ref={ref} className="utbl-display-loading">Loading timeline...</div>;
  if (!option) return <div ref={ref} className="utbl-display-loading">No data</div>;

  return <div ref={ref} style={{ display: 'flex', flex: 1, minHeight: 300 }}><EChartsWrapper option={option} style={{ flex: 1, minHeight: 300 }} /></div>;
}

// ---------------------------------------------------------------------------
// Config panel
// ---------------------------------------------------------------------------

const BUCKETS: BucketInterval[] = ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'];
const AGG_OPTIONS: TimelineAgg[] = ['count', 'sum', 'avg', 'min', 'max'];

const iconProps = { size: 14, strokeWidth: 2 } as const;

const CHART_STYLES: { type: 'bar' | 'line' | 'area'; icon: React.ReactNode }[] = [
  { type: 'bar', icon: <BarChart3 {...iconProps} /> },
  { type: 'line', icon: <LineChart {...iconProps} /> },
  { type: 'area', icon: <AreaChart {...iconProps} /> },
];

function TimelineConfig({ config, onChange, columns }: DisplayConfigProps<TimelineDisplayConfig>) {
  const cols = columns.filter((c) => !isIdentityColumn(c.name));
  const dateCols = cols.filter((c) => c.mappedType === 'timestamp' || c.mappedType === 'date');
  const numericCols = cols.filter((c) => isNumericType(c.mappedType));
  const chartType = config.chartType ?? 'bar';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.625rem' }}>
      <div>
        <span className="utbl-field-label">Date Field</span>
        <select value={config.dateField} onChange={(e) => onChange({ ...config, dateField: e.target.value })} style={selectStyle}>
          <option value="">Select column...</option>
          {dateCols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <span className="utbl-field-label">Bucket</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {BUCKETS.map((b) => (
            <button
              key={b}
              onClick={() => onChange({ ...config, bucket: b })}
              style={{
                padding: '2px 6px',
                border: '1px solid var(--utbl-border)',
                borderRadius: 3,
                background: config.bucket === b ? 'var(--utbl-accent)' : 'transparent',
                color: config.bucket === b ? '#fff' : 'var(--utbl-text-muted)',
                cursor: 'pointer',
                fontSize: '0.6rem',
              }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="utbl-field-label">Value Field</span>
        <select
          value={config.valueField ?? ''}
          onChange={(e) => onChange({ ...config, valueField: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">None (count rows)</option>
          {numericCols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {config.valueField && (
        <div>
          <span className="utbl-field-label">Aggregation</span>
          <select value={config.agg} onChange={(e) => onChange({ ...config, agg: e.target.value as TimelineAgg })} style={selectStyle}>
            {AGG_OPTIONS.map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}
          </select>
        </div>
      )}

      <div>
        <span className="utbl-field-label">Series (Group By)</span>
        <select
          value={config.series ?? ''}
          onChange={(e) => onChange({ ...config, series: e.target.value || undefined })}
          style={selectStyle}
        >
          <option value="">None</option>
          {cols.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {/* Chart style + options */}
      <div style={{ display: 'flex', gap: 3 }}>
        {CHART_STYLES.map((cs) => (
          <button
            key={cs.type}
            className="utbl-tooltip"
            data-tooltip={cs.type}
            onClick={() => onChange({ ...config, chartType: cs.type })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              padding: 0,
              border: '1px solid var(--utbl-border)',
              borderRadius: 3,
              background: chartType === cs.type ? 'var(--utbl-accent)' : 'transparent',
              color: chartType === cs.type ? '#fff' : 'var(--utbl-text-muted)',
              cursor: 'pointer',
            }}
          >
            {cs.icon}
          </button>
        ))}
        <button
          className="utbl-tooltip"
          data-tooltip="Stacked"
          onClick={() => onChange({ ...config, stacked: !config.stacked })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, padding: 0,
            border: '1px solid var(--utbl-border)', borderRadius: 3,
            background: config.stacked ? 'var(--utbl-accent)' : 'transparent',
            color: config.stacked ? '#fff' : 'var(--utbl-text-muted)',
            cursor: 'pointer',
          }}
        >
          <Layers {...iconProps} />
        </button>
        <button
          className="utbl-tooltip"
          data-tooltip="Zoom"
          onClick={() => onChange({ ...config, zoom: !config.zoom })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, padding: 0,
            border: '1px solid var(--utbl-border)', borderRadius: 3,
            background: config.zoom ? 'var(--utbl-accent)' : 'transparent',
            color: config.zoom ? '#fff' : 'var(--utbl-text-muted)',
            cursor: 'pointer',
          }}
        >
          <ZoomIn {...iconProps} />
        </button>
      </div>

      <div>
        <span className="utbl-field-label">Limit</span>
        <input
          className="utbl-input"
          type="number"
          value={config.limit ?? ''}
          onChange={(e) => onChange({ ...config, limit: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="No limit"
          style={{ width: 70 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Descriptor
// ---------------------------------------------------------------------------

export const timelineDisplay: DisplayDescriptor<TimelineDisplayConfig> = {
  type: timelineDisplayType,
  icon: CalendarRange,
  render: (props) => <TimelineRender {...props} />,
  renderConfig: (props) => <TimelineConfig {...props} />,
};
