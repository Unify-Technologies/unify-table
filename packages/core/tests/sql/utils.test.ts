import { describe, it, expect } from 'vitest';
import { quoteIdent, escapeString, toSqlLiteral } from '../../src/sql/utils.js';

describe('quoteIdent', () => {
  it('wraps in double quotes', () => {
    expect(quoteIdent('region')).toBe('"region"');
  });

  it('escapes embedded double quotes', () => {
    expect(quoteIdent('col"name')).toBe('"col""name"');
  });

  it('handles empty string', () => {
    expect(quoteIdent('')).toBe('""');
  });
});

describe('escapeString', () => {
  it('wraps in single quotes', () => {
    expect(escapeString('hello')).toBe("'hello'");
  });

  it('escapes embedded single quotes', () => {
    expect(escapeString("O'Brien")).toBe("'O''Brien'");
  });

  it('handles empty string', () => {
    expect(escapeString('')).toBe("''");
  });
});

describe('toSqlLiteral', () => {
  it('null → NULL', () => {
    expect(toSqlLiteral(null)).toBe('NULL');
  });

  it('undefined → NULL', () => {
    expect(toSqlLiteral(undefined)).toBe('NULL');
  });

  it('number', () => {
    expect(toSqlLiteral(42)).toBe('42');
    expect(toSqlLiteral(-3.14)).toBe('-3.14');
  });

  it('bigint', () => {
    expect(toSqlLiteral(BigInt(999999999999))).toBe('999999999999');
  });

  it('boolean', () => {
    expect(toSqlLiteral(true)).toBe('TRUE');
    expect(toSqlLiteral(false)).toBe('FALSE');
  });

  it('string', () => {
    expect(toSqlLiteral('hello')).toBe("'hello'");
  });

  it('Date', () => {
    const d = new Date('2024-06-15T12:00:00.000Z');
    expect(toSqlLiteral(d)).toBe("'2024-06-15T12:00:00.000Z'");
  });
});
