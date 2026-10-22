import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { countRead, db } from "./firebase";
import { matchesKey, matchesSearch, parseSearch, phoneDigits } from "./leadSearch";
import { createPagedList } from "./pagedList";
import { planFilters, planStreams, restrictStreams } from "./pagedMerge";
import type { Scope, ScopeFilter } from "./useFirestoreSync";
import type { Lead } from "../types/crm";

/** Customers matching what was typed (name beginnings, phone beginnings or endings), newest first. */
export async function searchLeads(scope: Scope, text: string, size = 8, filters: ScopeFilter[] = []): Promise<Lead[]> {
  const s = parseSearch(text);
  if (!s) return [];
  const list = createPagedList<Lead>({
    collection: "leads",
    streams: planStreams(scope, planFilters(filters, { searching: true, scopeFields: [] })),
    orderField: "createdAt",
    pageSize: size,
    searchKey: s.key,
    // A query that took the key has only the rest of the search left to check; one that could not has it all.
    check: (l, stream) => (stream.db ? matchesSearch(l, s) : matchesKey(l, s.key) && matchesSearch(l, s)),
  });
  return (await list.next()).rows;
}

/** Customers that have this phone number (as their number or their WhatsApp), among the ones the person can see. */
export async function findLeadsByPhone(scope: Scope, phone: string, excludeId?: string): Promise<Lead[]> {
  const d = phoneDigits(phone);
  if (d.length < 10) return [];
  const tail = d.slice(-10);
  const rows = await searchLeads(scope, tail, 10);
  return rows.filter((l) => l.id !== excludeId && [l.phone, l.whatsappPhone || ""].some((p) => phoneDigits(p).slice(-10) === tail));
}

/** How many documents of a collection match the filters (and the extra conditions), without reading them. */
export async function countDocs(collectionName: string, scope: Scope, filters: ScopeFilter[] = [], extra: ScopeFilter[] = []): Promise<number> {
  const counts = await Promise.all(
    restrictStreams(scope, filters).map(async (stream) => {
      const q = query(collection(db, collectionName), ...[...stream, ...extra].map(([f, op, v]) => where(f, op, v)));
      const n = (await getCountFromServer(q)).data().count;
      countRead(Math.max(1, Math.ceil(n / 1000)), `${collectionName}/count`);
      return n;
    }),
  );
  return counts.reduce((a, b) => a + b, 0);
}

/** How many customers match the filters, without reading them. */
export const countLeads = (scope: Scope, filters: ScopeFilter[] = [], extra: ScopeFilter[] = []) => countDocs("leads", scope, filters, extra);
