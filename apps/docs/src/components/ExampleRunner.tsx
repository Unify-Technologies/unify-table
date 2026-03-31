import { Component, type ReactNode } from "react";
import { darkTheme, lightTheme } from "@unify/table-react";
import { useDB } from "../providers/DuckDBProvider";
import { useExampleData } from "../providers/useExampleData";
import { useTheme } from "../providers/ThemeProvider";

interface ExampleRunnerProps {
  component: React.ComponentType<{ db: any }>;
  seedSql?: string;
  height?: number;
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(err: Error) {
    return { error: err.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 text-sm" style={{ color: "var(--color-dark-negative, #f87171)" }}>
          Example error: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

function RunnerInner({ component: Comp, seedSql, height }: ExampleRunnerProps) {
  const { db } = useDB();
  const { dark } = useTheme();
  const ready = useExampleData(db, seedSql);
  const theme = dark ? darkTheme : lightTheme;

  if (!db || !ready) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          height: height ?? 400,
          color: dark ? "var(--color-dark-text-muted)" : "var(--color-text-muted)",
        }}
      >
        <div className="text-center space-y-2">
          <div className="relative mx-auto w-8 h-8">
            <div
              className="absolute inset-0 border-2 rounded-full animate-spin"
              style={{
                borderColor: "transparent",
                borderTopColor: dark ? "var(--color-dark-accent)" : "var(--color-accent)",
              }}
            />
          </div>
          <p className="text-xs font-mono">Loading DuckDB...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={theme.containerClass}
      style={{
        height: height ?? 400,
        display: "flex",
        flexDirection: "column",
        ...theme.panelVars,
        // Override container styles that conflict with doc embedding
        borderRadius: 0,
        border: "none",
        boxShadow: "none",
      } as React.CSSProperties}
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <Comp db={db} />
      </div>
    </div>
  );
}

export function ExampleRunner(props: ExampleRunnerProps) {
  return (
    <ErrorBoundary>
      <RunnerInner {...props} />
    </ErrorBoundary>
  );
}
