import { useMemo } from 'react';
import { correlationDisplayType, isIdentityColumn } from '@unify/table-core';
import type { CorrelationDisplayConfig } from '@unify/table-core';
import { EChartsWrapper } from '@unify/table-charts';
import type { DisplayDescriptor, DisplayRenderProps, DisplayConfigProps } from './types.js';
import { useDisplayData } from './useDisplayData.js';
import { useChartTheme } from './useChartTheme.js';
import { Grid3x3 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function CorrelationRender({ config, sql, engine, columns }: DisplayRenderProps<CorrelationDisplayConfig>) {
  const { rows, isLoading, error } = useDisplayData(sql, engine);
  const { ref, theme: chartTheme } = useChartTheme();

  const { matrix, colNames } = useMemo(() => {
    const cols = config.selectedColumns.length > 0
      ? config.selectedColumns
      : columns.filter((c) => c.mappedType === 'number' || c.mappedType === 'bigint')
        .slice(0, config.maxAutoColumns).map((c) => c.name);

    const n = cols.length;
    const mat: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));

    // Diagonal = 1.0
    for (let i = 0; i < n; i++) mat[i][i] = 1.0;

    if (rows.length > 0) {
      const row = rows[0];
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const key = `p_${i}_${j}`;
          const val = row[key] != null ? Number(row[key]) : null;
          mat[i][j] = val;
          mat[j][i] = val;
        }
      }
    }

    return { matrix: mat, colNames: cols };
  }, [rows, config.selectedColumns, config.maxAutoColumns, columns]);

  const option = useMemo(() => {
    if (colNames.length < 2) return null;

    const data: [number, number, number | null][] = [];
    for (let i = 0; i < colNames.length; i++) {
      for (let j = 0; j < colNames.length; j++) {
        data.push([j, colNames.length - 1 - i, matrix[i][j]]);
      }
    }

    const scheme = config.colorScheme ?? 'diverging';
    const isDiverging = scheme === 'diverging';

    return {
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: chartTheme.tooltipBg,
        borderColor: chartTheme.tooltipBorder,
        borderWidth: 1,
        textStyle: { color: chartTheme.text, fontSize: 11 },
        padding: [6, 10] as number[],
        confine: true,
        formatter: (p: { data: [number, number, number | null] }) => {
          const [x, y, val] = p.data;
          const row = colNames.length - 1 - y;
          return `CORR(${colNames[row]}, ${colNames[x]}) = ${val != null ? val.toFixed(4) : 'N/A'}`;
        },
      },
      grid: {
        left: 10,
        right: 60,
        top: 10,
        bottom: 10,
        containLabel: true,
      },
      xAxis: {
        type: 'category' as const,
        data: colNames,
        position: 'bottom' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: chartTheme.textSecondary,
          rotate: 45,
          interval: 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: [...colNames].reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: chartTheme.textSecondary,
          interval: 0,
        },
        splitLine: { show: false },
      },
      visualMap: {
        min: isDiverging ? -1 : 0,
        max: 1,
        calculable: false,
        orient: 'vertical' as const,
        right: 0,
        top: 'center' as const,
        itemHeight: 120,
        inRange: isDiverging
          ? { color: ['#e07070', '#e8e8e8', '#6b9bd2'] }
          : { color: [chartTheme.surface, '#6b9bd2'] },
        textStyle: { color: chartTheme.textMuted, fontSize: 9 },
      },
      series: [{
        type: 'heatmap',
        data,
        label: {
          show: config.showValues,
          color: chartTheme.text,
          fontSize: colNames.length > 8 ? 8 : 10,
          formatter: (p: { data: [number, number, number | null] }) => {
            const val = p.data[2];
            return val != null ? val.toFixed(2) : '';
          },
        },
        emphasis: {
          itemStyle: {
            borderColor: 'var(--utbl-accent, #3b82f6)',
            borderWidth: 2,
          },
        },
        itemStyle: {
          borderColor: chartTheme.divider,
          borderWidth: 1,
          borderRadius: 2,
        },
      }],
    };
  }, [matrix, colNames, config.showValues, config.colorScheme, chartTheme]);

  if (error) return <div ref={ref} className="utbl-display-error">{error.message}</div>;
  if (isLoading && rows.length === 0) return <div ref={ref} className="utbl-display-loading">Loading correlations...</div>;
  if (colNames.length < 2) return <div ref={ref} className="utbl-display-loading">Need at least 2 numeric columns</div>;
  if (!option) return <div ref={ref} className="utbl-display-loading">No data</div>;

  return <div ref={ref} style={{ display: 'flex', flex: 1, minHeight: 300 }}><EChartsWrapper option={option} style={{ flex: 1, minHeight: 300 }} /></div>;
}

// ---------------------------------------------------------------------------
// Config panel
// ---------------------------------------------------------------------------

function CorrelationConfig({ config, onChange, columns }: DisplayConfigProps<CorrelationDisplayConfig>) {
  const numericCols = columns.filter((c) => (c.mappedType === 'number' || c.mappedType === 'bigint') && !isIdentityColumn(c.name));
  const selected = new Set(config.selectedColumns);

  function toggleCol(name: string) {
    const next = selected.has(name)
      ? config.selectedColumns.filter((c) => c !== name)
      : [...config.selectedColumns, name];
    onChange({ ...config, selectedColumns: next });
  }

  function selectAll() {
    onChange({ ...config, selectedColumns: numericCols.map((c) => c.name) });
  }

  function deselectAll() {
    onChange({ ...config, selectedColumns: [] });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.75rem' }}>
      <div className="utbl-segmented">
        <button className="utbl-segmented-btn" data-active={config.colorScheme === 'diverging'} onClick={() => onChange({ ...config, colorScheme: 'diverging' })}>Diverging</button>
        <button className="utbl-segmented-btn" data-active={config.colorScheme === 'sequential'} onClick={() => onChange({ ...config, colorScheme: 'sequential' })}>Sequential</button>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--utbl-text)' }}>
        <input type="checkbox" checked={config.showValues} onChange={() => onChange({ ...config, showValues: !config.showValues })} />
        Show Values
      </label>

      <div>
        <span className="utbl-field-label">Highlight Threshold</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.highlightThreshold}
            onChange={(e) => onChange({ ...config, highlightThreshold: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.625rem', color: 'var(--utbl-text)', fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
            {config.highlightThreshold.toFixed(2)}
          </span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <span className="utbl-field-label" style={{ flex: 1 }}>Columns</span>
          <button onClick={selectAll} style={{ fontSize: '0.6rem', color: 'var(--utbl-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>All</button>
          <button onClick={deselectAll} style={{ fontSize: '0.6rem', color: 'var(--utbl-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>None</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {numericCols.map((c) => (
            <label key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--utbl-text)' }}>
              <input type="checkbox" checked={selected.has(c.name)} onChange={() => toggleCol(c.name)} />
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

export const correlationDisplay: DisplayDescriptor<CorrelationDisplayConfig> = {
  type: correlationDisplayType,
  icon: Grid3x3,
  render: (props) => <CorrelationRender {...props} />,
  renderConfig: (props) => <CorrelationConfig {...props} />,
};
