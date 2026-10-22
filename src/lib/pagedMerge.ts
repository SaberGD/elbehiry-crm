import type { Scope, ScopeFilter } from "./useFirestoreSync";

/**
 * Pure parts of paged reading, kept apart from the database so they can be tested:
 * narrowing a person's scope by what they filtered, and merging several ordered queries into one list.
 */

/**
 * The queries that answer "what this person may see, narrowed by these filters". Empty when nothing can match.
 * An equality on a field the scope already pins is checked against it; any other filter is simply added.
 */
export function restrictStreams(scope: Scope, filters: ScopeFilter[]): ScopeFilter[][] {
  if (scope === "none") return [];
  let streams: ScopeFilter[][] = scope === "all" ? [[]] : scope.map((s) => [...s]);
  for (const [field, op, value] of filters) {
    if (op !== "==") {
      streams = streams.map((s): ScopeFilter[] => [...s, [field, op, value]]);
      continue;
    }
    streams = streams.flatMap((s): ScopeFilter[][] => {
      const at = s.findIndex(([f, o]) => f === field && (o === "==" || o === "in"));
      if (at < 0) return [[...s, [field, "==", value]]];
      const [, o, v] = s[at];
      if (o === "==") return v === value ? [s] : [];
      if (Array.isArray(v) && v.includes(value)) return [s.map((f, i): ScopeFilter => (i === at ? [field, "==", value] : f))];
      return [];
    });
  }
  return streams;
}

export interface Key {
  /** Value of the ordering field (a date string). */
  v: string;
  id: string;
}

/** Newest first, ties broken by id the same way the database does (both descending). */
export function compareKeys(a: Key, b: Key): number {
  if (a.v !== b.v) return a.v < b.v ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
}

export interface StreamState<T> {
  /** Rows read from this query and not yet shown, newest first. */
  buffer: T[];
  /** Where the next read of this query continues. */
  cursor: Key | null;
  done: boolean;
}

/**
 * Takes up to `size` rows from the front of the merged streams. A row is only taken when no stream that
 * still has unread rows could hold something newer, so the order is exactly what one query would give.
 */
export function takeNext<T>(
  streams: StreamState<T>[],
  size: number,
  keyOf: (row: T) => Key,
  idOf: (row: T) => string,
  seen: Set<string>,
): T[] {
  // Unread rows of a stream are all older than its cursor.
  const limit = streams.filter((s) => !s.done && s.cursor).map((s) => s.cursor as Key);
  const out: T[] = [];
  while (out.length < size) {
    let best: StreamState<T> | null = null;
    for (const s of streams) {
      if (!s.buffer.length) continue;
      if (!best || compareKeys(keyOf(s.buffer[0]), keyOf(best.buffer[0])) < 0) best = s;
    }
    if (!best) break;
    const row = best.buffer[0];
    const k = keyOf(row);
    // A stream with unread rows whose cursor is not older than this row could still hold something that belongs before it.
    if (limit.some((c) => compareKeys(k, c) >= 0 && !(c.v === k.v && c.id === k.id))) break;
    best.buffer.shift();
    if (seen.has(idOf(row))) continue;
    seen.add(idOf(row));
    out.push(row);
  }
  return out;
}

/** True when some stream still has rows to show or to read. */
export const hasMoreRows = <T,>(streams: StreamState<T>[]) => streams.some((s) => s.buffer.length > 0 || !s.done);

export const RANGE_OPS = ["<", "<=", ">", ">="];

/** A value inside a row, by dotted path ("response.rating"). */
export function valueAt(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((v, k) => (v && typeof v === "object" ? (v as Record<string, unknown>)[k] : undefined), row);
}

/** Whether a row satisfies filters the way the database would (for the ones the database is not asked). */
export function rowMatches(row: unknown, filters: ScopeFilter[]): boolean {
  return filters.every(([field, op, want]) => {
    const v = valueAt(row, field);
    switch (op) {
      case "==":
        return v === want;
      case "in":
        return Array.isArray(want) && want.includes(v);
      case "array-contains":
        return Array.isArray(v) && v.includes(want);
      case ">=":
        return v !== undefined && v !== null && (v as never) >= (want as never);
      case ">":
        return v !== undefined && v !== null && (v as never) > (want as never);
      case "<=":
        return v !== undefined && v !== null && (v as never) <= (want as never);
      case "<":
        return v !== undefined && v !== null && (v as never) < (want as never);
      default:
        return false;
    }
  });
}

export interface FilterPlan {
  /** Asked of the database. */
  db: ScopeFilter[];
  /** Checked on the rows that come back. */
  client: ScopeFilter[];
}

/**
 * Which filters the database is asked and which are checked on the rows. Equality filters alone are merged from
 * single-field indexes, so they all go to the database. A text search, or a date/number range, would need an index
 * for every combination with other filters, so then only the filters on the fields the person's scope already pins
 * (branch, employee) go with a range, and none go with a search.
 */
export function planFilters(filters: ScopeFilter[], opts: { searching: boolean; scopeFields: string[] }): FilterPlan {
  if (opts.searching) return { db: [], client: filters };
  const range = filters.some(([, op]) => RANGE_OPS.includes(op));
  if (!range) return { db: filters, client: [] };
  const db = filters.filter(([field, op]) => RANGE_OPS.includes(op) || opts.scopeFields.includes(field));
  return { db, client: filters.filter((f) => !db.includes(f)) };
}

export interface PlannedStream {
  filters: ScopeFilter[];
  /** False for a query that already holds an array filter: it can take no more, so the rest is checked on the rows. */
  db: boolean;
  /** Filters checked on this stream's rows. */
  client: ScopeFilter[];
}

const hasArray = (filters: ScopeFilter[]) => filters.some(([, op]) => op === "array-contains" || op === "array-contains-any");

/** The queries to run for a scope and a plan; queries the filters rule out are left out. */
export function planStreams(scope: Scope, plan: FilterPlan): PlannedStream[] {
  if (scope === "none") return [];
  const base: ScopeFilter[][] = scope === "all" ? [[]] : scope;
  return base.flatMap((stream): PlannedStream[] => {
    if (hasArray(stream)) return [{ filters: stream, db: false, client: [...plan.db, ...plan.client] }];
    return restrictStreams([stream], plan.db).map((filters) => ({ filters, db: true, client: plan.client }));
  });
}
