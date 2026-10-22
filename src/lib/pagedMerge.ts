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
