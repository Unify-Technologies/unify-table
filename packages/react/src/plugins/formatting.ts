import type { TablePlugin, ResolvedColumn, CellStyleValue } from "../types.js";
import type { Row } from "@unify/table-core";

export interface ConditionalRule {
  when: (value: unknown, row: Row) => boolean;
  className?: string;
  /** Inline style applied when the rule matches — works without Tailwind/CSS classes. */
  style?: Record<string, string>;
}

type RulesMap = Record<string, ConditionalRule[]>;

/**
 * Conditional formatting plugin.
 * Rules are keyed by column field name, or '*' for all columns.
 *
 * Use `style` for inline colors (always works), or `className` for pre-defined CSS classes.
 */
export function formatting(rules: RulesMap = {}): TablePlugin {
  return {
    name: "formatting",

    transformColumns(columns: ResolvedColumn[]): ResolvedColumn[] {
      return columns.map((col) => {
        const columnRules = [...(rules[col.field] ?? []), ...(rules["*"] ?? [])];
        if (columnRules.length === 0) return col;

        const originalCellStyle = col.cellStyle;

        return {
          ...col,
          cellStyle: (value: unknown, row: Row): CellStyleValue => {
            const classes: string[] = [];
            const inlineStyles: Record<string, string> = {};

            // Apply original cellStyle
            if (typeof originalCellStyle === "function") {
              const result = originalCellStyle(value, row);
              if (typeof result === "object" && result !== null) {
                if (result.className) classes.push(result.className);
                if (result.style)
                  Object.assign(inlineStyles, result.style as Record<string, string>);
              } else if (typeof result === "string" && result) {
                classes.push(result);
              }
            } else if (typeof originalCellStyle === "string" && originalCellStyle) {
              classes.push(originalCellStyle);
            }

            // Apply conditional rules
            for (const rule of columnRules) {
              if (rule.when(value, row)) {
                if (rule.className) classes.push(rule.className);
                if (rule.style) Object.assign(inlineStyles, rule.style);
              }
            }

            const classStr = classes.join(" ");
            const hasStyles = Object.keys(inlineStyles).length > 0;
            if (!hasStyles) return classStr;
            return { className: classStr, style: inlineStyles };
          },
        };
      });
    },
  };
}

// ── Preset rule factories ────────────────────────────────────

/** Highlight values below a threshold. */
export function threshold(
  ranges: { max: number; className?: string; style?: Record<string, string> }[],
): ConditionalRule[] {
  const sorted = [...ranges].sort((a, b) => a.max - b.max);
  return sorted.map((range) => ({
    when: (value) => typeof value === "number" && value < range.max,
    className: range.className,
    style: range.style,
  }));
}

/** Highlight negative values. */
export function negative(color = "#ef4444"): ConditionalRule[] {
  return [{ when: (value) => typeof value === "number" && value < 0, style: { color } }];
}

/** Highlight positive values. */
export function positive(color = "#22c55e"): ConditionalRule[] {
  return [{ when: (value) => typeof value === "number" && value > 0, style: { color } }];
}
