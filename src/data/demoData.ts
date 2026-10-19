import type { User } from "../types/crm";
import {
  initialUsers,
  initialLeads,
  initialVisits,
  initialFollowUps,
  initialBookings,
  initialTimelineEvents,
  initialPurchaseInvoices,
  initialBrokers,
} from "./initialData";

const base = {
  active: true,
  createdAt: "2025-01-01T08:00:00Z",
  phone: "01000000000",
} as const;

// One demo account per permission profile, so the director can use "View As"
// to see the system through every role.
export const demoStaffExtras: User[] = [
  {
    ...base,
    id: "usr-demo-regional",
    name: "هشام عادل (مشرف عام)",
    email: "regional@demo.elbehiry",
    role: "regional_manager",
    supervisedBranchIds: ["br-cairo", "br-giza"],
  },
  {
    ...base,
    id: "usr-demo-sup-sales",
    name: "نادين سامي (مشرف مختص · مبيعات)",
    email: "sup.sales@demo.elbehiry",
    role: "supervisor",
    specialty: "sales",
    branchId: "br-cairo",
    supervisedBranchIds: ["br-cairo", "br-alex"],
  },
  {
    ...base,
    id: "usr-demo-sup-accounts",
    name: "طارق منير (مشرف مختص · حسابات)",
    email: "sup.accounts@demo.elbehiry",
    role: "supervisor",
    specialty: "accounts",
    branchId: "br-cairo",
    supervisedBranchIds: ["br-cairo", "br-giza"],
  },
  {
    ...base,
    id: "usr-demo-sup-ops",
    name: "إيهاب رشدي (مشرف مختص · تشغيل الفروع)",
    email: "sup.ops@demo.elbehiry",
    role: "supervisor",
    specialty: "operations",
    branchId: "br-giza",
    supervisedBranchIds: ["br-giza", "br-alex"],
  },
];

export const demoUsers: User[] = [
  ...initialUsers.filter((u) => u.role !== "admin"),
  ...demoStaffExtras,
];
export const demoLeads = initialLeads;
export const demoVisits = initialVisits;
export const demoFollowUps = initialFollowUps;
export const demoBookings = initialBookings;
export const demoTimeline = initialTimelineEvents;
export const demoInvoices = initialPurchaseInvoices;
export const demoBrokers = initialBrokers;
