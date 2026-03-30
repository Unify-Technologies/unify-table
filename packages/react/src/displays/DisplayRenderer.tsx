import { useCallback, useMemo } from 'react';
import type { DisplayConfig, QueryEngine, ColumnInfo } from '@unify/table-core';
import { getDisplay } from './registry.js';

export interface DisplayRendererProps {
  display: DisplayConfig;
  viewName: string;
  engine: QueryEngine;
  columns: ColumnInfo[];
  onConfigChange: (config: Record<string, unknown>) => void;
  showConfig: boolean;
  showSql: boolean;
}

export function DisplayRenderer({
  display,
  viewName,
  engine,
  columns,
  onConfigChange,
  showConfig,
  showSql,
}: DisplayRendererProps) {
  const descriptor = getDisplay(display.type);

  const validationErrors = useMemo(() => {
    if (!descriptor?.type.validate) return null;
    return descriptor.type.validate(display.config as never);
  }, [descriptor, display.config]);

  const sql = useMemo(() => {
    if (!descriptor || validationErrors) return '';
    return descriptor.type.buildSql(viewName, display.config, columns);
  }, [descriptor, viewName, display.config, columns, validationErrors]);

  const refresh = useCallback(() => {}, []);

  if (!descriptor) {
    return (
      <div className="utbl-display-error">
        Unknown display type: {display.type}
      </div>
    );
  }

  return (
    <div className="utbl-display-renderer">
      {/* SQL inspector */}
      {showSql && (
        <div className="utbl-display-sql">
          <pre>{sql}</pre>
        </div>
      )}

      {/* Config panel */}
      {showConfig && (
        <div className="utbl-display-config">
          {descriptor.renderConfig({
            config: display.config as never,
            onChange: onConfigChange as never,
            columns,
          })}
        </div>
      )}

      {/* Display content */}
      <div className="utbl-display-content">
        {validationErrors ? (
          <div className="utbl-display-loading" style={{ padding: 24, textAlign: 'center', color: 'var(--utbl-text-muted)' }}>
            {validationErrors.join('. ')}
          </div>
        ) : (
          descriptor.render({
            config: display.config as never,
            viewName,
            sql,
            engine,
            columns,
            refresh,
          })
        )}
      </div>
    </div>
  );
}
