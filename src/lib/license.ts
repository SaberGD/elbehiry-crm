import type { Branch } from "../types/crm";

/** The current plan allows this many branches. Raising it is a commercial decision made by the developer. */
export const DEFAULT_MAX_BRANCHES = 2;

export interface License {
  maxBranches: number;
}
export const defaultLicense: License = { maxBranches: DEFAULT_MAX_BRANCHES };

export interface BranchQuota {
  max: number;
  used: number;
  left: number;
  full: boolean;
}

/** Sample branches never count: they come and go with the sample data. */
export function branchQuota(branches: Pick<Branch, "active" | "isDemo">[], license: License = defaultLicense): BranchQuota {
  const max = Math.max(0, Math.floor(Number(license.maxBranches)) || 0);
  const used = branches.filter((b) => !b.isDemo && b.active !== false).length;
  return { max, used, left: Math.max(0, max - used), full: used >= max };
}

export const branchLimitMessage = (q: BranchQuota) =>
  `الباقة الحالية للشركة بتسمح بـ ${q.max === 1 ? "فرع واحد" : q.max === 2 ? "فرعين" : `${q.max} فروع`} فقط. للتوسعة كلّم المطوّر.`;
