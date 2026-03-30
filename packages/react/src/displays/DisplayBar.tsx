import { useCallback, useRef, useState } from 'react';
import type { DisplayConfig } from '@unify/table-core';
import { listDisplays, getDisplay } from './registry.js';
import { Table2, Plus, X, Settings, Code } from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DisplayBarProps {
  displays: DisplayConfig[];
  activeDisplay: string | null;
  onActivate: (id: string | null) => void;
  onAdd: (type: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, label: string) => void;
  /** Currently showing config panel for this display? */
  showConfig: string | null;
  onToggleConfig: (id: string | null) => void;
  /** Currently showing SQL for this display? */
  showSql: string | null;
  onToggleSql: (id: string | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function selectAllText(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DisplayBar({
  displays,
  activeDisplay,
  onActivate,
  onAdd,
  onRemove,
  onRename,
  showConfig,
  onToggleConfig,
  showSql,
  onToggleSql,
}: DisplayBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const labelRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const originalLabel = useRef<string>('');
  const availableTypes = listDisplays();

  const handleAddClick = useCallback(() => {
    if (availableTypes.length === 1) {
      onAdd(availableTypes[0].type.key);
    } else {
      setMenuOpen((v) => !v);
    }
  }, [availableTypes, onAdd]);

  const handleAddType = useCallback((key: string) => {
    setMenuOpen(false);
    onAdd(key);
  }, [onAdd]);

  const startEditing = useCallback((id: string) => {
    const el = labelRefs.current.get(id);
    if (!el) return;
    originalLabel.current = el.textContent ?? '';
    el.contentEditable = 'true';
    el.focus();
    selectAllText(el);
  }, []);

  const commitEdit = useCallback((id: string, el: HTMLSpanElement) => {
    el.contentEditable = 'false';
    const value = (el.textContent ?? '').trim();
    if (value) {
      onRename(id, value);
    } else {
      el.textContent = originalLabel.current;
    }
    window.getSelection()?.removeAllRanges();
  }, [onRename]);

  return (
    <div className="utbl-display-bar">
      {/* Table tab — always first */}
      <button
        className={`utbl-display-tab ${activeDisplay === null ? 'utbl-display-tab--active' : ''}`}
        onClick={() => onActivate(null)}
      >
        <span className="utbl-display-tab__icon">{<Table2 size={14} />}</span>
        <span className="utbl-display-tab__label">Table</span>
      </button>

      {/* Display tabs */}
      {displays.map((d) => {
        const descriptor = getDisplay(d.type);
        const Icon = descriptor?.icon;
        const isActive = activeDisplay === d.id;

        return (
          <div
            key={d.id}
            className={`utbl-display-tab ${isActive ? 'utbl-display-tab--active' : ''}`}
            onClick={() => onActivate(d.id)}
          >
            {Icon && (
              <span className="utbl-display-tab__icon">
                <Icon size={14} />
              </span>
            )}

            <span
              ref={(el) => { if (el) labelRefs.current.set(d.id, el); else labelRefs.current.delete(d.id); }}
              className="utbl-display-tab__label"
              onDoubleClick={(e) => { e.stopPropagation(); startEditing(d.id); }}
              onBlur={() => commitEdit(d.id, labelRefs.current.get(d.id)!)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); }
                if (e.key === 'Escape') {
                  const el = e.target as HTMLElement;
                  el.textContent = originalLabel.current;
                  el.contentEditable = 'false';
                  window.getSelection()?.removeAllRanges();
                }
              }}
              onClick={(e) => { if ((e.target as HTMLElement).isContentEditable) e.stopPropagation(); }}
            >
              {d.label}
            </span>

            {/* Action buttons — only visible when active */}
            {isActive && (
              <span className="utbl-display-tab__actions">
                <button
                  className={`utbl-display-tab__action ${showConfig === d.id ? 'utbl-display-tab__action--active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onToggleConfig(showConfig === d.id ? null : d.id); }}
                  title="Configure"
                >
                  {<Settings size={12} />}
                </button>
                <button
                  className={`utbl-display-tab__action ${showSql === d.id ? 'utbl-display-tab__action--active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onToggleSql(showSql === d.id ? null : d.id); }}
                  title="View SQL"
                >
                  {<Code size={12} />}
                </button>
                <button
                  className="utbl-display-tab__action utbl-display-tab__action--close"
                  onClick={(e) => { e.stopPropagation(); onRemove(d.id); }}
                  title="Remove display"
                >
                  {<X size={10} strokeWidth={2.5} />}
                </button>
              </span>
            )}
          </div>
        );
      })}

      {/* Add button */}
      <div className="utbl-display-add-wrapper">
        <button
          className="utbl-display-tab utbl-display-tab--add"
          onClick={handleAddClick}
          title="Add display"
        >
          {<Plus size={12} strokeWidth={2.5} />}
        </button>

        {menuOpen && availableTypes.length > 1 && (
          <div className="utbl-display-add-menu">
            {availableTypes.map((desc) => (
              <button
                key={desc.type.key}
                className="utbl-display-add-menu__item"
                onClick={() => handleAddType(desc.type.key)}
              >
                {desc.icon && <desc.icon size={14} />}
                <span>{desc.type.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
