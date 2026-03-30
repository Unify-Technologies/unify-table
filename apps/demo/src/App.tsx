import "@unify/table-react/displays";
import "@unify/table-react/styles";
import "@unify/table-react/themes";
import "dockview/dist/styles/dockview.css";
import "highlight.js/styles/github-dark-dimmed.css";
import { useEffect, useState } from "react";
import { DemoContext } from "./context/DemoContext";
import { useDuckDB } from "./hooks/useDuckDB";
import { DockLayout } from "./components/DockLayout";

export function App() {
  const { db, error, initTime } = useDuckDB();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (!db && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark-surface)]">
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 border-2 border-[var(--color-dark-border)] rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-[var(--color-dark-accent)] rounded-full animate-spin" />
          </div>
          <p className="text-[var(--color-dark-text)] font-medium tracking-wide text-sm">
            INITIALIZING
          </p>
          <p className="text-[var(--color-dark-text-muted)] text-xs font-mono">
            Loading DuckDB-WASM engine...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-dark-surface)]">
        <div className="max-w-lg p-8 border border-[var(--color-negative)]/30 rounded-xl">
          <p className="text-[var(--color-negative)] font-semibold mb-2">
            Initialization failed
          </p>
          <pre className="text-xs font-mono text-[var(--color-dark-text-secondary)] whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <DemoContext.Provider value={{ db: db!, dark }}>
      <DockLayout dark={dark} setDark={setDark} initTime={initTime} />
    </DemoContext.Provider>
  );
}
