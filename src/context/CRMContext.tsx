import {
  normalizeUser,
  sanitizeMatrix,
  type PermissionMatrix,
} from "../lib/permissions";
import { createWorkspace } from "../lib/workspace";
import { newReviewToken } from "../lib/reviews";
import { egyptGovernorates, findEgyptGovernorate } from "../data/egypt";
import {
  demoUsers,
  demoReviews,
  demoLeads,
  demoVisits,
  demoFollowUps,
  demoBookings,
  demoTimeline,
  demoInvoices,
  demoBrokers,
  demoNotBought,
} from "../data/demoData";
import { today, followUpStatus } from "../lib/presentation";
import {
  buildPostSaleSchedule,
  milestoneLabel,
  addToDate,
} from "../lib/postSale";
import {
  reasonLabel,
  unknownReasonQuestion,
  unknownReasonFollowUpDays,
} from "../lib/notBought";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import {
  useFirestoreCollection,
  useFirestoreDocument,
} from "../lib/useFirestoreSync";
import {
  User,
  Branch,
  Team,
  Course,
  Lead,
  Visit,
  FollowUp,
  Booking,
  TimelineEvent,
  AuditLog,
  NotBoughtRecord,
  DistributionRule,
  LeadStatus,
  Company,
  Governorate,
  Warehouse,
  DepartmentEntity,
  JobPosition,
  ReviewRequest,
  ReviewNote,
  ReviewAnalysis,
  PurchaseCategory,
  BrokerEntity,
  PurchaseInvoice,
  NotificationItem,
} from "../types/crm";
import {
  initialUsers,
  initialBranches,
  initialTeams,
  initialCourses,
  initialLeads,
  initialVisits,
  initialFollowUps,
  initialBookings,
  initialTimelineEvents,
  initialAuditLogs,
  initialCompanies,
  initialGovernorates,
  initialWarehouses,
  initialDepartments,
  initialJobPositions,
  initialPurchaseCategories,
  initialBrokers,
  initialPurchaseInvoices,
  initialNotifications,
} from "../data/initialData";

export interface FollowUpExtra {
  satisfactionRating?: number;
  satisfactionComment?: string;
  referralNote?: string;
}

export interface CRMContextType {
  notBoughtRecords: NotBoughtRecord[];
  reviewRequests: ReviewRequest[];
  reviewNotes: ReviewNote[];
  requestReview: (input: {
    lead: Lead;
    subjectKind: ReviewRequest["subjectKind"];
    subjectId?: string;
    subjectLabel: string;
  }) => ReviewRequest;
  markReviewReminderSent: (id: string) => void;
  cancelReviewRequest: (id: string, reason: string) => void;
  addReviewNote: (requestId: string, text: string, kind: ReviewNote["kind"]) => void;
  saveReviewAnalysis: (id: string, ai: ReviewAnalysis) => void;
  currentUser: User;
  logout: () => Promise<void>;
  loadDemoData: () => void;
  clearOrganizationData: () => void;
  removeDemoData: () => void;
  createLoginForUser: (
    userId: string,
    loginId: string,
    password: string,
    info: { name: string; role: User["role"]; branchId?: string },
  ) => Promise<void>;
  viewAsUser: User | null;
  setViewAsUser: (user: User | null) => void;
  effectiveUser: User;
  permissionMatrix: PermissionMatrix;
  updatePermissionMatrix: (matrix: PermissionMatrix) => void;

  users: User[];
  companies: Company[];
  governorates: Governorate[];
  warehouses: Warehouse[];
  branches: Branch[];
  teams: Team[];
  courses: Course[];
  leads: Lead[];
  visits: Visit[];
  followUps: FollowUp[];
  bookings: Booking[];
  timelineEvents: TimelineEvent[];
  auditLogs: AuditLog[];
  distributionRule: DistributionRule;
  departmentEntities: DepartmentEntity[];
  jobPositions: JobPosition[];
  purchaseCategories: PurchaseCategory[];
  brokers: BrokerEntity[];
  purchaseInvoices: PurchaseInvoice[];
  notifications: NotificationItem[];

  // Purchase Categories & Invoices
  addPurchaseCategory: (cat: Omit<PurchaseCategory, "id">) => PurchaseCategory;
  updatePurchaseCategory: (
    id: string,
    updates: Partial<PurchaseCategory>,
  ) => void;
  addBroker: (
    broker: Omit<BrokerEntity, "id" | "totalReferrals" | "totalVolume">,
  ) => BrokerEntity;
  updateBroker: (id: string, updates: Partial<BrokerEntity>) => void;
  addPurchaseInvoice: (
    inv: Omit<PurchaseInvoice, "id" | "createdAt" | "invoiceNumber">,
  ) => PurchaseInvoice;
  updatePurchaseInvoiceStatus: (
    id: string,
    status: PurchaseInvoice["status"],
  ) => void;

  // Notifications
  addNotification: (
    notif: Omit<NotificationItem, "id" | "createdAt" | "read">,
  ) => NotificationItem;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Organizational CRUD
  addCompany: (cmp: Omit<Company, "id">) => Company;
  addGovernorate: (gov: Omit<Governorate, "id">) => Governorate;
  addWarehouse: (wh: Omit<Warehouse, "id">) => Warehouse;
  addDepartmentEntity: (dept: Omit<DepartmentEntity, "id">) => DepartmentEntity;
  updateDepartmentEntity: (
    id: string,
    updates: Partial<DepartmentEntity>,
  ) => void;
  addJobPosition: (pos: Omit<JobPosition, "id">) => JobPosition;
  updateJobPosition: (id: string, updates: Partial<JobPosition>) => void;

  // Duplicate Check
  findDuplicateLeadsByPhone: (phone: string, excludeId?: string) => Lead[];

  // Lead CRUD & Operations
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  reassignLead: (
    leadId: string,
    newAgentId: string,
    newBranchId?: string,
    newTeamId?: string,
  ) => void;
  deleteLead: (id: string) => void;

  // Visit Operations
  addVisit: (visit: Omit<Visit, "id">) => Visit;

  // FollowUp Operations
  addFollowUp: (followUp: Omit<FollowUp, "id" | "status">) => FollowUp;
  updateFollowUpResult: (
    id: string,
    status: "completed" | "cancelled",
    result: string,
    nextFollowUpDate?: string,
    extra?: FollowUpExtra,
  ) => void;

