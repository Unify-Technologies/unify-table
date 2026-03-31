import { useContext, useEffect, useRef, useState } from "react";
import type { IDockviewHeaderActionsProps } from "dockview";
import { Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { DemoContext } from "./DemoContext";

export function GroupActions(props: IDockviewHeaderActionsProps) {
  const { dark } = useContext(DemoContext);
  const [maximized, setMaximized] = useState(() => props.api.isMaximized());
  const [copied, setCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
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

  const showTooltip = (ref: React.RefObject<HTMLButtonElement | null>, label: string) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ label, top: rect.bottom + 4, left: rect.left + rect.width / 2 });
  };

  const hideTooltip = () => setTooltip(null);

  const copyLayout = async () => {
    const json = props.containerApi.toJSON();
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        ref={copyRef}
        onClick={copyLayout}
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
          showTooltip(copyRef, copied ? "Copied!" : "Copy Layout");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.5";
          hideTooltip();
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
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
          showTooltip(btnRef, props.api.isMaximized() ? "Restore" : "Maximize");
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
