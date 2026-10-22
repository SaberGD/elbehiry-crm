import { collection, documentId, getCountFromServer, getDocs, limit, orderBy, query, startAfter, where, type Query } from "firebase/firestore";
import { countRead, db } from "./firebase";
import { hasMoreRows, rowMatches, takeNext, type Key, type PlannedStream, type StreamState } from "./pagedMerge";

export interface PagedOptions<T> {
  collection: string;
  /** What to ask of the database (see `planStreams`). */
  streams: PlannedStream[];
  /** Field the list is ordered by, newest first. */
  orderField: string;
  pageSize: number;
  /** A key from `searchKeys`; the queries that can take it return only rows that carry it. */
  searchKey?: string;
  /** Any further check on a row read (the rest of a search, a condition the database cannot check). */
  check?: (row: T, stream: PlannedStream) => boolean;
}

interface Stream<T> extends StreamState<T> {
  planned: PlannedStream;
}

const MAX_ROUNDS = 12;
const EARLY_ROUNDS = 1;

function build(name: string, s: PlannedStream, o: { searchKey?: string; orderField: string }, cursor: Key | null, n: number): Query {
  return query(
    collection(db, name),
    ...s.filters.map(([f, op, v]) => where(f, op, v)),
    ...(s.db && o.searchKey ? [where("searchKeys", "array-contains", o.searchKey)] : []),
    orderBy(o.orderField, "desc"),
    orderBy(documentId(), "desc"),
    ...(cursor ? [startAfter(cursor.v, cursor.id)] : []),
    limit(n),
  );
}

/**
 * Reads a list a page at a time, newest first. Several queries (a person's own customers and the ones
 * delegated to them, say) are merged so the list is in the same order as one query would give.
 */
export function createPagedList<T extends { id: string }>(o: PagedOptions<T>) {
  const streams: Stream<T>[] = o.streams.map((planned) => ({ planned, buffer: [], cursor: null, done: false }));
  const keyOf = (r: T): Key => ({ v: String((r as Record<string, unknown>)[o.orderField] ?? ""), id: r.id });
  const seen = new Set<string>();
  const filtering = !!o.check || streams.some((s) => s.planned.client.length > 0);

  async function fill(s: Stream<T>) {
    const n = filtering ? o.pageSize * 2 : o.pageSize;
    const snap = await getDocs(build(o.collection, s.planned, o, s.cursor, n));
    countRead(snap.size, `${o.collection}/page`);
    const rows = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
    if (rows.length) s.cursor = keyOf(rows[rows.length - 1]);
    if (snap.docs.length < n) s.done = true;
    s.buffer.push(...rows.filter((r) => rowMatches(r, s.planned.client) && (o.check ? o.check(r, s.planned) : true)));
  }

  return {
    /** The next page: returns the rows and whether there are more. */
    async next(): Promise<{ rows: T[]; hasMore: boolean }> {
      const rows: T[] = [];
      for (let round = 0; round < MAX_ROUNDS && rows.length < o.pageSize; round++) {
        const lacking = streams.filter((s) => !s.done && s.buffer.length < o.pageSize);
        await Promise.all(lacking.map(fill));
        rows.push(...takeNext(streams, o.pageSize - rows.length, keyOf, (r) => r.id, seen));
        if (!hasMoreRows(streams)) break;
        // Something was found: show it now rather than scanning on to fill the page ("show more" continues).
        if (rows.length > 0 && round >= EARLY_ROUNDS) break;
      }
      return { rows, hasMore: hasMoreRows(streams) };
    },
    /** How many rows match, or null when that cannot be told without reading them. */
    async count(): Promise<number | null> {
      if (o.check || streams.some((s) => s.planned.client.length > 0 || (o.searchKey && !s.planned.db))) return null;
      const counts = await Promise.all(
        streams.map(async (s) => {
          const q = query(collection(db, o.collection), ...s.planned.filters.map(([f, op, v]) => where(f, op, v)), ...(o.searchKey ? [where("searchKeys", "array-contains", o.searchKey)] : []));
          const n = (await getCountFromServer(q)).data().count;
          countRead(Math.max(1, Math.ceil(n / 1000)), `${o.collection}/count`);
          return n;
        }),
      );
      return counts.reduce((a, b) => a + b, 0);
    },
  };
}
