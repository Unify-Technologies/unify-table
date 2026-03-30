import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerDisplayType,
  getDisplayType,
  listDisplayTypes,
  clearDisplayTypes,
} from '../src/display.js';
import type { DisplayType, DisplayConfig } from '../src/display.js';

const dummyDisplay: DisplayType<{ foo: string }> = {
  key: 'dummy',
  label: 'Dummy Display',
  buildSql(viewName, config) {
    return `SELECT * FROM "${viewName}" WHERE foo = '${config.foo}'`;
  },
  defaultConfig() {
    return { foo: 'bar' };
  },
};

const anotherDisplay: DisplayType = {
  key: 'another',
  label: 'Another',
  buildSql(viewName) {
    return `SELECT COUNT(*) FROM "${viewName}"`;
  },
  defaultConfig() {
    return {};
  },
};

describe('Display Registry', () => {
  beforeEach(() => {
    clearDisplayTypes();
  });

  it('starts empty', () => {
    expect(listDisplayTypes()).toEqual([]);
    expect(getDisplayType('dummy')).toBeUndefined();
  });

  it('registers and retrieves a display type', () => {
    registerDisplayType(dummyDisplay);
    expect(getDisplayType('dummy')).toBe(dummyDisplay);
  });

  it('lists all registered types', () => {
    registerDisplayType(dummyDisplay);
    registerDisplayType(anotherDisplay);
    expect(listDisplayTypes()).toHaveLength(2);
    expect(listDisplayTypes().map((d) => d.key)).toEqual(['dummy', 'another']);
  });

  it('overwrites existing registration with same key', () => {
    registerDisplayType(dummyDisplay);
    const updated: DisplayType = { ...dummyDisplay, label: 'Updated' };
    registerDisplayType(updated);
    expect(getDisplayType('dummy')?.label).toBe('Updated');
    expect(listDisplayTypes()).toHaveLength(1);
  });

  it('clearDisplayTypes removes all registrations', () => {
    registerDisplayType(dummyDisplay);
    registerDisplayType(anotherDisplay);
    clearDisplayTypes();
    expect(listDisplayTypes()).toEqual([]);
  });
});

describe('DisplayType.buildSql', () => {
  it('generates SQL from view name and config', () => {
    const sql = dummyDisplay.buildSql('__utbl_v_0', { foo: 'test' }, []);
    expect(sql).toBe(`SELECT * FROM "__utbl_v_0" WHERE foo = 'test'`);
  });
});

describe('DisplayType.defaultConfig', () => {
  it('returns default configuration', () => {
    expect(dummyDisplay.defaultConfig([])).toEqual({ foo: 'bar' });
  });
});

describe('DisplayConfig', () => {
  it('is a plain serializable object', () => {
    const config: DisplayConfig = {
      id: '1',
      type: 'chart',
      label: 'PnL by Region',
      config: { type: 'bar', x: 'region', y: { field: 'pnl', agg: 'sum' } },
    };
    // Round-trip through JSON
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
  });
});
