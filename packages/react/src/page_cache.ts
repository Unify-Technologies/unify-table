import type { Row } from "@unify/table-core";

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
  let _flat: Row[] = [];
  let _flatDirty = true;

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
      _flatDirty = true;
      while (accessOrder.length > MAX_CACHED_PAGES) {
        const oldest = accessOrder.shift()!;
        pages.delete(oldest);
      }
    },
    clear() {
      pages.clear();
      accessOrder.length = 0;
      _flat = [];
      _flatDirty = true;
    },
    flatten(totalCount: number, pageSize: number): Row[] {
      // Reuse the existing array when possible to avoid O(totalCount) allocation per call
      if (_flat.length !== totalCount) {
        _flat = new Array(totalCount);
        _flatDirty = true;
      }
      if (_flatDirty) {
        for (const [pageIdx, rows] of pages) {
          const offset = pageIdx * pageSize;
          for (let i = 0; i < rows.length; i++) {
            _flat[offset + i] = rows[i];
          }
        }
        _flatDirty = false;
      }
      return _flat;
    },
  };
}
