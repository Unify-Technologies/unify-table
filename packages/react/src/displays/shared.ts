export const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '3px 6px',
  background: 'var(--utbl-input-bg)',
  border: '1px solid var(--utbl-input-border)',
  color: 'var(--utbl-text)',
  borderRadius: 3,
  fontSize: '0.625rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

export function formatCompact(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
