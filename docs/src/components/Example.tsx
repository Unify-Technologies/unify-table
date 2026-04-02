import { useState, type ReactNode } from "react";
import { Code, Eye } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
import { CodeBlock } from "./CodeBlock";
import { ExampleRunner } from "./ExampleRunner";
import { EXAMPLES } from "../examples";

interface ExampleProps {
  id: string;
  title?: string;
  description?: string | ReactNode;
  height?: number;
}

export function Example({ id, title, description, height }: ExampleProps) {
  const [showCode, setShowCode] = useState(false);
  const { dark } = useTheme();
  const example = EXAMPLES[id];

  if (!example) {
    return <div className="p-4 text-sm text-red-500">Example not found: {id}</div>;
  }

  const border = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const textSecondary = dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)";

  return (
    <div className="doc-example-card my-6" style={{ border: `1px solid ${border}` }}>
      {/* Header */}
      {(title || description) && (
        <div className="px-4 pt-4 pb-2" style={{ borderBottom: `1px solid ${border}` }}>
          {title && (
            <h3 className="text-sm font-semibold mb-1" style={{ color: dark ? "var(--color-dark-text)" : "var(--color-text)" }}>
              {title}
            </h3>
          )}
          {description && (
            <p className="text-[13px]" style={{ color: textSecondary }}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Preview */}
      <div style={{ backgroundColor: dark ? "var(--color-dark-surface)" : "var(--color-surface)", overflow: "hidden" }}>
        <ExampleRunner component={example.component} seedSql={example.seedSql} height={height} />
      </div>

      {/* Code toggle bar */}
      <div
        className="flex justify-end px-3 py-1.5"
        style={{ borderTop: `1px solid ${border}` }}
      >
        <button
          onClick={() => setShowCode((s) => !s)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer"
          style={{
            color: textSecondary,
          }}
        >
          {showCode ? <Eye size={12} /> : <Code size={12} />}
          {showCode ? "Preview" : "Code"}
        </button>
      </div>

      {/* Code panel — inline within the card, no extra border/radius/shadow */}
      {showCode && (
        <div style={{ borderTop: `1px solid ${border}` }}>
          <CodeBlock code={example.code} language="tsx" embedded />
        </div>
      )}
    </div>
  );
}
