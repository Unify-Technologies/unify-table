import type { TablePlugin, TableContext } from '../types.js';
import type { GroupSummary, Row } from '@unify/table-core';

export interface AggregationDef {
  field: string;
  fn: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface GroupRow {
  __group: true;
  __groupKey: Record<string, unknown>;
  __groupCount: number;
  __expanded: boolean;
  __depth: number;
  __aggs: Record<string, unknown>;
}

export function isGroupRow(row: Row): row is Row & GroupRow {
  return row.__group === true;
}

/** Serialize a group key to a stable string for use in Set/Map. */
export function serializeGroupKey(key: Record<string, unknown>): string {
  return JSON.stringify(
    Object.keys(key)
      .sort()
      .map((k) => [k, key[k]]),
  );
}

interface RowGroupingOptions {
  defaultExpanded?: boolean;
  aggregations?: AggregationDef[];
}

export function rowGrouping(options: RowGroupingOptions = {}): TablePlugin {
  const expandedGroups = new Set<string>();
  const groupDetailCache = new Map<string, Row[]>();
  const groupChildrenCache = new Map<string, GroupSummary[]>();
  let groupSummaries: GroupSummary[] = [];
  let currentAggregations: AggregationDef[] = options.aggregations ?? [];
  let currentGroupBy: string[] = [];

  /** Remove all descendants of a collapsed group from expanded state and caches. */
  function collapseDescendants(parentKey: Record<string, unknown>) {
    const parentFields = Object.keys(parentKey);
    for (const serialized of [...expandedGroups]) {
      // Deserialize to check if this is a descendant
      const entries: [string, unknown][] = JSON.parse(serialized);
      const entryMap = new Map(entries);
      // A descendant has more fields AND matches all parent field values
      if (entryMap.size > parentFields.length) {
        const isDescendant = parentFields.every((f) => entryMap.get(f) === parentKey[f]);
        if (isDescendant) {
          expandedGroups.delete(serialized);
          groupDetailCache.delete(serialized);
          groupChildrenCache.delete(serialized);
        }
      }
    }
  }

  return {
    name: 'rowGrouping',

    shortcuts: {
      ArrowRight: (ctx) => {
        const cell = ctx.activeCell;
        if (!cell) return;
        const row = ctx.rows[cell.rowIndex];
        if (row && isGroupRow(row) && !row.__expanded) {
          ctx.emit('group:toggle', { groupKey: row.__groupKey, depth: row.__depth ?? 0 });
        }
      },
      ArrowLeft: (ctx) => {
        const cell = ctx.activeCell;
        if (!cell) return;
        const row = ctx.rows[cell.rowIndex];
        if (row && isGroupRow(row) && row.__expanded) {
          ctx.emit('group:toggle', { groupKey: row.__groupKey, depth: row.__depth ?? 0 });
        }
      },
    },

    // Grouping is controlled via the tool panel, not the context menu

    init(ctx: TableContext) {
      let fetchingGroups = false;

      async function fetchGroupSummaries(groupByFields: string[]) {
        if (groupByFields.length === 0) {
          const hadGroups = groupSummaries.length > 0;
          groupSummaries = [];
          expandedGroups.clear();
          groupDetailCache.clear();
          groupChildrenCache.clear();
          if (hadGroups) ctx.refresh();
          return;
        }
        if (fetchingGroups) return;
        fetchingGroups = true;
        try {
          const result = await ctx.datasource.fetchGroups(
            { offset: 0, limit: 1000 },
            currentAggregations,
            { depth: 0 },
          );
          groupSummaries = result.groups;

          if (options.defaultExpanded) {
            for (const g of groupSummaries) {
              expandedGroups.add(serializeGroupKey(g.key));
            }
          }

          ctx.refresh();
        } finally {
          fetchingGroups = false;
        }
      }

      const unsub = ctx.on('group', (payload: unknown) => {
        const newGroupBy = payload as string[];
        currentGroupBy = newGroupBy;
        expandedGroups.clear();
        groupDetailCache.clear();
        groupChildrenCache.clear();
        groupSummaries = [];
        fetchGroupSummaries(newGroupBy);
      });

      const unsubData = ctx.on('data', async () => {
        if (currentGroupBy.length > 0 && groupSummaries.length === 0) {
          fetchGroupSummaries(currentGroupBy);
        }
      });

      // Re-fetch groups when sort or filter state changes
      function refetchGroups() {
        if (currentGroupBy.length > 0) {
          groupDetailCache.clear();
          groupChildrenCache.clear();
          fetchingGroups = false;
          fetchGroupSummaries(currentGroupBy);
        }
      }

      const unsubSort = ctx.on('sort', refetchGroups);
      const unsubFilter = ctx.on('filter', refetchGroups);

      // Listen for aggregation changes — re-fetch with new aggs, keep current view while loading
      const unsubAgg = ctx.on('group:aggregations', (payload: unknown) => {
        currentAggregations = payload as AggregationDef[];
        if (currentGroupBy.length > 0) {
          // Clear sub-group caches since agg values changed
          groupChildrenCache.clear();
          // Don't clear groupSummaries or expandedGroups — keep current view while re-fetching
          fetchingGroups = false; // Reset guard so fetch can proceed
          fetchGroupSummaries(currentGroupBy);
        }
      });

      const unsubToggle = ctx.on('group:toggle', (payload: unknown) => {
        const { groupKey, depth } = payload as { groupKey: Record<string, unknown>; depth: number };
        const key = serializeGroupKey(groupKey);
        if (expandedGroups.has(key)) {
          // Collapse
          expandedGroups.delete(key);
          groupDetailCache.delete(key);
          groupChildrenCache.delete(key);
          collapseDescendants(groupKey);
          ctx.refresh();
        } else {
          // Expand
          expandedGroups.add(key);
          const maxDepth = currentGroupBy.length - 1;

          if (depth < maxDepth) {
            // Fetch sub-groups at next depth level
            ctx.datasource.fetchGroups(
              { offset: 0, limit: 1000 },
              currentAggregations,
              { depth: depth + 1, ancestorKeys: groupKey },
            ).then((result) => {
              groupChildrenCache.set(key, result.groups);
              ctx.refresh();
            });
          } else {
            // Fetch detail rows (leaf level)
            ctx.datasource.fetchGroupDetail(groupKey, { offset: 0, limit: 200 }).then((page) => {
              groupDetailCache.set(key, page.rows);
              ctx.refresh();
            });
          }
          ctx.refresh();
        }
      });

      return () => {
        unsub();
        unsubData();
        unsubSort();
        unsubFilter();
        unsubAgg();
        unsubToggle();
      };
    },

    transformRows(rows: Row[]): Row[] {
      if (groupSummaries.length === 0) return rows;

      const maxDepth = currentGroupBy.length - 1;

      function buildLevel(summaries: GroupSummary[], depth: number): Row[] {
        const result: Row[] = [];
        for (const group of summaries) {
          const key = serializeGroupKey(group.key);
          const expanded = expandedGroups.has(key);

          result.push({
            __group: true,
            __groupKey: group.key,
            __groupCount: group.count,
            __expanded: expanded,
            __depth: depth,
            __aggs: group.aggs ?? {},
            ...group.key,
          });

          if (expanded) {
            if (depth < maxDepth) {
              // Insert sub-group rows recursively
              const children = groupChildrenCache.get(key);
              if (children) {
                result.push(...buildLevel(children, depth + 1));
              }
            } else {
              // Insert detail rows
              const cachedDetail = groupDetailCache.get(key);
              if (cachedDetail) {
                result.push(...cachedDetail);
              }
            }
          }
        }
        return result;
      }

      return buildLevel(groupSummaries, 0);
    },
  };
}

/** Toggle a group's expanded state. Returns whether the group is now expanded. */
export function toggleGroup(
  ctx: TableContext,
  groupRow: GroupRow,
  expandedGroups: Set<string>,
  groupDetailCache: Map<string, Row[]>,
): boolean {
  const key = serializeGroupKey(groupRow.__groupKey);
  if (expandedGroups.has(key)) {
    expandedGroups.delete(key);
    groupDetailCache.delete(key);
    ctx.refresh();
    return false;
  }
  expandedGroups.add(key);
  ctx.datasource.fetchGroupDetail(groupRow.__groupKey, { offset: 0, limit: 200 }).then((page) => {
    groupDetailCache.set(key, page.rows);
    ctx.refresh();
  });
  return true;
}
