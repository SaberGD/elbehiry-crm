export type UserRole =
  | "admin"
  | "general_manager"
  | "regional_manager"
  | "branch_manager"
  | "supervisor"
  | "team_leader"
  | "sales_agent";

export interface JobPosition {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  description?: string;
  active: boolean;
}

export interface DepartmentEntity {
  id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  companyId?: string;
  companyName?: string;
  governorateId?: string;
  governorateName?: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  teamId?: string;
  teamName?: string;
  department?: Department | string;
  departmentId?: string;
  departmentName?: string;
  jobPositionId?: string;
  jobPositionTitle?: string;
  directManagerId?: string;
  directManagerName?: string;
  active: boolean;
  createdAt: string;
  permissions?: string[];
  specialty?: "sales" | "accounts" | "operations";
  supervisedBranchIds?: string[];
  authUid?: string; // Firebase Auth uid once a login exists
}

export interface Company {
  id: string;
  name: string;
  code: string;
  description: string;
  ceoName?: string;
  phone: string;
  active: boolean;
}

export interface Governorate {
  id: string;
  name: string;
  code: string;
  region: string;
  managerName?: string;
  phone: string;
  active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  governorateId: string;
  governorateName?: string;
  branchId?: string;
  managerName?: string;
  phone: string;
  address: string;
  capacity: string;
  active: boolean;
}

export type BranchType =
  | "main_hq"
  | "showroom"
  | "warehouse"
  | "store"
  | "project_site";

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  companyId?: string;
  companyName?: string;
  governorateId?: string;
  governorateName?: string;
  branchType?: BranchType;
  managerId?: string;
  managerName?: string;
  phone: string;
  address: string;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  branchId: string;
  branchName?: string;
  supervisorId?: string;
  supervisorName?: string;
  leaderId?: string;
  leaderName?: string;
  memberIds: string[];
}

export type Department = "construction" | "decor" | "garden" | "general";

export interface ProductService {
  id: string;
  name: string;
  code: string;
  department: Department;
  category: string;
  price: number;
  duration: string;
  active: boolean;
}

export type Course = ProductService;

export type LeadStatus =
  | "new"
  | "uncontacted"
  | "contacted"
  | "interested"
  | "prospect"
  | "needs_followup"
  | "not_interested"
  | "booked";

export type LeadClassification = "A" | "B" | "C" | "VIP";

export type LeadSource =
  | "facebook"
  | "instagram"
  | "google"
  | "walk_in"
  | "referral"
  | "phone_inquiry"
  | "whatsapp"
  | "exhibition"
  | "other";

export type CustomerCategory =
  | "individual"
  | "engineering_company"
  | "decor_company"
  | "contractor"
  | "engineer"
  | "painter"
  | "technician"
  | "broker_individual"
  | "broker_company";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  isSameWhatsApp?: boolean;
  email?: string;
  source: LeadSource;
  customerCategory?: CustomerCategory;
  companyNameRelationship?: string;
  branchId: string;
  branchName?: string;
  teamId?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  status: LeadStatus;
  classification: LeadClassification;
  department: Department;
  departmentName?: string;
  /** Everything the customer is interested in; `department` is the first of them. */
  interests?: Department[];
  courseOfInterest?: string; // alias for department / service details
  locationRating?: number; // 1-5 rating for location
  treatmentRating?: number; // 1-5 rating for staff treatment
  priceRating?: number; // 1-5 rating for pricing
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes: string;
  lostReason?: string;
  whatsappMessageSent?: boolean;
  whatsappSentBy?: string;
  whatsappSentAt?: string;
  uniqueEvaluationUrl?: string;
  hasOpenedEvaluationLink?: boolean;
  evaluationOpenedAt?: string;
  hasSubmittedRating?: boolean;
  customerRatingStars?: number;
  customerRatingComment?: string;
  brokerId?: string; // broker who referred this customer
  brokerName?: string;
}

export type VisitorType = "client" | "broker" | "both";

export interface Visit {
  id: string;
  /** Who came: a customer, a broker on their own, or a customer who came with a broker. */
  visitorType?: VisitorType;
  brokerId?: string;
  brokerName?: string;
  /** Interests chosen for a customer registered through this visit. */
  interests?: Department[];
  visitorName: string;
  phone: string;
  whatsappPhone?: string;
  date: string;
  time: string;
  branchId: string;
  branchName?: string;
  receivedByAgentId: string;
  receivedByAgentName?: string;
  source: LeadSource;
  department: Department;
  courseOfInterest?: string;
  locationRating?: number;
  treatmentRating?: number;
  priceRating?: number;
  reason: string;
  outcome: string;
  notes: string;
  hasPreviousRecord: boolean;
  linkedLeadId?: string;
  requiresFollowUp: boolean;
  followUpAgentId?: string;
  followUpDate?: string;
}

export type FollowUpStatus =
  | "due"
  | "upcoming"
  | "completed"
  | "overdue"
  | "cancelled";
