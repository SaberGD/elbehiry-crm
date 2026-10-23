import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { matchesKey, matchesSearch, parseSearch } from "./leadSearch";
import { createPagedList } from "./pagedList";
import { planFilters, planStreams } from "./pagedMerge";
import type { Scope, ScopeFilter } from "./useFirestoreSync";
import type { Lead } from "../types/crm";

export interface PagedListState<T> {
  rows: T[];
  /** How many match, when the database can say. */
  total: number | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string;
  /** What was typed is too short to search by. */
  searchTooShort: boolean;
  /** The database cannot answer yet (no index, or the search keys are not built): the screen should use the full list. */
  needsFullList: boolean;
  loadMore: () => void;
  refresh: () => void;
  /** Everything that matches, read a large page at a time (for exports). */
  readAll: () => Promise<T[]>;
}

export interface PagedListConfig<T extends { id: string }> {
  collection: string;
  scope: Scope;
  filters: ScopeFilter[];
  text: string;
  /** The field the list is ordered by, newest first. */
  orderField: string;
  pageSize: number;
  enabled?: boolean;
  /** Whether the rows carry the keys the text search uses. */
  searchReady: boolean;
  /** What a row can be found by (see `leadSearch.ts`). */
  toParty: (row: T) => Pick<Lead, "name" | "phone" | "whatsappPhone" | "courseOfInterest">;
  /** A condition the database cannot check (a field that may be missing), applied to the rows read. */
  keep?: (row: T) => boolean;
  /** Hands every row read to the working set, so it can be opened and edited like any other. */
  inject: (rows: T[]) => void;
  /** Changes whenever `keep` would answer differently, so the list starts over. */
  listKey?: string;
  /** Fields the person's scope already pins (branch, employee): filters on them can go with a date range. */
  scopeFields?: string[];
}

/** A list read a page at a time, newest first, filtered and searched by the database. */
export function usePagedList<T extends { id: string }>(cfg: PagedListConfig<T>): PagedListState<T> {
  const { collection, scope, filters, text, orderField, pageSize, enabled = true, searchReady, toParty, keep, inject, listKey = "" } = cfg;
  const search = useMemo(() => parseSearch(text), [text]);
  const searchId = JSON.stringify(search);
  const searchTooShort = text.trim().length > 0 && !search;
  const needsIndex = !!search && !searchReady;

  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [indexMissing, setIndexMissing] = useState(false);
  const [version, setVersion] = useState(0);
  const listRef = useRef<ReturnType<typeof createPagedList<T>> | null>(null);
  const token = useRef(0);
  // The latest callbacks, without making the list start over every time they are recreated.
  const latest = useRef({ keep, toParty, inject });
  latest.current = { keep, toParty, inject };

  const filtersKey = JSON.stringify(filters);
  const scopeKey = JSON.stringify(scope);
  const active = enabled && !needsIndex && !indexMissing;

  const build = (size: number) => {
    const plan = planFilters(filters, { searching: !!search, scopeFields: cfg.scopeFields ?? [] });
    const restSearch = !!search && (search.words.length > 0 || search.digits.length > 0);
    const streams = planStreams(scope, plan);
    // With a plain key lookup on every query there is nothing left to check, and the total can be counted.
    const hasCheck = !!latest.current.keep || (!!search && (restSearch || streams.some((x) => !x.db)));
    return createPagedList<T>({
      collection,
      streams,
      orderField,
      pageSize: size,
      searchKey: search?.key,
      check: hasCheck
        ? (r, stream) => {
            if (latest.current.keep && !latest.current.keep(r)) return false;
            if (!search) return true;
            const party = latest.current.toParty(r);
            // A query that took the key has only the rest of the search to check; one that could not has all of it.
            return stream.db ? !restSearch || matchesSearch(party, search) : matchesKey(party, search.key) && matchesSearch(party, search);
          }
        : undefined,
    });
  };

  useEffect(() => {
    const mine = ++token.current;
    listRef.current = null;
    setRows([]);
    setHasMore(false);
    setError("");
    setTotal(null);
    if (!active) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = build(pageSize);
    listRef.current = list;
    list
      .next()
      .then((page) => {
        if (mine !== token.current) return;
        latest.current.inject(page.rows);
        setRows(page.rows);
        setHasMore(page.hasMore);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (mine !== token.current) return;
        if ((e as { code?: string })?.code === "failed-precondition") setIndexMissing(true);
        else setError("تعذّر التحميل. جرّب تاني.");
        setLoading(false);
      });
    // The total is a separate, cheap count; the list does not wait for it.
    list.count().then((n) => mine === token.current && setTotal(n)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, collection, scopeKey, filtersKey, searchId, listKey, version]);

  const loadMore = useCallback(() => {
    const list = listRef.current;
    const mine = token.current;
    if (!list || loadingMore) return;
    setLoadingMore(true);
    list
      .next()
      .then((page) => {
        if (mine !== token.current) return;
        latest.current.inject(page.rows);
        setRows((prev) => [...prev, ...page.rows]);
        setHasMore(page.hasMore);
      })
      .catch(() => mine === token.current && setError("تعذّر تحميل المزيد. جرّب تاني."))
      .finally(() => setLoadingMore(false));
  }, [loadingMore]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const readAll = async () => {
    const everything = build(500);
    const out: T[] = [];
    for (let more = true; more && out.length < 20000; ) {
      const page = await everything.next();
      out.push(...page.rows);
      more = page.hasMore;
    }
    return out;
  };

  return { rows, total, hasMore, loading, loadingMore, error, searchTooShort, needsFullList: !!enabled && (needsIndex || indexMissing), loadMore, refresh, readAll };
}
