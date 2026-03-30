import { useContext, useEffect, useRef, useState } from "react";
import type { IDockviewHeaderActionsProps } from "dockview";
import { Maximize2, Minimize2 } from "lucide-react";
import { DemoContext } from "../context/DemoContext";

export function GroupActions(props: IDockviewHeaderActionsProps) {
  const { dark } = useContext(DemoContext);
  const [maximized, setMaximized] = useState(() => props.api.isMaximized());
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltip, setTooltip] = useState<{
    label: string;
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    const disposable = props.containerApi.onDidMaximizedGroupChange(() => {
      const isMax = props.api.isMaximized();
      setMaximized(isMax);
      const root = btnRef.current?.closest(
        ".dockview-theme-unify-dark, .dockview-theme-unify-light",
      );
      root?.classList.toggle("dv-maximized", isMax);
    });
    return () => disposable.dispose();
  }, [props.api, props.containerApi]);

  const showTooltip = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const label = props.api.isMaximized() ? "Restore" : "Maximize";
    setTooltip({ label, top: rect.bottom + 4, left: rect.left + rect.width / 2 });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => {
          if (props.api.isMaximized()) {
            props.api.exitMaximized();
          } else {
            props.api.maximize();
          }
          hideTooltip();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: "0 6px",
          height: "100%",
          opacity: 0.5,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "1";
          showTooltip();
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.5";
          hideTooltip();
        }}
      >
        {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
      </button>
      {tooltip && (
        <div
          className="utbl-tooltip--fixed"
          style={{
            top: tooltip.top,
            left: tooltip.left,
            transform: "translateX(-50%)",
            '--utbl-text': dark ? '#e8eaef' : '#073642',
            '--utbl-surface': dark ? '#0c0e14' : '#fdf6e3',
          } as React.CSSProperties}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
}
