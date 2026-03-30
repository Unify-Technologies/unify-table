import { quoteIdent } from './utils.js';

/** Built-in aggregation functions with display labels. */
export const BUILT_IN_AGGS: readonly { key: string; label: string }[] = [
  { key: 'sum', label: 'SUM' },
  { key: 'avg', label: 'AVG' },
  { key: 'count', label: 'CNT' },
  { key: 'min', label: 'MIN' },
  { key: 'max', label: 'MAX' },
  { key: 'count_distinct', label: 'DCNT' },
  { key: 'median', label: 'MED' },
  { key: 'first', label: 'FIRST' },
  { key: 'last', label: 'LAST' },
  { key: 'any', label: 'ANY' },
  { key: 'mode', label: 'MODE' },
  { key: 'stddev', label: 'STDEV' },
  { key: 'variance', label: 'VAR' },
  { key: 'string_agg', label: 'CONCAT' },
];

/** Registry of custom aggregation functions */
const customAggs = new Map<string, (field: string) => string>();

/** Register a custom aggregation function. */
export function registerAgg(name: string, sqlTemplate: (quotedField: string) => string): void {
  customAggs.set(name, sqlTemplate);
}

/** Resolve an aggregation to SQL. */
export function aggToSql(agg: string, field: string): string {
  const qf = quoteIdent(field);

  switch (agg) {
    case 'sum':
      return `SUM(${qf})`;
    case 'avg':
      return `AVG(${qf})`;
    case 'count':
      return `COUNT(${qf})`;
    case 'min':
      return `MIN(${qf})`;
    case 'max':
      return `MAX(${qf})`;
    case 'count_distinct':
      return `COUNT(DISTINCT ${qf})`;
    case 'median':
      return `MEDIAN(${qf})`;
    case 'first':
      return `FIRST(${qf})`;
    case 'last':
      return `LAST(${qf})`;
    case 'any':
      return `ANY_VALUE(${qf})`;
    case 'mode':
      return `MODE(${qf})`;
    case 'stddev':
      return `STDDEV_SAMP(${qf})`;
    case 'variance':
      return `VARIANCE(${qf})`;
    case 'string_agg':
      return `STRING_AGG(${qf}, ', ')`;
    default: {
      const custom = customAggs.get(agg);
      if (custom) return custom(qf);
      throw new Error(`Unknown aggregation: ${agg}. Register it with registerAgg().`);
    }
  }
}

// Convenience helpers that return the SQL string for a specific aggregation
export function sum(field: string): string {
  return aggToSql('sum', field);
}
export function avg(field: string): string {
  return aggToSql('avg', field);
}
export function count(field: string): string {
  return aggToSql('count', field);
}
export function min(field: string): string {
  return aggToSql('min', field);
}
export function max(field: string): string {
  return aggToSql('max', field);
}
export function countDistinct(field: string): string {
  return aggToSql('count_distinct', field);
}
export function first(field: string): string {
  return aggToSql('first', field);
}
export function last(field: string): string {
  return aggToSql('last', field);
}
export function any(field: string): string {
  return aggToSql('any', field);
}
export function mode(field: string): string {
  return aggToSql('mode', field);
}
export function stddev(field: string): string {
  return aggToSql('stddev', field);
}
export function variance(field: string): string {
  return aggToSql('variance', field);
}
export function stringAgg(field: string): string {
  return aggToSql('string_agg', field);
}
