import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCRM } from "../context/CRMContext";
import { countLeads } from "./leadQueries";
import { matchesKey, matchesSearch, parseSearch } from "./leadSearch";
import { createPagedList } from "./pagedList";
import { restrictStreams } from "./pagedMerge";
import { profileOf, scopesFor } from "./scopes";
import type { ScopeFilter } from "./useFirestoreSync";
import type { Lead, User } from "../types/crm";

export const LEADS_PAGE_SIZE = 20;

export interface LeadsList {
  rows: Lead[];
  /** How many customers match, when the database can say. */
  total: number | null;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string;
  /** What was typed is too short to search by. */
  searchTooShort: boolean;
  /** The database cannot answer yet (no index, or customers not yet indexed): the screen should use the full list instead. */
  needsFullList: boolean;
  loadMore: () => void;
  refresh: () => void;
  /** Every customer that matches, read a large page at a time (for exports). */
  readAll: () => Promise<Lead[]>;
}

/**
 * Customers a page at a time, newest first, filtered and searched by the database.
 * Every row read is also handed to the working set, so it can be opened and edited like any other.
 */
export function useLeadsList(user: User, filters: ScopeFilter[], text: string, enabled = true): LeadsList {
  const { injectLeads, searchIndexReady } = useCRM();
  const scope = useMemo(
    () => scopesFor(profileOf(user)).leads,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user.id, user.role, user.branchId, JSON.stringify(user.supervisedBranchIds ?? [])],
  );
  const search = useMemo(() => parseSearch(text), [text]);
  const searchId = JSON.stringify(search);
  const searchTooShort = text.trim().length > 0 && !search;
  const needsIndex = !!search && !searchIndexReady;

  const [rows, setRows] = useState<Lead[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [indexMissing, setIndexMissing] = useState(false);
  const [version, setVersion] = useState(0);
  const listRef = useRef<ReturnType<typeof createPagedList<Lead>> | null>(null);
  const token = useRef(0);

  const filtersKey = JSON.stringify(filters);
  const active = enabled && !needsIndex && !indexMissing;

  const build = (pageSize: number) => {
    const rest = !!search && (search.words.length > 0 || search.digits.length > 0);
    return createPagedList<Lead>({
      collection: "leads",
      streams: restrictStreams(scope, filters),
      orderField: "createdAt",
      pageSize,
      searchKey: search?.key,
      keep: rest && search ? (l) => matchesSearch(l, search) : undefined,
      keepWithoutKey: search ? (l) => matchesKey(l, search.key) && matchesSearch(l, search) : undefined,
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
    const list = build(LEADS_PAGE_SIZE);
    listRef.current = list;
    const fail = (e: unknown) => {
      if (mine !== token.current) return;
      const code = (e as { code?: string })?.code;
      if (code === "failed-precondition") setIndexMissing(true);
      else setError("تعذّر تحميل العملاء. جرّب تاني.");
      setLoading(false);
    };
    list
      .next()
      .then((page) => {
        if (mine !== token.current) return;
        injectLeads(page.rows);
        setRows(page.rows);
        setHasMore(page.hasMore);
        setLoading(false);
      })
      .catch(fail);
    // The total is a separate, cheap count; the list does not wait for it.
    if (!search) countLeads(scope, filters).then((n) => mine === token.current && setTotal(n)).catch(() => {});
    else list.count().then((n) => mine === token.current && setTotal(n)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, scope, filtersKey, searchId, version]);

  const loadMore = useCallback(() => {
    const list = listRef.current;
    const mine = token.current;
    if (!list || loadingMore) return;
    setLoadingMore(true);
    list
      .next()
      .then((page) => {
        if (mine !== token.current) return;
        injectLeads(page.rows);
        setRows((prev) => [...prev, ...page.rows]);
        setHasMore(page.hasMore);
      })
      .catch(() => mine === token.current && setError("تعذّر تحميل المزيد. جرّب تاني."))
      .finally(() => setLoadingMore(false));
  }, [injectLeads, loadingMore]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const readAll = async () => {
    const everything = build(500);
    const out: Lead[] = [];
    for (let more = true; more && out.length < 20000; ) {
      const page = await everything.next();
      out.push(...page.rows);
      more = page.hasMore;
    }
    return out;
  };

  return { rows, total, hasMore, loading, loadingMore, error, searchTooShort, needsFullList: !!enabled && (needsIndex || indexMissing), loadMore, refresh, readAll };
}