  // Booking Operations
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => Booking;
  completeBooking: (bookingId: string, deliveredAt?: string) => void;
  addNotBoughtRecord: (
    data: Omit<NotBoughtRecord, "id" | "createdAt" | "agentName">,
  ) => NotBoughtRecord;

  // User & Structure CRUD
  addUser: (user: Omit<User, "id" | "createdAt">) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  toggleUserActive: (id: string) => void;
  updateUserPermissions: (userId: string, permissions: string[]) => void;
  addBranch: (branch: Omit<Branch, "id">) => Branch;
  updateBranch: (id: string, updates: Partial<Branch>) => void;
  addTeam: (team: Omit<Team, "id">) => Team;
  updateTeam: (id: string, updates: Partial<Team>) => void;

  // Timeline & Audit
  addTimelineEvent: (event: Omit<TimelineEvent, "id" | "timestamp">) => void;
  logAudit: (
    action: string,
    entity: string,
    entityId: string,
    details: string,
  ) => void;

  // Settings & Reset
  updateDistributionRule: (rules: Partial<DistributionRule>) => void;
  resetAllData: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_PREFIX = "almasar_crm_v1_";

// Customer data is never copied to the browser's disk: Firestore is the only source of truth and it
// enforces who may read what. These helpers stay so every collection keeps one place to start from.
function loadStorage<T>(_key: string, fallback: T): T {
  return fallback;
}

function saveStorage<T>(_key: string, _value: T) {
  /* intentionally not persisted */
}

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>(() =>
    loadStorage<User[]>("users", []).map(normalizeUser),
  );
  const [companies, setCompanies] = useState<Company[]>(() =>
    loadStorage<Company[]>("companies", []),
  );
  const [governorates, setGovernorates] = useState<Governorate[]>(() =>
    loadStorage<Governorate[]>("governorates", []),
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() =>
    loadStorage<Warehouse[]>("warehouses", []),
  );
  const [branches, setBranches] = useState<Branch[]>(() =>
    loadStorage<Branch[]>("branches", []),
  );
  const [teams, setTeams] = useState<Team[]>(() =>
    loadStorage<Team[]>("teams", []),
  );
  const [departmentEntities, setDepartmentEntities] = useState<
    DepartmentEntity[]
  >(() => loadStorage<DepartmentEntity[]>("departments", []));
  const [jobPositions, setJobPositions] = useState<JobPosition[]>(() =>
    loadStorage<JobPosition[]>("job_positions", []),
  );
  const [purchaseCategories, setPurchaseCategories] = useState<
    PurchaseCategory[]
  >(() => loadStorage("purchase_categories", initialPurchaseCategories));
  const [brokers, setBrokers] = useState<BrokerEntity[]>(() =>
    loadStorage("brokers", []),
  );
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(
    () => loadStorage("purchase_invoices", []),
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadStorage("notifications", []),
  );
  const [courses, setCourses] = useState<Course[]>(() =>
    loadStorage<Course[]>("courses", []),
  );
  const [notBoughtRecords, setNotBoughtRecords] = useState<NotBoughtRecord[]>(
    () => loadStorage("not_bought", []),
  );
  useEffect(() => saveStorage("not_bought", notBoughtRecords), [notBoughtRecords]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [reviewNotes, setReviewNotes] = useState<ReviewNote[]>([]);
  const [leads, setLeads] = useState<Lead[]>(() =>
    loadStorage("leads", []),
  );
  const [visits, setVisits] = useState<Visit[]>(() =>
    loadStorage("visits", []),
  );
  const [followUps, setFollowUps] = useState<FollowUp[]>(() =>
    loadStorage("followups", []),
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    loadStorage("bookings", []),
  );
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() =>
    loadStorage("timeline", []),
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage("audit", []),
  );
  const [distributionRule, setDistributionRule] = useState<DistributionRule>(
    () =>
      loadStorage("dist_rule", {
        autoDistribute: true,
        method: "round_robin",
        maxLeadsPerAgentDay: 20,
      }),
  );

  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(
    () => sanitizeMatrix(loadStorage("permission_matrix", null)),
  );
  useEffect(
    () => saveStorage("permission_matrix", permissionMatrix),
    [permissionMatrix],
  );
  const updatePermissionMatrix = (matrix: PermissionMatrix) => {
    setPermissionMatrix(sanitizeMatrix(matrix));
    logAudit(
      "تحديث مصفوفة الصلاحيات",
      "permissions",
      "roles",
      "تم تحديث صلاحيات الوظائف بواسطة مدير عام المؤسسة",
    );
  };

  // Firestore is the single source of truth (localStorage is only a warm cache)
  useFirestoreCollection("users", users, setUsers, {
    seedIfEmpty: true,
    transform: normalizeUser,
  });
  useFirestoreCollection("companies", companies, setCompanies, { seedIfEmpty: true });
  useFirestoreCollection("governorates", governorates, setGovernorates, { seedIfEmpty: true });
  useFirestoreCollection("warehouses", warehouses, setWarehouses, { seedIfEmpty: true });
  useFirestoreCollection("branches", branches, setBranches, { seedIfEmpty: true });
  useFirestoreCollection("teams", teams, setTeams, { seedIfEmpty: true });
  useFirestoreCollection("departments", departmentEntities, setDepartmentEntities, { seedIfEmpty: true });
  useFirestoreCollection("jobPositions", jobPositions, setJobPositions, { seedIfEmpty: true });
  useFirestoreCollection("purchaseCategories", purchaseCategories, setPurchaseCategories, { seedIfEmpty: true });
  useFirestoreCollection("courses", courses, setCourses, { seedIfEmpty: true });
  useFirestoreCollection("brokers", brokers, setBrokers);
  useFirestoreCollection("purchaseInvoices", purchaseInvoices, setPurchaseInvoices);
  useFirestoreCollection("notifications", notifications, setNotifications);
  useFirestoreCollection("leads", leads, setLeads);
  useFirestoreCollection("notBoughtRecords", notBoughtRecords, setNotBoughtRecords);
  useFirestoreCollection("reviewRequests", reviewRequests, setReviewRequests);
  useFirestoreCollection("reviewNotes", reviewNotes, setReviewNotes);
  useFirestoreCollection("visits", visits, setVisits);
  useFirestoreCollection("followUps", followUps, setFollowUps);
  useFirestoreCollection("bookings", bookings, setBookings);
  useFirestoreCollection("timelineEvents", timelineEvents, setTimelineEvents);
  useFirestoreCollection("activityLogs", auditLogs, setAuditLogs);
  useFirestoreDocument(["settings", "distribution"], distributionRule, setDistributionRule);
  useFirestoreDocument(["settings", "permissions"], permissionMatrix, (m) =>
    setPermissionMatrix(sanitizeMatrix(m)),
  );

