import { InstallAppButton } from "../../pwa/PWAControls";
import { ChangePasswordForm } from "../common/ChangePasswordForm";
import { scopeLabel, canAccessPage } from "../../lib/access";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Search,
  Sun,
  Moon,
  ChevronDown,
  X,
  UserRound,
  ArrowUpLeft,
  LogOut,
  KeyRound,
} from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import type { Lead, UserRole } from "../../types/crm";
import { searchLeads } from "../../lib/leadQueries";
import { profileOf, scopesFor } from "../../lib/scopes";
import { roleNames } from "../../lib/presentation";

interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: string;
  onOpenLead: (id: string) => void;
}
const titles: Record<string, string> = {
  permissions: "مصفوفة الصلاحيات",
  developer: "قسم المطورين",
  dashboard: "الرئيسية",
  analytics_dashboard: "نظرة عامة",
  dept_dashboard: "الأقسام والفروع",
  feedback: "التقييمات والشكاوى",
  clients: "العملاء",
  add_client: "عميل جديد",
  visits: "الزيارات والمعاينات",
  record_visit: "زيارة جديدة",
  followups: "المتابعات",
  due_followups: "متابعات اليوم",
  overdue_followups: "المتابعات المتأخرة",
  bookings: "المشتريات",
  invoices: "الفواتير",
  brokers: "الوسطاء والشركاء",
  overview: "كبار العملاء والوسطاء",
  reports: "التقارير",
  users: "الموظفون",
  branches: "الهيكل الإداري",
  teams: "فرق العمل",
  audit: "سجل العمليات",
  settings: "الإعدادات",
};
const titlesEn: Record<string, string> = {
  permissions: "Permissions matrix",
  developer: "Developers",
  dashboard: "Home",
  analytics_dashboard: "Overview",
  dept_dashboard: "Departments & branches",
  feedback: "Reviews & complaints",
  clients: "Customers",
  add_client: "New customer",
  visits: "Visits & inspections",
  record_visit: "New visit",
  followups: "Follow-ups",
  due_followups: "Today's follow-ups",
  overdue_followups: "Overdue follow-ups",
  bookings: "Bookings & contracts",
  invoices: "Invoices",
  brokers: "Brokers & partners",
  overview: "Top customers & brokers",
  reports: "Reports",
  users: "Staff",
  branches: "Org structure",
  teams: "Work teams",
  audit: "Audit log",
  settings: "Settings",
};
export function Navbar({
  sidebarOpen,
  setSidebarOpen,
  activeView,
  onOpenLead,
}: Props) {
  const {
    effectiveUser,
    currentUser,
    logout,
    setViewAsUser,
    viewAsUser,
    previewUsers: users,
    leads,
    branches,
    injectLeads,
    requestAllLeads,
    searchIndexReady,
  } = useCRM();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, tr, roleName } = useLanguage();
  const en = language === "en";
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDetailsElement>(null);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState("");
  const previewRoles: UserRole[] = ["general_manager", "regional_manager", "branch_manager"];
  const previewRoleLabels: Record<string, string> = {
    general_manager: roleName("general_manager"),
    regional_manager: roleName("regional_manager"),
    branch_manager: roleName("branch_manager"),
    supervisor: roleName("supervisor"),
    sales_agent: roleName("sales_agent"),
  };
  const viewValue = !viewAsUser ? "me" : viewAsUser.id.startsWith("preview:") ? `role:${viewAsUser.role}` : `user:${viewAsUser.id}`;
  const applyView = (value: string, branchChoice: string) => {
    if (value === "me") setViewAsUser(null);
    else if (value.startsWith("user:")) setViewAsUser(users.find((u) => u.id === value.slice(5)) || null);
    else {
      const role = value.slice(5) as UserRole;
      const needsBranch = !["general_manager", "regional_manager"].includes(role);
      const branch = needsBranch ? branchChoice || branches[0]?.id || "" : "";
      setViewBranch(branch);
      setViewAsUser({
        id: `preview:${role}:${branch}`,
        name: `${previewRoleLabels[role]} (${tr("معاينة", "preview")})`,
        email: "",
        phone: "",
        createdAt: "",
        role,
        branchId: branch || undefined,
        active: true,
        specialty: "sales",
        supervisedBranchIds: role === "supervisor" && branch ? [branch] : undefined,
      });
    }
    if (accountRef.current && value !== "me" && !value.startsWith("role:")) accountRef.current.open = false;
  };
  // The database looks the customer up (an indexed search, a few rows). Until the customers are indexed, the full
  // list is read for as long as someone is searching, and searched here.
  const typed = query.trim();
  const [found, setFound] = useState<Lead[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
  const serverSearch = searchIndexReady && !searchFailed;
  useEffect(() => (typed && !serverSearch ? requestAllLeads() : undefined), [!!typed, serverSearch, requestAllLeads]);
  useEffect(() => {
    if (!typed || !serverSearch) return setFound([]);
    let current = true;
    const timer = setTimeout(() => {
      searchLeads(scopesFor(profileOf(effectiveUser)).leads, typed, 6)
        .then((rows) => {
          if (!current) return;
          injectLeads(rows);
          setFound(rows);
        })
        .catch((e) => {
          if (!current) return;
          setFound([]);
          // The database could not answer (its index is not deployed yet): search the full list instead.
          if ((e as { code?: string })?.code === "failed-precondition") setSearchFailed(true);
        });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, serverSearch, effectiveUser.id, effectiveUser.role, effectiveUser.branchId]);
  const matches = !typed
    ? []
    : serverSearch
      ? found
      : leads.filter((l) => l.name.includes(typed) || l.phone.includes(typed)).slice(0, 5);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setShowResults(false);
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        accountRef.current.open = false;
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (accountRef.current) accountRef.current.open = false;
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <header className="behery-header">
      <div className="header-location">
        <button
          className="icon-button mobile-only"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={tr("فتح القائمة", "Open menu")}
        >
          <Menu size={21} />
        </button>
        <span className="desktop-only">
          {tr("مساحة العمل", "Workspace")} <span className="breadcrumb-divider">/</span>
        </span>
        <strong>{(en ? titlesEn : titles)[activeView] || tr("الرئيسية", "Home")}</strong>
      </div>
      <div className="header-tools">
        {canAccessPage(effectiveUser, "clients") && (
          <div className="header-search desktop-only" ref={searchRef}>
            <Search size={17} />
            <input
              aria-label={tr("البحث عن عميل", "Search customers")}
              placeholder={tr("ابحث عن عميل أو رقم هاتف", "Search by customer name or phone")}
              value={query}
              onFocus={() => setShowResults(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowResults(false);
                if (e.key === "Enter" && matches.length) {
                  onOpenLead(matches[0].id);
                  setShowResults(false);
                  setQuery("");
                }
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setShowResults(false);
                }}
                aria-label={tr("مسح البحث", "Clear search")}
              >
                <X size={15} />
              </button>
            )}
            {showResults && query.trim() && (
              <div className="search-results">
                <small>{tr("نتائج البحث", "Search results")}</small>
                {matches.length ? (
                  matches.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        onOpenLead(l.id);
                        setQuery("");
                        setShowResults(false);
                      }}
                    >
                      <span>
                        <strong>{l.name}</strong>
                        <small dir="ltr">{l.phone}</small>
                      </span>
                      <ArrowUpLeft size={16} />
                    </button>
                  ))
                ) : (
                  <p>{tr("مفيش عميل مطابق للاسم أو الرقم.", "No customer matches that name or number.")}</p>
                )}
              </div>
            )}
          </div>
        )}
        <InstallAppButton />
        <button
          type="button"
          className="icon-button"
          style={{ fontWeight: 700, fontSize: 13, minWidth: 40 }}
          onClick={() => setLanguage(en ? "ar" : "en")}
          aria-label={tr("Switch to English", "التحويل إلى العربية")}
          title={tr("Switch to English", "التحويل إلى العربية")}
        >
          {en ? "ع" : "EN"}
        </button>
        <div className="theme-switch" role="group" aria-label={tr("مظهر الواجهة", "Appearance")}>
          <button
            aria-label={tr("المظهر الفاتح", "Light theme")}
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <Sun size={16} />
            <span>{tr("فاتح", "Light")}</span>
          </button>
          <button
            aria-label={tr("المظهر الداكن", "Dark theme")}
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <Moon size={16} />
            <span>{tr("داكن", "Dark")}</span>
          </button>
        </div>
        <details className="account-menu" ref={accountRef}>
          <summary aria-label={tr("الحساب ونطاق العمل", "Account and scope")}>
            <span className="avatar">
              {effectiveUser.name.replace(/^م\.\s*/, "").charAt(0)}
            </span>
            <ChevronDown size={13} />
          </summary>
          <div className="account-panel">
            <strong>{effectiveUser.name}</strong>
            <p>{roleName(effectiveUser.role)}</p>
            {(currentUser.role === "admin" || currentUser.role === "general_manager") && (
              <div className="view-as">
                <label>
                  {tr("شوف النظام كـ", "View the system as")}
                  <select
                    aria-label={tr("شوف النظام كـ", "View the system as")}
                    value={viewValue}
                    onChange={(e) => applyView(e.target.value, viewBranch)}
                  >
                    <option value="me">{tr("حسابي", "My account")} ({roleName(currentUser.role)})</option>
                    <optgroup label={tr("دور وظيفي", "Job role")}>
                      {previewRoles
                        .filter((r) => currentUser.role === "admin" || r !== "general_manager")
                        .map((r) => (
                          <option key={r} value={`role:${r}`}>
                            {previewRoleLabels[r]}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label={tr("موظف بعينه", "Specific employee")}>
                      {users
                        .filter((u) => u.id !== currentUser.id)
                        .map((u) => (
                          <option value={`user:${u.id}`} key={u.id}>
                            {u.name} — {roleName(u.role)}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </label>
                {viewValue.startsWith("role:") && viewValue !== "role:general_manager" && viewValue !== "role:regional_manager" && (
                  <label>
                    {tr("في فرع", "In branch")}
                    <select aria-label={tr("الفرع", "Branch")} value={viewBranch} onChange={(e) => applyView(viewValue, e.target.value)}>
                      {branches.length === 0 && <option value="">{tr("لا توجد فروع بعد", "No branches yet")}</option>}
                      {branches.map((b) => (
                        <option value={b.id} key={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
            <p className="account-note">
              <UserRound size={14} />
              {scopeLabel(effectiveUser, en)}
            </p>
            <button
              type="button"
              className="password-button"
              onClick={() => {
                setPwdOpen(true);
                if (accountRef.current) accountRef.current.open = false;
              }}
            >
              <KeyRound size={14} />
              {tr("تغيير كلمة المرور", "Change password")}
            </button>
            <button
              type="button"
              className="logout-button"
              onClick={() => logout()}
            >
              <LogOut size={14} />
              {tr("تسجيل الخروج", "Sign out")}
            </button>
          </div>
        </details>
      </div>
      {pwdOpen && (
        <div
          className="dialog-backdrop"
          style={{ zIndex: 90 }}
          onClick={() => setPwdOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tr("تغيير كلمة المرور", "Change password")}
            onClick={(e) => e.stopPropagation()}
            dir={en ? "ltr" : "rtl"}
            style={{ width: "min(380px,100%)", background: "#1d1d1c", color: "#dfe2ee", borderRadius: 16, padding: 24 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <strong>{tr("تغيير كلمة المرور", "Change password")}</strong>
              <button className="icon-button" aria-label={tr("إغلاق", "Close")} onClick={() => setPwdOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <ChangePasswordForm />
          </div>
        </div>
      )}
    </header>
  );
}
