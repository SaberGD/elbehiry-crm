import { canAccessPage, scopeLabel, isSales, worksOwnCustomers } from "../../lib/access";
import { useEffect } from "react";
import {
  Users,
  Building2,
  PhoneCall,
  ShoppingBag,
  BarChart3,
  Award,
  Code2,
  Settings,
  Compass,
  FileText,
  UserRound,
  X,
  LayoutDashboard,
  ChevronDown,
  ArrowUpLeft,
  Network,
  ShieldCheck,
  MessageSquareWarning,
} from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { useLanguage } from "../../context/LanguageContext";
import { ElBeheryLogo } from "../common/ElBeheryLogo";
import { followUpStatus, isManagement } from "../../lib/presentation";
import { complaintState, isComplaint, reviewPhase } from "../../lib/reviews";

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}
export function Sidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
}: Props) {
  const { effectiveUser, followUps, branches, leads, reviewRequests, reviewNotes } = useCRM();
  const { tr, language } = useLanguage();
  // Managers see open complaints; salespeople see reviews that need their 48-hour nudge.
  const manager = ["admin", "general_manager", "regional_manager", "branch_manager"].includes(effectiveUser.role);
  const feedbackCount = reviewRequests.filter((r) =>
    manager ? isComplaint(r) && complaintState(r, reviewNotes) === "open" : reviewPhase(r) === "reminder_due",
  ).length;
  const count = followUps.filter((f) =>
    ["due", "overdue"].includes(followUpStatus(f)),
  ).length;
  useEffect(() => {
    if (!sidebarOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [sidebarOpen, setSidebarOpen]);
  const go = (id: string) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };
  const nav = (
    id: string,
    label: string,
    Icon: typeof Users,
    badge?: number,
  ) =>
    canAccessPage(effectiveUser, id) ? (
      <button
        key={id}
        aria-label={label}
        onClick={() => go(id)}
        aria-current={
          activeTab === id ||
          (id === "followups" && activeTab.endsWith("_followups"))
            ? "page"
            : undefined
        }
        className="side-link"
      >
        <Icon size={19} strokeWidth={1.6} />
        <span>{label}</span>
        {!!badge && <span className="nav-count">{badge}</span>}
      </button>
    ) : null;
  return (
    <>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label={tr("إغلاق القائمة", "Close menu")}
        />
      )}
      <aside
        className={`behery-sidebar ${sidebarOpen ? "is-open" : ""}`}
        aria-label={tr("القائمة الرئيسية", "Main menu")}
      >
        <div className="sidebar-brand">
          <ElBeheryLogo size="lg" />
          <button
            className="icon-button mobile-only"
            onClick={() => setSidebarOpen(false)}
            aria-label={tr("إغلاق القائمة", "Close menu")}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="brand-dot" />
          {tr("مساحة العمل", "Workspace")}
        </div>
        <nav>
          <p className="nav-group-label">{tr("العمل اليومي", "Daily work")}</p>
          {nav("dashboard", tr("الرئيسية", "Home"), LayoutDashboard)}
          {nav("clients", tr("العملاء", "Customers"), Users)}
          {nav(
            "followups",
            worksOwnCustomers(effectiveUser) ? tr("متابعاتي", "My follow-ups") : tr("متابعة أداء الموظفين", "Team follow-ups"),
            PhoneCall,
            count,
          )}
          {nav("visits", tr("الزيارات", "Visits"), Compass)}
          {nav("feedback", tr("التقييمات والشكاوى", "Reviews & complaints"), MessageSquareWarning, feedbackCount)}
          <p className="nav-group-label">{tr("المبيعات", "Sales")}</p>
          {nav("bookings", tr("المشتريات", "Purchases"), ShoppingBag)}
          {nav("overview", tr("كبار العملاء والوسطاء", "Top customers & brokers"), Award)}
          {nav("brokers", tr("الوسطاء والشركاء", "Brokers & partners"), UserRound)}
          {nav(
            "reports",
            isManagement(effectiveUser) ? tr("التقارير", "Reports") : tr("أدائي", "My performance"),
            BarChart3,
          )}
          {[
            "users",
            "branches",
            "audit",
            "dept_dashboard",
            "permissions",
            "developer",
          ].some((page) => canAccessPage(effectiveUser, page)) && (
            <details
              className="nav-management"
              open={
                [
                  "users",
                  "branches",
                  "audit",
                  "dept_dashboard",
                  "permissions",
                  "developer",
                ].includes(activeTab) || undefined
              }
            >
              <summary>
                {tr("إدارة المؤسسة", "Organization")}
                <ChevronDown size={15} />
              </summary>
              {nav("users", tr("الموظفون", "Staff"), Users)}
              {nav("branches", tr("الهيكل الإداري", "Org structure"), Network)}
              {nav("dept_dashboard", tr("الأقسام والفروع", "Departments & branches"), Building2)}
              {nav("audit", tr("سجل العمليات", "Audit log"), ShieldCheck)}
              {nav("permissions", tr("مصفوفة الصلاحيات", "Permissions matrix"), ShieldCheck)}
              {nav("developer", tr("قسم المطورين", "Developers"), Code2)}
            </details>
          )}
        </nav>
        <div className="sidebar-bottom">
          {nav("settings", tr("الإعدادات", "Settings"), Settings)}
          <div className="branch-caption">
            <Building2 size={17} />
            <div>
              <small>{tr("نطاق العمل", "Scope")}</small>
              <span>{scopeLabel(effectiveUser, language === "en")}</span>
            </div>
            <ArrowUpLeft size={15} />
          </div>
          <p>
            {tr("البحيري", "El Behery")} <span>·</span> {tr("تفاصيل وجودة تليق بذوقك", "Quality and detail that suit your taste")}
          </p>
        </div>
      </aside>
    </>
  );
}
