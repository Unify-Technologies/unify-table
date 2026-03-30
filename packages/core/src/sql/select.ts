import type { SqlFragment, SortDir } from '../types.js';
import { quoteIdent, toSqlLiteral } from './utils.js';

/** Chainable SQL query builder. Immutable — each method returns a new instance. */
interface Query {
  from(table: string): Query;
  where(...clauses: SqlFragment[]): Query;
  groupBy(...fields: string[]): Query;
  orderBy(field: string, dir?: SortDir): Query;
  limit(n: number): Query;
  offset(n: number): Query;
  sql(): string;
  toString(): string;
}

interface QueryState {
  selectClause: string;
  fromClause: string;
  whereClauses: string[];
  groupByFields: string[];
  orderByClauses: string[];
  limitValue: number | null;
  offsetValue: number | null;
}

function createQuery(state: QueryState): Query {
  return {
    from(table: string) {
      return createQuery({ ...state, fromClause: quoteIdent(table) });
    },
    where(...clauses: SqlFragment[]) {
      return createQuery({
        ...state,
        whereClauses: [...state.whereClauses, ...clauses.map((c) => c.sql)],
      });
    },
    groupBy(...fields: string[]) {
      return createQuery({
        ...state,
        groupByFields: [...state.groupByFields, ...fields],
      });
    },
    orderBy(field: string, dir: SortDir = 'asc') {
      return createQuery({
        ...state,
        orderByClauses: [...state.orderByClauses, `${quoteIdent(field)} ${dir.toUpperCase()}`],
      });
    },
    limit(n: number) {
      return createQuery({ ...state, limitValue: n });
    },
    offset(n: number) {
      return createQuery({ ...state, offsetValue: n });
    },
    sql() {
      const parts: string[] = [`SELECT ${state.selectClause}`];

      if (state.fromClause) parts.push(`FROM ${state.fromClause}`);
      if (state.whereClauses.length > 0) parts.push(`WHERE ${state.whereClauses.join(' AND ')}`);
      if (state.groupByFields.length > 0)
        parts.push(`GROUP BY ${state.groupByFields.map(quoteIdent).join(', ')}`);
      if (state.orderByClauses.length > 0) parts.push(`ORDER BY ${state.orderByClauses.join(', ')}`);
      if (state.limitValue !== null) parts.push(`LIMIT ${state.limitValue}`);
      if (state.offsetValue !== null) parts.push(`OFFSET ${state.offsetValue}`);

      return parts.join(' ');
    },
    toString() {
      return this.sql();
    },
  };
}

function emptyState(selectClause: string): QueryState {
  return {
    selectClause,
    fromClause: '',
    whereClauses: [],
    groupByFields: [],
    orderByClauses: [],
    limitValue: null,
    offsetValue: null,
  };
}

/** Start building a SELECT query. */
export function select(...fields: string[]): Query {
  const clause = fields.length === 0 ? '*' : fields.map(quoteIdent).join(', ');
  return createQuery(emptyState(clause));
}

// --- Mutation builders ---

interface UpdateQuery {
  set(field: string, value: unknown): UpdateQuery;
  where(...clauses: SqlFragment[]): UpdateQuery;
  sql(): string;
  toString(): string;
}

interface UpdateState {
  table: string;
  sets: string[];
  whereClauses: string[];
}

function createUpdateQuery(state: UpdateState): UpdateQuery {
  return {
    set(field: string, value: unknown) {
      return createUpdateQuery({
        ...state,
        sets: [...state.sets, `${quoteIdent(field)} = ${toSqlLiteral(value)}`],
      });
    },
    where(...clauses: SqlFragment[]) {
      return createUpdateQuery({
        ...state,
        whereClauses: [...state.whereClauses, ...clauses.map((c) => c.sql)],
      });
    },
    sql() {
      if (state.sets.length === 0) throw new Error('UPDATE requires at least one SET clause');
      const parts = [`UPDATE ${quoteIdent(state.table)} SET ${state.sets.join(', ')}`];
      if (state.whereClauses.length > 0) parts.push(`WHERE ${state.whereClauses.join(' AND ')}`);
      return parts.join(' ');
    },
    toString() {
      return this.sql();
    },
  };
}

/** Start building an UPDATE query. */
export function update(table: string): UpdateQuery {
  return createUpdateQuery({ table, sets: [], whereClauses: [] });
}

interface InsertQuery {
  values(data: Record<string, unknown>): InsertQuery;
  sql(): string;
  toString(): string;
}

interface InsertState {
  table: string;
  rows: Record<string, unknown>[];
}

function createInsertQuery(state: InsertState): InsertQuery {
  return {
    values(data: Record<string, unknown>) {
      return createInsertQuery({ ...state, rows: [...state.rows, data] });
    },
    sql() {
      if (state.rows.length === 0) throw new Error('INSERT requires at least one row');
      const columns = Object.keys(state.rows[0]);
      const colList = columns.map(quoteIdent).join(', ');
      const valuesList = state.rows
        .map((row) => `(${columns.map((c) => toSqlLiteral(row[c])).join(', ')})`)
        .join(', ');
      return `INSERT INTO ${quoteIdent(state.table)} (${colList}) VALUES ${valuesList}`;
    },
    toString() {
      return this.sql();
    },
  };
}

/** Start building an INSERT query. */
export function insertInto(table: string): InsertQuery {
  return createInsertQuery({ table, rows: [] });
}

interface DeleteQuery {
  where(...clauses: SqlFragment[]): DeleteQuery;
  sql(): string;
  toString(): string;
}

interface DeleteState {
  table: string;
  whereClauses: string[];
}

function createDeleteQuery(state: DeleteState): DeleteQuery {
  return {
    where(...clauses: SqlFragment[]) {
      return createDeleteQuery({
        ...state,
        whereClauses: [...state.whereClauses, ...clauses.map((c) => c.sql)],
      });
    },
    sql() {
      const parts = [`DELETE FROM ${quoteIdent(state.table)}`];
      if (state.whereClauses.length > 0) parts.push(`WHERE ${state.whereClauses.join(' AND ')}`);
      return parts.join(' ');
    },
    toString() {
      return this.sql();
    },
  };
}

/** Start building a DELETE query. */
export function deleteFrom(table: string): DeleteQuery {
  return createDeleteQuery({ table, whereClauses: [] });
}
