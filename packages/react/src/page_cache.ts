import type { Row } from '@unify/table-core';

const MAX_CACHED_PAGES = 10;

export interface PageCache {
  pages: Map<number, Row[]>;
  get(pageIdx: number): Row[] | undefined;
  set(pageIdx: number, rows: Row[]): void;
  clear(): void;
  /** Build a flat row array for virtualizer: rows[0..totalCount-1], undefined for unfetched */
  flatten(totalCount: number, pageSize: number): Row[];
}

export function createPageCache(): PageCache {
  const pages = new Map<number, Row[]>();
  const accessOrder: number[] = [];

  function touch(pageIdx: number) {
    const i = accessOrder.indexOf(pageIdx);
    if (i !== -1) accessOrder.splice(i, 1);
    accessOrder.push(pageIdx);
  }

  return {
    pages,
    get(pageIdx: number) {
      const p = pages.get(pageIdx);
      if (p) touch(pageIdx);
      return p;
    },
    set(pageIdx: number, rows: Row[]) {
      pages.set(pageIdx, rows);
      touch(pageIdx);
      while (accessOrder.length > MAX_CACHED_PAGES) {
        const oldest = accessOrder.shift()!;
        pages.delete(oldest);
      }
    },
    clear() {
      pages.clear();
      accessOrder.length = 0;
    },
    flatten(totalCount: number, pageSize: number): Row[] {
      const result: Row[] = new Array(totalCount);
      for (const [pageIdx, rows] of pages) {
        const offset = pageIdx * pageSize;
        for (let i = 0; i < rows.length; i++) {
          result[offset + i] = rows[i];
        }
      }
      return result;
    },
  };
}
