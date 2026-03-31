import { useCallback, useEffect, useRef, useState } from "react";
import { getDisplay } from "@unify/table-react";
import type { IDockviewPanelHeaderProps } from "dockview";
import { Table2, X } from "lucide-react";

function selectAllText(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function DockTab(
  props: IDockviewPanelHeaderProps<{ displayType?: string | null }>,
) {
  const title = props.api.title ?? "";
  const [displayType, setDisplayType] = useState<string | null>(
    props.params?.displayType ?? null,
  );
  const labelRef = useRef<HTMLSpanElement>(null);
  const originalTitle = useRef("");

  useEffect(() => {
    const disposable = props.api.onDidParametersChange(() => {
      setDisplayType((props.api.getParameters() as any)?.displayType ?? null);
    });
    return () => disposable.dispose();
  }, [props.api]);

  const descriptor = displayType ? getDisplay(displayType) : null;
  const Icon = descriptor?.icon ?? Table2;

  const startEditing = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    originalTitle.current = el.textContent ?? "";
    el.contentEditable = "true";
    el.focus();
    selectAllText(el);
  }, []);

  const commitEdit = useCallback(() => {
    const el = labelRef.current;
    if (!el) return;
    el.contentEditable = "false";
    const value = (el.textContent ?? "").trim();
    if (value && value !== originalTitle.current) {
      props.api.setTitle(value);
    } else if (!value) {
      el.textContent = originalTitle.current;
    }
    window.getSelection()?.removeAllRanges();
  }, [props.api]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        height: "100%",
        width: "100%",
        cursor: "pointer",
      }}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          props.api.close();
        }
      }}
    >
      <span style={{ opacity: 0.6, flexShrink: 0, display: "flex" }}>
        <Icon size={13} />
      </span>
      <span
        ref={labelRef}
        data-testid="dock-tab-label"
        style={{
          fontSize: 12,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          startEditing();
        }}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLElement).blur();
          }
          if (e.key === "Escape") {
            const el = e.target as HTMLElement;
            el.textContent = originalTitle.current;
            el.contentEditable = "false";
            window.getSelection()?.removeAllRanges();
          }
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).isContentEditable) e.stopPropagation();
        }}
      >
        {title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          props.api.close();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: 2,
          borderRadius: 4,
          opacity: 0.5,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.5";
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}