export type FollowUpType =
  | "call"
  | "whatsapp"
  | "branch_visit"
  | "email"
  | "meeting";

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  assignedAgentId: string;
  assignedAgentName?: string;
  branchId: string;
  scheduledAt: string;
  reason: string;
  type: FollowUpType;
  notes: string;
  status: FollowUpStatus;
  outcomeResult?: string;
  completedAt?: string;
  nextFollowUpDate?: string;
  // Post-sale follow-ups are generated when a booking is delivered.
  category?: "sales" | "post_sale";
  bookingId?: string;
  milestone?: "7d" | "30d" | "6m" | "12m";
  satisfactionRating?: number; // 1-5
  satisfactionComment?: string;
  referralNote?: string; // relatives / acquaintances the customer mentioned
}

export type BookingStatus =
  | "confirmed"
  | "pending_payment"
  | "completed"
  | "cancelled";
export type PaymentStatus = "full" | "deposit" | "pending" | "refunded";

export interface Booking {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  branchId: string;
  branchName?: string;
  agentId: string;
  agentName?: string;
  department: Department;
  courseId: string;
  courseName: string;
  bookingDate: string;
  amount: number;
  paymentStatus?: PaymentStatus; // legacy: payments are handled by the accounts team
  departmentAmounts?: Partial<Record<Department, number>>; // purchase split across the 4 departments
  bookingStatus: BookingStatus;
  source: LeadSource;
  notes: string;
  createdAt: string;
  deliveredAt?: string; // set when the work is finished and handed over
}

export type TimelineEventType =
  | "created"
  | "visit"
  | "inquiry"
  | "call"
  | "note"
  | "status_change"
  | "followup_created"
  | "followup_result"
  | "agent_reassigned"
  | "branch_transferred"
  | "booking_created"
  | "review_requested"
  | "review_received"
  | "admin_action";

export interface TimelineEvent {
  id: string;
  leadId: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  type: TimelineEventType;
  title: string;
  details: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

export interface DistributionRule {
  autoDistribute: boolean;
  method: "round_robin" | "load_balanced" | "manual";
  maxLeadsPerAgentDay: number;
}

export interface PurchaseCategory {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export interface InvoiceLineItem {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  companyId?: string;
  companyName?: string;
  branchId: string;
  branchName?: string;
  agentId: string;
  agentName?: string;
  brokerId?: string;
  brokerName?: string;
  items: InvoiceLineItem[];
  totalAmount: number;
  status: "recorded" | "draft" | "paid" | "partial" | "cancelled"; // payment states are legacy
  notes?: string;
  createdAt: string;
}

export interface BrokerEntity {
  id: string;
  name: string;
  type: "individual" | "company" | "engineering_company" | "contractor";
  phone: string;
  whatsappPhone?: string;
  isSameWhatsApp?: boolean;
  email?: string;
  address?: string;
  totalReferrals: number;
  totalVolume: number;
  active: boolean;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "visit" | "booking" | "followup" | "system";
  targetRole?: UserRole;
  targetUserId?: string;
  targetBranchId?: string;
  dueDate: string;
  read: boolean;
  createdAt: string;
  linkTab?: string;
  leadId?: string;
}

export interface NotBoughtRecord {
  id: string;
  leadId: string;
  leadName: string;
  branchId: string;
  agentId: string;
  agentName?: string;
  createdAt: string;
  reasons: (
    | "price"
    | "comparing"
    | "competitor"
    | "unavailable"
    | "postponed"
    | "needs_approval"
    | "service"
    | "just_asking"
    | "other"
    | "unknown"
  )[];
  otherText?: string;
  note?: string;
}

// ---------- Customer reviews (a unique link per customer per visit/booking) ----------
export type ReviewStatus = "sent" | "answered" | "cancelled";

export interface ReviewAnalysis {
  kind: "complaint" | "note" | "praise";
  category?: string; // e.g. جودة، تأخير، تعامل، سعر
  severity?: "low" | "medium" | "high";
  summary?: string;
}

export interface ReviewRequest {
  /** The document id IS the secret token in the customer's link. */
  id: string;
  leadId: string;
  leadName: string;
  branchId: string;
  branchName?: string;
  agentId: string;
  agentName?: string;
  subjectKind: "visit" | "booking" | "general";
  subjectId?: string;
  subjectLabel: string; // shown to the customer, e.g. "زيارة فرع الإسكندرية يوم 12 أكتوبر"
  sentAt: string; // ISO
  status: ReviewStatus;
  /** The single 48h nudge: when the salesperson sent it. */
  reminderSentAt?: string;
  cancelReason?: string;
  cancelledAt?: string;
  // Filled by the customer from the public page.
  answeredAt?: string;
  isComplaint?: boolean;
  response?: {
    rating: number; // 1-5 overall
    treatment?: number;
    price?: number;
    quality?: number;
    wouldRecommend?: boolean;
    comment?: string;
  };
  ai?: ReviewAnalysis;
}

/** Managers can only add follow-up notes to a complaint; nothing is ever edited or deleted. */
export interface ReviewNote {
  id: string;
  requestId: string;
  text: string;
  kind: "note" | "resolved";
  byId: string;
  byName: string;
  at: string;
}
