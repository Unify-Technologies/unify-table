import type { DisplayConfig, ColumnInfo } from '@unify/table-core';
import type { ComponentType } from 'react';
import { listDisplays, getDisplay } from '../displays/registry.js';
import { Table2, X } from 'lucide-react';

export interface DisplayPanelProps {
  displays: DisplayConfig[];
  activeDisplay: string | null;
  onActivate: (id: string | null) => void;
  onAdd: (type: string) => void;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, config: Record<string, unknown>) => void;
  schemaColumns: ColumnInfo[];
  search?: string;
  showTooltip?: (e: React.MouseEvent, label: string, pos?: { top: number; left: number }) => void;
  hideTooltip?: () => void;
}

export function DisplayPanel({
  displays,
  activeDisplay,
  onActivate,
  onAdd,
  onRemove,
  onConfigChange,
  schemaColumns,
  search,
  showTooltip,
  hideTooltip,
}: DisplayPanelProps) {
  const availableTypes = listDisplays();
  const currentDisplay = displays.length > 0 ? displays[0] : null;
  const descriptor = currentDisplay ? getDisplay(currentDisplay.type) : null;
  const isDisplayActive = activeDisplay !== null && currentDisplay !== null;
  const DisplayIcon: ComponentType<{ size?: number }> | undefined = descriptor?.icon;

  if (!currentDisplay) {
    const query = (search ?? '').toLowerCase();
    const filtered = query
      ? availableTypes.filter((d) => d.type.label.toLowerCase().includes(query) || d.type.key.toLowerCase().includes(query))
      : availableTypes;

    // Catalogue mode — no display selected yet
    return (
      <div className="utbl-panel-section utbl-space-y">
        <div className="utbl-toggle-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {filtered.map((desc) => {
            const Icon = desc.icon;
            return (
              <button
                key={desc.type.key}
                className="utbl-toggle-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => onAdd(desc.type.key)}
                onMouseEnter={showTooltip ? (e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  showTooltip(e, desc.type.description ?? desc.type.label, { top: rect.top - 6, left: rect.left });
                } : undefined}
                onMouseLeave={hideTooltip}
              >
                {Icon && <Icon size={12} />}
                {desc.type.label}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <span style={{ fontSize: '0.65rem', color: 'var(--utbl-text-muted)', padding: '4px 0' }}>No matching displays</span>
          )}
        </div>
      </div>
    );
  }

  // Display selected — show segmented toggle + config
  return (
    <div className="utbl-panel-section utbl-space-y">
      <div className="utbl-segmented">
        <button
          className="utbl-segmented-btn"
          data-active={!isDisplayActive}
          onClick={() => onActivate(null)}
        >
          <div className="utbl-segmented-btn__content">
            <Table2 size={11} />
            <span>Table</span>
          </div>
        </button>
        <button
          className="utbl-segmented-btn"
          data-active={isDisplayActive}
          onClick={() => onActivate(currentDisplay.id)}
        >
          <div className="utbl-segmented-btn__content">
            {DisplayIcon && <DisplayIcon size={11} />}
            <span>{currentDisplay.label}</span>
          </div>
          <span
            role="button"
            className="utbl-segmented-close"
            title="Remove display"
            onClick={(e) => { e.stopPropagation(); onRemove(currentDisplay.id); }}
          >
            <X size={10} strokeWidth={2.5} />
          </span>
        </button>
      </div>

      {/* Display config */}
      {descriptor && (
        <div style={{ marginTop: 6, marginBottom: 4 }}>
          {descriptor.renderConfig({
            config: currentDisplay.config as never,
            onChange: (config: unknown) => onConfigChange(currentDisplay.id, config as Record<string, unknown>),
            columns: schemaColumns,
          })}
        </div>
      )}
    </div>
  );
}