  // The signed-in user comes from Firebase Auth; role/branch/active are the
  // server-trusted values from authProfiles, not whatever the users doc says.
  const { profile, logout, createStaffLogin } = useAuth();
  const currentUser = useMemo<User>(() => {
    const p = profile!;
    const record = users.find((u) => u.id === p.userId);
    return normalizeUser({
      id: p.userId,
      name: p.name,
      email: p.email,
      phone: "",
      createdAt: "",
      ...record,
      role: p.role,
      branchId: p.branchId ?? record?.branchId,
      active: p.active,
    });
  }, [profile, users]);

  // Top management gets the full list of Egyptian governorates (idempotent: ids are fixed, existing ones are kept).
  useEffect(() => {
    if (currentUser.role !== "admin" && currentUser.role !== "general_manager") return;
    const missing = egyptGovernorates.filter(
      (e) => !governorates.some((g) => g.id === e.id || findEgyptGovernorate(g.name)?.key === e.key),
    );
    if (!missing.length) return;
    setGovernorates((prev) => [
      ...prev,
      ...missing.map((e) => ({ id: e.id, name: `محافظة ${e.name}`, code: e.key.toUpperCase(), region: e.region, phone: "", active: true })),
    ]);
  }, [currentUser.role, governorates]);

  const [viewAsUser, setViewAsUser] = useState<User | null>(null);

  const effectiveUser = useMemo(() => {
    const selected = viewAsUser || currentUser;
    return users.find((u) => u.id === selected.id) || selected;
  }, [viewAsUser, currentUser, users]);

  // Sync to local storage
  useEffect(() => saveStorage("users", users), [users]);
  useEffect(() => saveStorage("companies", companies), [companies]);
  useEffect(() => saveStorage("governorates", governorates), [governorates]);
  useEffect(() => saveStorage("warehouses", warehouses), [warehouses]);
  useEffect(() => saveStorage("branches", branches), [branches]);
  useEffect(() => saveStorage("teams", teams), [teams]);
  useEffect(
    () => saveStorage("departments", departmentEntities),
    [departmentEntities],
  );
  useEffect(() => saveStorage("job_positions", jobPositions), [jobPositions]);
  useEffect(
    () => saveStorage("purchase_categories", purchaseCategories),
    [purchaseCategories],
  );
  useEffect(() => saveStorage("brokers", brokers), [brokers]);
  useEffect(
    () => saveStorage("purchase_invoices", purchaseInvoices),
    [purchaseInvoices],
  );
  useEffect(() => saveStorage("notifications", notifications), [notifications]);
  useEffect(() => saveStorage("courses", courses), [courses]);
  useEffect(() => saveStorage("leads", leads), [leads]);
  useEffect(() => saveStorage("visits", visits), [visits]);
  useEffect(() => saveStorage("followups", followUps), [followUps]);
  useEffect(() => saveStorage("bookings", bookings), [bookings]);
  useEffect(() => saveStorage("timeline", timelineEvents), [timelineEvents]);
  useEffect(() => saveStorage("audit", auditLogs), [auditLogs]);
  useEffect(
    () => saveStorage("dist_rule", distributionRule),
    [distributionRule],
  );

