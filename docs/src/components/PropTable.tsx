import { useTheme } from "../providers/ThemeProvider";

interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
  required?: boolean;
}

interface PropTableProps {
  title?: string;
  rows: PropRow[];
}

export function PropTable({ title, rows }: PropTableProps) {
  const { dark } = useTheme();
  const border = dark ? "var(--color-dark-border)" : "var(--color-border)";
  const bg = dark ? "var(--color-dark-surface-alt)" : "var(--color-surface-alt)";
  const text = dark ? "var(--color-dark-text)" : "var(--color-text)";
  const textSecondary = dark ? "var(--color-dark-text-secondary)" : "var(--color-text-secondary)";
  const accent = dark ? "var(--color-dark-accent)" : "var(--color-accent)";

  return (
    <div className="my-6 overflow-x-auto rounded-lg" style={{ border: `1px solid ${border}` }}>
      {title && (
        <div className="px-4 py-2 text-[13px] font-semibold" style={{ backgroundColor: bg, borderBottom: `1px solid ${border}`, color: text }}>
          {title}
        </div>
      )}
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ backgroundColor: bg, borderBottom: `1px solid ${border}` }}>
            <th className="text-left px-4 py-2 font-medium" style={{ color: text }}>Prop</th>
            <th className="text-left px-4 py-2 font-medium" style={{ color: text }}>Type</th>
            <th className="text-left px-4 py-2 font-medium" style={{ color: text }}>Default</th>
            <th className="text-left px-4 py-2 font-medium" style={{ color: text }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} style={{ borderBottom: `1px solid ${border}` }}>
              <td className="px-4 py-2 font-mono text-[12px]" style={{ color: accent }}>
                {row.name}{row.required && <span style={{ color: dark ? "var(--color-dark-negative)" : "var(--color-negative)" }}>*</span>}
              </td>
              <td className="px-4 py-2 font-mono text-[12px]" style={{ color: textSecondary }}>{row.type}</td>
              <td className="px-4 py-2 font-mono text-[12px]" style={{ color: textSecondary }}>{row.default ?? "—"}</td>
              <td className="px-4 py-2" style={{ color: textSecondary }}>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
