import { useCRM } from "../context/CRMContext";
import { profileOf, scopesFor } from "./scopes";
import { useMemo } from "react";
import { usePagedList, type PagedListState } from "./usePagedList";
import type { ScopeFilter } from "./useFirestoreSync";
import type { Lead, User } from "../types/crm";

export const LEADS_PAGE_SIZE = 20;

export type LeadsList = PagedListState<Lead>;

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
  return usePagedList<Lead>({
    collection: "leads",
    scope,
    filters,
    text,
    orderField: "createdAt",
    pageSize: LEADS_PAGE_SIZE,
    enabled,
    searchReady: searchIndexReady,
    toParty: (l) => l,
    scopeFields: ["branchId", "assignedAgentId"],
    inject: injectLeads,
  });
}