  // Helper Audit
  const logAudit = (
    action: string,
    entity: string,
    entityId: string,
    details: string,
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: effectiveUser.id,
      userName: effectiveUser.name,
      userRole: effectiveUser.role,
      action,
      entity,
      entityId,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addTimelineEvent = (event: Omit<TimelineEvent, "id" | "timestamp">) => {
    const newEv: TimelineEvent = {
      ...event,
      id: `tle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setTimelineEvents((prev) => [newEv, ...prev]);
  };

  // ---- Customer reviews ----
  const requestReview: CRMContextType["requestReview"] = ({ lead, subjectKind, subjectId, subjectLabel }) => {
    const req: ReviewRequest = {
      id: newReviewToken(),
      leadId: lead.id,
      leadName: lead.name,
      branchId: lead.branchId,
      branchName: lead.branchName,
      agentId: effectiveUser.id,
      agentName: effectiveUser.name,
      subjectKind,
      subjectId,
      subjectLabel,
      sentAt: new Date().toISOString(),
      status: "sent",
    };
    setReviewRequests((prev) => [req, ...prev]);
    addTimelineEvent({
      leadId: lead.id,
      authorId: req.agentId,
      authorName: req.agentName || "",
      type: "review_requested",
      title: "تم إرسال طلب تقييم للعميل",
      details: subjectLabel,
    });
    return req;
  };
  const patchReview = (id: string, patch: Partial<ReviewRequest>) =>
    setReviewRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const markReviewReminderSent = (id: string) => patchReview(id, { reminderSentAt: new Date().toISOString() });
  const cancelReviewRequest = (id: string, reason: string) =>
    patchReview(id, { status: "cancelled", cancelReason: reason, cancelledAt: new Date().toISOString() });
  const saveReviewAnalysis = (id: string, ai: ReviewAnalysis) => patchReview(id, { ai });
  const addReviewNote = (requestId: string, text: string, kind: ReviewNote["kind"]) => {
    // The signed-in person writes the note (the rules check this), even while previewing another role.
    setReviewNotes((prev) => [
      { id: `rvn-${Date.now()}-${Math.floor(Math.random() * 1000)}`, requestId, text, kind, byId: currentUser.id, byName: currentUser.name, at: new Date().toISOString() },
      ...prev,
    ]);
  };

  // Duplicate Check
  const findDuplicateLeadsByPhone = (
    phone: string,
    excludeId?: string,
  ): Lead[] => {
    if (!phone) return [];
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 6) return [];

    return leads.filter((l) => {
      if (excludeId && l.id === excludeId) return false;
      const mainClean = l.phone ? l.phone.replace(/\D/g, "") : "";
      const waClean = l.whatsappPhone ? l.whatsappPhone.replace(/\D/g, "") : "";
      return (
        (mainClean && mainClean.includes(cleanPhone)) ||
        (waClean && waClean.includes(cleanPhone))
      );
    });
  };

  // Lead CRUD
  const addLead = (leadData: Omit<Lead, "id" | "createdAt">): Lead => {
    const id = `ld-${crypto.randomUUID()}`;
    const branch = branches.find((b) => b.id === leadData.branchId);
    const agent = users.find((u) => u.id === leadData.assignedAgentId);

    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const generatedEvalUrl =
      leadData.uniqueEvaluationUrl ||
      `https://eval.beherypaints.com/rate?leadId=${id}&client=${encodeURIComponent(leadData.name)}&code=${randomCode}`;

    const newLead: Lead = {
      ...leadData,
      id,
      branchName: branch ? branch.name : leadData.branchName,
      assignedAgentName: agent ? agent.name : leadData.assignedAgentName,
      createdAt: new Date().toISOString(),
      uniqueEvaluationUrl: generatedEvalUrl,
    };

    setLeads((prev) => [newLead, ...prev]);

    addTimelineEvent({
      leadId: id,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "created",
      title: "إضافة العميل للنظام",
      details: `تم إضافة العميل بواسطة ${effectiveUser.name} (${effectiveUser.role})، المصدر: ${newLead.source}`,
    });

    logAudit(
      "إضافة عميل",
      "عميل",
      id,
      `تم إضافة العميل ${newLead.name} - هاتف: ${newLead.phone}`,
    );
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };

        if (updates.status && updates.status !== l.status) {
          addTimelineEvent({
            leadId: id,
            authorId: effectiveUser.id,
            authorName: effectiveUser.name,
            type: "status_change",
            title: `تحديث حالة العميل إلى (${updates.status})`,
            details: `تغيرت الحالة من ${l.status} إلى ${updates.status}`,
          });
        }

        return updated;
      }),
    );
    logAudit("تعديل عميل", "عميل", id, `تم تعديل بيانات العميل رقم ${id}`);
  };

  const reassignLead = (
    leadId: string,
    newAgentId: string,
    newBranchId?: string,
    newTeamId?: string,
  ) => {
    const targetAgent = users.find((u) => u.id === newAgentId);
    const targetBranch = newBranchId
      ? branches.find((b) => b.id === newBranchId)
      : undefined;

    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const updated = {
          ...l,
          assignedAgentId: newAgentId,
          assignedAgentName: targetAgent?.name || l.assignedAgentName,
          branchId: newBranchId || l.branchId,
          branchName: targetBranch?.name || l.branchName,
          teamId: newTeamId || targetAgent?.teamId,
        };
        return updated;
      }),
    );

    // Outstanding work follows the new owner; completed history keeps its original author.
    setFollowUps((prev) =>
      prev.map((task) => {
        if (
          task.leadId !== leadId ||
          ["completed", "cancelled"].includes(task.status)
        )
          return task;
        const updated = {
          ...task,
          assignedAgentId: newAgentId,
          assignedAgentName: targetAgent?.name,
          branchId: newBranchId || task.branchId,
        };
        return updated;
      }),
    );

    addTimelineEvent({
      leadId,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "agent_reassigned",
      title: "إعادة تعيين مسؤول المبيعات",
      details: `تم نقل العميل إلى المسؤول: ${targetAgent?.name || newAgentId}`,
    });

    logAudit(
      "إعادة توزيع عميل",
      "عميل",
      leadId,
      `تم نقل العميل إلى الموظف ${targetAgent?.name}`,
    );
  };

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    logAudit("حذف عميل", "عميل", id, `تم حذف العميل رقم ${id}`);
  };

  // Visit Operations
  const addVisit = (visitData: Omit<Visit, "id">): Visit => {
    const id = `vst-${crypto.randomUUID()}`;
    const branch = branches.find((b) => b.id === visitData.branchId);
    const agent = users.find((u) => u.id === visitData.receivedByAgentId);

    // Auto check duplicate / existing lead
    const brokerOnly = visitData.visitorType === "broker";
    const existing = !brokerOnly && visitData.phone
      ? findDuplicateLeadsByPhone(visitData.phone).filter(
          (l) =>
            l.branchId === visitData.branchId &&
            (effectiveUser.role !== "sales_agent" ||
              l.assignedAgentId === effectiveUser.id),
        )
      : [];
    let linkedLeadId = brokerOnly
      ? undefined
      : visitData.linkedLeadId ||
        (existing.length > 0 ? existing[0].id : undefined);

    // If no lead exists and phone exists, create lead automatically
    if (!brokerOnly && !linkedLeadId && visitData.phone && visitData.visitorName) {
      const createdLead = addLead({
        name: visitData.visitorName,
        phone: visitData.phone,
        whatsappPhone: visitData.whatsappPhone || visitData.phone,
        source: visitData.source || "walk_in",
        branchId: visitData.branchId,
        branchName: branch?.name,
        assignedAgentId: visitData.receivedByAgentId,
        assignedAgentName: agent?.name,
        status: visitData.requiresFollowUp ? "needs_followup" : "interested",
        classification: "B",
        department: visitData.interests?.[0] || visitData.department || "decor",
        interests: visitData.interests,
        brokerId: visitData.brokerId,
        brokerName: visitData.brokerName,
        courseOfInterest: visitData.courseOfInterest,
        locationRating: visitData.locationRating,
        treatmentRating: visitData.treatmentRating,
        priceRating: visitData.priceRating,
        notes: `مسجل تلقائياً من زيارة مقر الفرع: ${visitData.notes}`,
      });
      linkedLeadId = createdLead.id;
    }

    const newVisit: Visit = {
      ...visitData,
      id,
      branchName: branch?.name || visitData.branchName,
      receivedByAgentName: agent?.name || visitData.receivedByAgentName,
      hasPreviousRecord: !!visitData.linkedLeadId || existing.length > 0,
      linkedLeadId,
    };

    setVisits((prev) => [newVisit, ...prev]);

    // If linked to lead, add timeline event & optional follow up
    if (linkedLeadId) {
      addTimelineEvent({
        leadId: linkedLeadId,
        authorId: effectiveUser.id,
        authorName: effectiveUser.name,
        type: "visit",
        title: `تسجيل زيارة فرع (${branch?.name || "مقر الفرع"})`,
        details: `استقبله الموظف: ${agent?.name}. النتيجة: ${visitData.outcome}. الملاحظات: ${visitData.notes}`,
      });

      if (visitData.requiresFollowUp && visitData.followUpDate) {
        addFollowUp({
          leadId: linkedLeadId,
          leadName: visitData.visitorName,
          leadPhone: visitData.phone,
          assignedAgentId:
            visitData.followUpAgentId || visitData.receivedByAgentId,
          assignedAgentName: agent?.name,
          branchId: visitData.branchId,
          scheduledAt: visitData.followUpDate,
          reason: `متابعة نتيجة زيارة المقر بتاريخ ${visitData.date}`,
          type: "call",
          notes: visitData.notes,
        });
      }
    }

    logAudit(
      "تسجيل زيارة",
      "زيارة",
      id,
      `تسجيل زيارة للزائر ${visitData.visitorName}`,
    );
    return newVisit;
  };

  // FollowUp Operations
  const addFollowUp = (
    followUpData: Omit<FollowUp, "id" | "status">,
  ): FollowUp => {
    const id = `flw-${crypto.randomUUID()}`;
    const agent = users.find((u) => u.id === followUpData.assignedAgentId);

    const nowStr = today();
    const schedDate = followUpData.scheduledAt.slice(0, 10);
    const initialStatus =
      schedDate < nowStr
        ? "overdue"
        : schedDate === nowStr
          ? "due"
          : "upcoming";

    const newFollowUp: FollowUp = {
      ...followUpData,
      id,
      assignedAgentName: agent?.name || followUpData.assignedAgentName,
      status: initialStatus,
    };

    setFollowUps((prev) => [newFollowUp, ...prev]);

    // Update Lead's nextFollowUpDate & status
    updateLead(followUpData.leadId, {
      nextFollowUpDate: [
        ...followUps
          .filter(
            (f) =>
              f.leadId === followUpData.leadId &&
              !["completed", "cancelled"].includes(followUpStatus(f)),
          )
          .map((f) => f.scheduledAt),
        followUpData.scheduledAt,
      ].sort()[0],
      status:
        leads.find((l) => l.id === followUpData.leadId)?.status === "booked"
          ? "booked"
          : "needs_followup",
    });

    addTimelineEvent({
      leadId: followUpData.leadId,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "followup_created",
      title: `جدولة متابعة جديدة (${followUpData.type})`,
      details: `موعد المتابعة: ${followUpData.scheduledAt}. السبب: ${followUpData.reason}`,
    });

    logAudit(
      "إضافة متابعة",
      "متابعة",
      id,
      `جدولة متابعة للعميل ${followUpData.leadName}`,
    );
    return newFollowUp;
  };

  const updateFollowUpResult = (
    id: string,
    status: "completed" | "cancelled",
    result: string,
    nextFollowUpDate?: string,
    extra?: FollowUpExtra,
  ) => {
    const original = followUps.find((f) => f.id === id);
    if (!original) return;
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              status,
              outcomeResult: result,
              completedAt: new Date().toISOString(),
              nextFollowUpDate,
              ...(status === "completed" && extra ? extra : {}),
            }
          : f,
      ),
    );
    if (status === "completed" && extra?.satisfactionRating) {
      updateLead(original.leadId, {
        customerRatingStars: extra.satisfactionRating,
        customerRatingComment: extra.satisfactionComment,
        hasSubmittedRating: true,
      });
    }
    const lead = leads.find((l) => l.id === original.leadId);
    addTimelineEvent({
      leadId: original.leadId,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "followup_result",
      title: status === "completed" ? "تسجيل نتيجة المتابعة" : "إلغاء متابعة",
      details: result,
    });
    if (lead && status === "completed") {
      const remainingDates = followUps
        .filter(
          (f) =>
            f.leadId === lead.id &&
            f.id !== id &&
            !["completed", "cancelled"].includes(followUpStatus(f)),
        )
        .map((f) => f.scheduledAt);
      if (nextFollowUpDate) remainingDates.push(nextFollowUpDate);
      remainingDates.sort();
      updateLead(lead.id, {
        lastContactDate: today(),
        nextFollowUpDate: remainingDates[0],
        status:
          lead.status === "booked"
            ? "booked"
            : remainingDates.length
              ? "needs_followup"
              : "contacted",
      });
      if (nextFollowUpDate)
        addFollowUp({
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          assignedAgentId: original.assignedAgentId,
          branchId: original.branchId,
          scheduledAt: nextFollowUpDate,
          reason: `متابعة إضافية: ${result}`,
          type: original.type,
          notes: result,
        });
    }
    logAudit("تحديث متابعة", "متابعة", id, `تحديث نتيجة المتابعة برقم ${id}`);
  };

  // Booking Operations
  const addBooking = (
    bookingData: Omit<Booking, "id" | "createdAt">,
  ): Booking => {
    const id = `bkg-${crypto.randomUUID()}`;
    const branch = branches.find((b) => b.id === bookingData.branchId);
    const agent = users.find((u) => u.id === bookingData.agentId);

    const newBooking: Booking = {
      ...bookingData,
      id,
      branchName: branch?.name || bookingData.branchName,
      agentName: agent?.name || bookingData.agentName,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Automatically update Lead status to 'booked'!
    updateLead(bookingData.leadId, {
      status: "booked",
    });

    addTimelineEvent({
      leadId: bookingData.leadId,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "booking_created",
      title: `تأكيد حجز جديد: ${bookingData.courseName}`,
      details: `إجمالي المشتريات: ${bookingData.amount} ج.م - الملاحظات: ${bookingData.notes}`,
    });

    logAudit(
      "إضافة حجز",
      "حجز",
      id,
      `إتمام حجز كورس ${bookingData.courseName} للعميل ${bookingData.leadName}`,
    );
    return newBooking;
  };

  /** Records why a customer has not bought yet; an unknown reason schedules a follow-up question. */
  const addNotBoughtRecord: CRMContextType["addNotBoughtRecord"] = (data) => {
    const record: NotBoughtRecord = {
      ...data,
      id: `nbr-${crypto.randomUUID()}`,
      agentName: users.find((u) => u.id === data.agentId)?.name,
      createdAt: new Date().toISOString(),
    };
    setNotBoughtRecords((prev) => [record, ...prev]);
    const labels = data.reasons
      .map((r) => (r === "other" && data.otherText ? `أخرى: ${data.otherText}` : reasonLabel(r)))
      .join("، ");
    addTimelineEvent({
      leadId: data.leadId,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "note",
      title: `لسه ما اشترى: ${labels}`,
      details: data.note || "",
    });
    if (data.reasons.includes("unknown") && data.agentId) {
      addFollowUp({
        leadId: data.leadId,
        leadName: data.leadName,
        leadPhone: leads.find((l) => l.id === data.leadId)?.phone || "",
        assignedAgentId: data.agentId,
        branchId: data.branchId,
        scheduledAt: addToDate(today(), { days: unknownReasonFollowUpDays }),
        reason: unknownReasonQuestion,
        type: "call",
        notes: "",
      });
    }
    logAudit("سبب عدم الشراء", "عميل", data.leadId, `${data.leadName}: ${labels}`);
    return record;
  };

  /** Marks a booking as delivered and schedules the post-sale follow-ups. */
  const completeBooking = (bookingId: string, deliveredAt?: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.bookingStatus === "cancelled") return;
    const delivered = deliveredAt || today();
    const lead = leads.find((l) => l.id === booking.leadId);
    const agentId = users.some((u) => u.id === booking.agentId)
      ? booking.agentId
      : lead?.assignedAgentId || booking.agentId;
    const existing = new Set(
      followUps
        .filter((f) => f.bookingId === bookingId && f.category === "post_sale")
        .map((f) => f.milestone),
    );
    const nowStr = today();
    const created: FollowUp[] = buildPostSaleSchedule(delivered)
      .filter((m) => !existing.has(m.milestone))
      .map((m) => ({
        id: `flw-${crypto.randomUUID()}`,
        leadId: booking.leadId,
        leadName: booking.leadName,
        leadPhone: booking.leadPhone,
        assignedAgentId: agentId,
        assignedAgentName: users.find((u) => u.id === agentId)?.name,
        branchId: booking.branchId,
        scheduledAt: m.date,
        reason: m.reason,
        type: "call" as const,
        notes: "",
        status:
          m.date < nowStr ? "overdue" : m.date === nowStr ? "due" : "upcoming",
        category: "post_sale" as const,
        bookingId,
        milestone: m.milestone,
      }));

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, bookingStatus: "completed", deliveredAt: delivered }
          : b,
      ),
    );
    if (created.length) {
      setFollowUps((prev) => [...created, ...prev]);
      const open = followUps
        .filter(
          (f) =>
            f.leadId === booking.leadId &&
            !["completed", "cancelled"].includes(followUpStatus(f)),
        )
        .map((f) => f.scheduledAt);
      const earliest = [...open, ...created.map((f) => f.scheduledAt)].sort()[0];
      updateLead(booking.leadId, { nextFollowUpDate: earliest });
    }
    addTimelineEvent({
      leadId: booking.leadId,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "booking_created",
      title: `تسليم الشغل: ${booking.courseName}`,
      details: `تم التسليم بتاريخ ${delivered}. جُدولت ${created.length} متابعات بعد البيع (${created
        .map((f) => milestoneLabel(f.milestone))
        .join("، ")}).`,
    });
    logAudit(
      "تسليم شغل",
      "حجز",
      bookingId,
      `تسليم ${booking.courseName} للعميل ${booking.leadName} وجدولة متابعات بعد البيع`,
    );
  };

  // User & Organization CRUD
  const addUser = (userData: Omit<User, "id" | "createdAt">): User => {
    const id = `usr-${crypto.randomUUID()}`;
    const newUser: User = {
      ...userData,
      id,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit(
      "إضافة موظف",
      "مستخدم",
      id,
      `إنشاء حساب للموظف ${newUser.name} بدور ${newUser.role}`,
    );
    return newUser;
  };

  // Keep the server-trusted access record in step with the user document.
  const syncAuthProfile = (
    userId: string,
    patch: { role?: User["role"]; branchId?: string; active?: boolean; name?: string },
  ) => {
    const authUid = users.find((u) => u.id === userId)?.authUid;
    if (!authUid) return;
    const clean = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(clean).length) {
      updateDoc(doc(db, "authProfiles", authUid), clean).catch((e) =>
        console.error("authProfile sync failed", e),
      );
    }
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    syncAuthProfile(id, {
      role: updates.role,
      branchId: updates.branchId,
      name: updates.name,
    });
    logAudit("تعديل موظف", "مستخدم", id, `تعديل بيانات الحساب رقم ${id}`);
  };

  const toggleUserActive = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const active = !target.active;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active } : u)));
    syncAuthProfile(id, { active });
    logAudit(
      "تغيير حالة حساب",
      "مستخدم",
      id,
      `تغيير تفعيل الحساب إلى ${active ? "مفعل" : "معطل"}`,
    );
  };

  /** Creates a Firebase login for a staff record and links the two. */
  const createLoginForUser: CRMContextType["createLoginForUser"] = async (
    userId,
    loginId,
    password,
    info,
  ) => {
    const authUid = await createStaffLogin({ userId, loginId, password, ...info });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, authUid } : u)),
    );
    logAudit(
      "إنشاء حساب دخول",
      "مستخدم",
      userId,
      `تم إنشاء حساب دخول للموظف ${info.name}`,
    );
  };

  const addBranch = (branchData: Omit<Branch, "id">): Branch => {
    const id = `br-${crypto.randomUUID()}`;
    const newBranch: Branch = { ...branchData, id };
    setBranches((prev) => [...prev, newBranch]);
    logAudit("إضافة فرع", "فرع", id, `إنشاء الفرع ${newBranch.name}`);
    return newBranch;
  };

  const updateBranch = (id: string, updates: Partial<Branch>) => {
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
    logAudit("تعديل فرع", "فرع", id, `تعديل بيانات الفرع ${id}`);
  };

  const addTeam = (teamData: Omit<Team, "id">): Team => {
    const id = `tm-${crypto.randomUUID()}`;
    const newTeam: Team = { ...teamData, id };
    setTeams((prev) => [...prev, newTeam]);
    logAudit("إضافة فريق", "فريق", id, `إنشاء فريق جديد ${newTeam.name}`);
    return newTeam;
  };

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
    logAudit("تعديل فريق", "فريق", id, `تعديل فريق ${id}`);
  };

  const updateDistributionRule = (rules: Partial<DistributionRule>) => {
    setDistributionRule((prev) => ({ ...prev, ...rules }));
    logAudit(
      "تحديث إعدادات التوزيع",
      "إعدادات",
      "dist_rule",
      "تعديل قواعد توزيع العملاء",
    );
  };

  // Demo data lets the director explore every role with realistic records.
  // Everything added here can be removed again by id with removeDemoData().
  const addMissing = <T extends { id: string }>(prev: T[], extra: T[]) => {
    const have = new Set(prev.map((i) => i.id));
    return [...prev, ...extra.filter((i) => !have.has(i.id))];
  };
  const dropDemo = <T extends { id: string }>(prev: T[], demo: T[]) => {
    const ids = new Set(demo.map((i) => i.id));
    return prev.filter((i) => !ids.has(i.id));
  };
  const loadDemoData = () => {
    // The sample org structure comes along, so the sample staff and customers have branches to belong to.
    setCompanies((p) => addMissing(p, initialCompanies));
    setWarehouses((p) => addMissing(p, initialWarehouses));
    setBranches((p) => addMissing(p, initialBranches));
    setTeams((p) => addMissing(p, initialTeams));
    setDepartmentEntities((p) => addMissing(p, initialDepartments));
    setJobPositions((p) => addMissing(p, initialJobPositions));
    setUsers((p) => addMissing(p, demoUsers.map(normalizeUser)));
    setLeads((p) => addMissing(p, demoLeads));
    setVisits((p) => addMissing(p, demoVisits));
    setFollowUps((p) => addMissing(p, demoFollowUps));
    setBookings((p) => addMissing(p, demoBookings));
    setTimelineEvents((p) => addMissing(p, demoTimeline));
    setPurchaseInvoices((p) => addMissing(p, demoInvoices));
    setBrokers((p) => addMissing(p, demoBrokers));
    setNotBoughtRecords((p) => addMissing(p, demoNotBought));
    setReviewRequests((p) => addMissing(p, demoReviews));
    logAudit("تحميل بيانات تجريبية", "إعدادات", "demo", "تحميل موظفين وبيانات تجريبية لكل الأدوار");
  };
  const removeDemoData = () => {
    setCompanies((p) => dropDemo(p, initialCompanies));
    setWarehouses((p) => dropDemo(p, initialWarehouses));
    setBranches((p) => dropDemo(p, initialBranches));
    setTeams((p) => dropDemo(p, initialTeams));
    setDepartmentEntities((p) => dropDemo(p, initialDepartments));
    setJobPositions((p) => dropDemo(p, initialJobPositions));
    setUsers((p) => dropDemo(p, demoUsers));
    setLeads((p) => dropDemo(p, demoLeads));
    setVisits((p) => dropDemo(p, demoVisits));
    setFollowUps((p) => dropDemo(p, demoFollowUps));
    setBookings((p) => dropDemo(p, demoBookings));
    setTimelineEvents((p) => dropDemo(p, demoTimeline));
    setPurchaseInvoices((p) => dropDemo(p, demoInvoices));
    setBrokers((p) => dropDemo(p, demoBrokers));
    setNotBoughtRecords((p) => dropDemo(p, demoNotBought));
    setReviewRequests((p) => dropDemo(p, demoReviews));
    logAudit("حذف البيانات التجريبية", "إعدادات", "demo", "حذف الموظفين والبيانات التجريبية");
  };

  /** Developer-only: empties branches, companies, warehouses, teams, departments and job titles so the real structure can be entered from scratch. */
  const clearOrganizationData = () => {
    setCompanies([]);
    setWarehouses([]);
    setBranches([]);
    setTeams([]);
    setDepartmentEntities([]);
    setJobPositions([]);
    // The sample staff go too; anyone with a real login (or the signed-in developer) stays.
    const sample = new Set(initialUsers.map((u) => u.id));
    setUsers((prev) => prev.filter((u) => u.id === currentUser.id || u.authUid || !sample.has(u.id)));
    logAudit("تفريغ الهيكل الإداري", "إعدادات", "org", "تفريغ الفروع والشركات والمخازن والفرق والأقسام والمسميات");
  };

  // Data lives in Firestore, so a reset only clears this browser's session/cache.
  const resetAllData = () => {
    setViewAsUser(null);
    localStorage.clear();
  };

  // Organizational Methods
  const addCompany = (cmpData: Omit<Company, "id">): Company => {
    const newCmp: Company = {
      ...cmpData,
      id: `cmp-${Date.now().toString().slice(-5)}`,
    };
    setCompanies((prev) => [...prev, newCmp]);
    logAudit(
      "إضافة شركة",
      "شركة",
      newCmp.id,
      `تم إضافة شركة جديدة: ${newCmp.name}`,
    );
    return newCmp;
  };

  const addGovernorate = (govData: Omit<Governorate, "id">): Governorate => {
    const newGov: Governorate = {
      ...govData,
      id: `gov-${Date.now().toString().slice(-5)}`,
    };
    setGovernorates((prev) => [...prev, newGov]);
    logAudit(
      "إضافة محافظة",
      "محافظة",
      newGov.id,
      `تم إضافة محافظة/إقليم جديد: ${newGov.name}`,
    );
    return newGov;
  };

  const addWarehouse = (whData: Omit<Warehouse, "id">): Warehouse => {
    const newWh: Warehouse = {
      ...whData,
      id: `wh-${Date.now().toString().slice(-5)}`,
    };
    setWarehouses((prev) => [...prev, newWh]);
    logAudit(
      "إضافة مخزن/مستودع",
      "مخزن",
      newWh.id,
      `تم إضافة مخزن/مستودع جديد: ${newWh.name}`,
    );
    return newWh;
  };

  const addDepartmentEntity = (
    deptData: Omit<DepartmentEntity, "id">,
  ): DepartmentEntity => {
    const newDept: DepartmentEntity = {
      ...deptData,
      id: `dept-${Date.now().toString().slice(-5)}`,
    };
    setDepartmentEntities((prev) => [...prev, newDept]);
    logAudit(
      "إضافة قسم جديد",
      "قسم",
      newDept.id,
      `تم إضافة قسم جديد: ${newDept.name}`,
    );
    return newDept;
  };

  const updateDepartmentEntity = (
    id: string,
    updates: Partial<DepartmentEntity>,
  ) => {
    setDepartmentEntities((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
    logAudit("تحديث بيانات قسم", "قسم", id, `تحديث بيانات قسم ${id}`);
  };

  const addJobPosition = (posData: Omit<JobPosition, "id">): JobPosition => {
    const dept = departmentEntities.find((d) => d.id === posData.departmentId);
    const newPos: JobPosition = {
      ...posData,
      id: `pos-${Date.now().toString().slice(-5)}`,
      departmentName: dept ? dept.name : posData.departmentName,
    };
    setJobPositions((prev) => [...prev, newPos]);
    logAudit(
      "إضافة مسمى وظيفي",
      "وظيفة",
      newPos.id,
      `تم إضافة مسمى وظيفي جديد: ${newPos.title}`,
    );
    return newPos;
  };

  const updateJobPosition = (id: string, updates: Partial<JobPosition>) => {
    setJobPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
    logAudit("تحديث المسمى الوظيفي", "وظيفة", id, `تحديث المسمى الوظيفي ${id}`);
  };

  const updateUserPermissions = (userId: string, permissions: string[]) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        logAudit(
          "تحديث صلاحيات الموظف",
          "موظف",
          u.id,
          `تحديث صلاحيات الموظف ${u.name}`,
        );
        return { ...u, permissions };
      }),
    );
  };

  // Purchase Categories CRUD
  const addPurchaseCategory = (
    catData: Omit<PurchaseCategory, "id">,
  ): PurchaseCategory => {
    const newCat: PurchaseCategory = {
      ...catData,
      id: `cat-${Date.now().toString().slice(-5)}`,
    };
    setPurchaseCategories((prev) => [...prev, newCat]);
    logAudit(
      "إضافة تصنيف مشتريات",
      "تصنيفات",
      newCat.id,
      `إضافة تصنيف جديد: ${newCat.name}`,
    );
    return newCat;
  };

  const updatePurchaseCategory = (
    id: string,
    updates: Partial<PurchaseCategory>,
  ) => {
    setPurchaseCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
    logAudit(
      "تحديث تصنيف مشتريات",
      "تصنيفات",
      id,
      `تحديث تصنيف المشتريات ${id}`,
    );
  };

  // Brokers CRUD
  const addBroker = (
    brokerData: Omit<BrokerEntity, "id" | "totalReferrals" | "totalVolume">,
  ): BrokerEntity => {
    const newBroker: BrokerEntity = {
      ...brokerData,
      id: `brk-${Date.now().toString().slice(-5)}`,
      totalReferrals: 0,
      totalVolume: 0,
    };
    setBrokers((prev) => [...prev, newBroker]);
    logAudit(
      "إضافة وسيط / جهة ترشيح",
      "وسيط",
      newBroker.id,
      `إضافة وسيط جديد: ${newBroker.name}`,
    );
    return newBroker;
  };

  const updateBroker = (id: string, updates: Partial<BrokerEntity>) => {
    setBrokers((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...updates };
        return updated;
      }),
    );
    logAudit("تحديث بيانات الوسيط", "وسيط", id, `تحديث بيانات الوسيط ${id}`);
  };

  // Purchase Invoices CRUD
  const addPurchaseInvoice = (
    invData: Omit<PurchaseInvoice, "id" | "createdAt" | "invoiceNumber">,
  ): PurchaseInvoice => {
    const newInv: PurchaseInvoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
    };
    setPurchaseInvoices((prev) => [newInv, ...prev]);

    // If invoice is assigned to a broker, update broker volume
    if (newInv.brokerId) {
      setBrokers((prev) =>
        prev.map((b) =>
          b.id === newInv.brokerId
            ? {
                ...b,
                totalReferrals: b.totalReferrals + 1,
                totalVolume: b.totalVolume + newInv.totalAmount,
              }
            : b,
        ),
      );
    }

    // Add event timeline to lead
    addTimelineEvent({
      leadId: newInv.leadId,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: "booking_created",
      title: "إصدار فاتورة مشتريات",
      details: `تم إصدار فاتورة رقم ${newInv.invoiceNumber} بقيمة ${newInv.totalAmount.toLocaleString()} ج.م`,
    });

    logAudit(
      "إصدار فاتورة مشتريات",
      "فاتورة",
      newInv.id,
      `إصدار فاتورة برقم ${newInv.invoiceNumber}`,
    );
    return newInv;
  };

  const updatePurchaseInvoiceStatus = (
    id: string,
    status: PurchaseInvoice["status"],
  ) => {
    setPurchaseInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)),
    );
    logAudit(
      "تحديث حالة الفاتورة",
      "فاتورة",
      id,
      `تحديث حالة الفاتورة إلى ${status}`,
    );
  };

  // Notifications
  const addNotification = (
    notifData: Omit<NotificationItem, "id" | "createdAt" | "read">,
  ): NotificationItem => {
    const newNotif: NotificationItem = {
      ...notifData,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        logout,
        loadDemoData,
        clearOrganizationData,
        removeDemoData,
        createLoginForUser,
        viewAsUser,
        setViewAsUser,
        effectiveUser,
        permissionMatrix,
        updatePermissionMatrix,

        users,
        companies,
        governorates,
        warehouses,
        branches,
        teams,
        courses,
        leads,
        visits,
        followUps,
        bookings,
        timelineEvents,
        auditLogs,
        distributionRule,

        addCompany,
        addGovernorate,
        addWarehouse,
        addDepartmentEntity,
        updateDepartmentEntity,
        addJobPosition,
        updateJobPosition,
        departmentEntities,
        jobPositions,
        purchaseCategories,
        brokers,
        purchaseInvoices,
        notifications,

        addPurchaseCategory,
        updatePurchaseCategory,
        addBroker,
        updateBroker,
        addPurchaseInvoice,
        updatePurchaseInvoiceStatus,
        addNotification,
        markNotificationRead,
        clearAllNotifications,

        findDuplicateLeadsByPhone,
        addLead,
        updateLead,
        reassignLead,
        deleteLead,

        addVisit,

        addFollowUp,
        updateFollowUpResult,

        addBooking,
        completeBooking,
        addNotBoughtRecord,
        notBoughtRecords,
        reviewRequests,
        reviewNotes,
        requestReview,
        markReviewReminderSent,
        cancelReviewRequest,
        addReviewNote,
        saveReviewAnalysis,

        addUser,
        updateUser,
        toggleUserActive,
        updateUserPermissions,
        addBranch,
        updateBranch,
        addTeam,
        updateTeam,

        addTimelineEvent,
        logAudit,

        updateDistributionRule,
        resetAllData,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return useMemo(() => createWorkspace(context), [context]);
};
