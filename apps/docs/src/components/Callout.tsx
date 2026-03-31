import { Info, AlertTriangle, Lightbulb } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";

type CalloutType = "info" | "warning" | "tip";

const ICONS = { info: Info, warning: AlertTriangle, tip: Lightbulb };

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = "info", title, children }: CalloutProps) {
  const { dark } = useTheme();
  const Icon = ICONS[type];

  const colors = {
    info: {
      border: dark ? "var(--color-dark-accent)" : "var(--color-accent)",
      bg: dark ? "rgba(59,130,246,0.06)" : "rgba(38,139,210,0.06)",
      icon: dark ? "var(--color-dark-accent)" : "var(--color-accent)",
    },
    warning: {
      border: dark ? "var(--color-dark-negative)" : "var(--color-negative)",
      bg: dark ? "rgba(248,113,113,0.06)" : "rgba(220,50,47,0.06)",
      icon: dark ? "var(--color-dark-negative)" : "var(--color-negative)",
    },
    tip: {
      border: dark ? "var(--color-dark-positive)" : "var(--color-positive)",
      bg: dark ? "rgba(52,211,153,0.06)" : "rgba(133,153,0,0.06)",
      icon: dark ? "var(--color-dark-positive)" : "var(--color-positive)",
    },
  }[type];

  return (
    <div
      className="my-4 rounded-lg p-4 flex gap-3"
      style={{
        borderLeft: `3px solid ${colors.border}`,
        backgroundColor: colors.bg,
      }}
    >
      <Icon size={16} style={{ color: colors.icon, flexShrink: 0, marginTop: 2 }} />
      <div className="text-[13px] space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div style={{ color: dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
