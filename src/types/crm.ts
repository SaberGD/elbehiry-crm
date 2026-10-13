export type UserRole =
  | 'admin'
  | 'general_manager'
  | 'regional_manager'
  | 'branch_manager'
  | 'supervisor'
  | 'team_leader'
  | 'sales_agent';

export interface FinancialHistoryEntry {
  id: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
  baseSalary: number;
  commissionRate: number; // percentage e.g. 5
  bonus: number;
  deductions: number;
  effectiveDate: string;
  notes?: string;
}

export interface FinancialRecord {
  baseSalary: number;
  commissionRate: number;
  bonus: number;
  deductions: number;
  effectiveDate: string;
  history?: FinancialHistoryEntry[];
}

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
  salaryInfo?: FinancialRecord;
  permissions?: string[];
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

export type BranchType = 'main_hq' | 'showroom' | 'warehouse' | 'store' | 'project_site';

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

export type Department = 'construction' | 'decor' | 'garden' | 'general';

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
  | 'new'
  | 'uncontacted'
  | 'contacted'
  | 'interested'
  | 'prospect'
  | 'needs_followup'
  | 'not_interested'
  | 'booked';

export type LeadClassification = 'A' | 'B' | 'C' | 'VIP';

export type LeadSource =
  | 'facebook'
  | 'instagram'
  | 'google'
  | 'walk_in'
  | 'referral'
  | 'phone_inquiry'
  | 'whatsapp'
  | 'exhibition'
  | 'other';

export type CustomerCategory =
  | 'individual'
  | 'engineering_company'
  | 'decor_company'
  | 'contractor'
  | 'engineer'
  | 'painter'
  | 'technician'
  | 'broker_individual'
  | 'broker_company';

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
  courseOfInterest?: string; // alias for department / service details
  locationRating?: number;  // 1-5 rating for location
  treatmentRating?: number; // 1-5 rating for staff treatment
  priceRating?: number;     // 1-5 rating for pricing
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
}

export interface Visit {
  id: string;
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

export type FollowUpStatus = 'due' | 'upcoming' | 'completed' | 'overdue' | 'cancelled';
export type FollowUpType = 'call' | 'whatsapp' | 'branch_visit' | 'email' | 'meeting';

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
}

export type BookingStatus = 'confirmed' | 'pending_payment' | 'completed' | 'cancelled';
export type PaymentStatus = 'full' | 'deposit' | 'pending' | 'refunded';

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
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  source: LeadSource;
  notes: string;
  createdAt: string;
}

export type TimelineEventType =
  | 'created'
  | 'visit'
  | 'inquiry'
  | 'call'
  | 'note'
  | 'status_change'
  | 'followup_created'
  | 'followup_result'
  | 'agent_reassigned'
  | 'branch_transferred'
  | 'booking_created'
  | 'admin_action';

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
  method: 'round_robin' | 'load_balanced' | 'manual';
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
  status: 'draft' | 'paid' | 'partial' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface BrokerEntity {
  id: string;
  name: string;
  type: 'individual' | 'company' | 'engineering_company' | 'contractor';
  phone: string;
  whatsappPhone?: string;
  isSameWhatsApp?: boolean;
  email?: string;
  taxNumber?: string;
  address?: string;
  commissionRate: number; // e.g. 5%
  totalReferrals: number;
  totalVolume: number;
  active: boolean;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'visit' | 'booking' | 'followup' | 'system';
  targetRole?: UserRole;
  targetUserId?: string;
  targetBranchId?: string;
  dueDate: string;
  read: boolean;
  createdAt: string;
  linkTab?: string;
  leadId?: string;
}
