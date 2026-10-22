import { useEffect, useMemo, useState } from "react";
import { countLeads } from "./leadQueries";
import { statusNames } from "./presentation";
import { profileOf, scopesFor } from "./scopes";
import type { User } from "../types/crm";

/** Customers whose file is still open: not bought yet and not lost. */
export const OPEN_STATUSES = Object.keys(statusNames).filter((s) => !["booked", "not_interested"].includes(s));

export interface LeadCounts {
  ready: boolean;
  /** Customers in the person's scope (narrowed to one branch when one is chosen). */
  total: number;
  byBranch: Record<string, { count: number; open: number }>;
}

/**
 * The numbers a dashboard needs from the customer list, asked of the database as counts (one read per thousand
 * customers) instead of reading every customer.
 */
export function useLeadCounts(user: User, branchFilter: string, branchIds: string[], enabled: boolean): LeadCounts {
  const scope = useMemo(
    () => scopesFor(profileOf(user)).leads,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user.id, user.role, user.branchId, JSON.stringify(user.supervisedBranchIds ?? [])],
  );
  const [counts, setCounts] = useState<LeadCounts>({ ready: false, total: 0, byBranch: {} });
  const ids = branchIds.join(",");

  useEffect(() => {
    if (!enabled) return setCounts({ ready: true, total: 0, byBranch: {} });
    let current = true;
    const one = branchFilter === "all" ? [] : ([["branchId", "==", branchFilter]] as [string, "==", string][]);
    const shown = (ids ? ids.split(",") : []).filter((b) => branchFilter === "all" || b === branchFilter);
    Promise.all([
      countLeads(scope, one),
      ...shown.map(async (b) => {
        const [count, open] = await Promise.all([
          countLeads(scope, [["branchId", "==", b]]),
          countLeads(scope, [["branchId", "==", b]], [["status", "in", OPEN_STATUSES]]),
        ]);
        return [b, { count, open }] as const;
      }),
    ])
      .then(([total, ...rows]) => current && setCounts({ ready: true, total, byBranch: Object.fromEntries(rows) }))
      .catch(() => current && setCounts({ ready: true, total: 0, byBranch: {} }));
    return () => {
      current = false;
    };
  }, [enabled, scope, branchFilter, ids]);

  return counts;
}
