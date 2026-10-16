import { InstallAppButton } from "../../pwa/PWAControls";
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
} from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { useTheme } from "../../context/ThemeContext";
import { roleNames } from "../../lib/presentation";

interface Props {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: string;
  onOpenLead: (id: string) => void;
}
const titles: Record<string, string> = {
  permissions: "مصفوفة الصلاحيات",
  dashboard: "الرئيسية",
  analytics_dashboard: "نظرة عامة",
  dept_dashboard: "الأقسام والفروع",
  clients: "العملاء",
  add_client: "عميل جديد",
  visits: "الزيارات والمعاينات",
  record_visit: "زيارة جديدة",
  followups: "المتابعات",
  due_followups: "متابعات اليوم",
  overdue_followups: "المتابعات المتأخرة",
  bookings: "الحجوزات والتعاقدات",
  invoices: "الفواتير",
  brokers: "الوسطاء والشركاء",
  reports: "التقارير",
  users: "الموظفون",
  branches: "الهيكل الإداري",
  teams: "فرق العمل",
  audit: "سجل العمليات",
  settings: "الإعدادات",
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
    setViewAsUser,
    previewUsers: users,
    leads,
    branches,
  } = useCRM();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDetailsElement>(null);
  const matches = query.trim()
    ? leads
        .filter(
          (l) =>
            l.name.includes(query.trim()) || l.phone.includes(query.trim()),
        )
        .slice(0, 5)
    : [];
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
          aria-label="فتح القائمة"
        >
          <Menu size={21} />
        </button>
        <span className="desktop-only">
          مساحة العمل <span className="breadcrumb-divider">/</span>
        </span>
        <strong>{titles[activeView] || "الرئيسية"}</strong>
      </div>
      <div className="header-tools">
        {canAccessPage(effectiveUser, "clients") && (
          <div className="header-search desktop-only" ref={searchRef}>
            <Search size={17} />
            <input
              aria-label="البحث عن عميل"
              placeholder="ابحث عن عميل أو رقم هاتف"
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
                aria-label="مسح البحث"
              >
                <X size={15} />
              </button>
            )}
            {showResults && query.trim() && (
              <div className="search-results">
                <small>نتائج البحث</small>
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
                  <p>مفيش عميل مطابق للاسم أو الرقم.</p>
                )}
              </div>
            )}
          </div>
        )}
        <InstallAppButton />
        <div className="theme-switch" role="group" aria-label="مظهر الواجهة">
          <button
            aria-label="المظهر الفاتح"
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
          >
            <Sun size={16} />
            <span>فاتح</span>
          </button>
          <button
            aria-label="المظهر الداكن"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
          >
            <Moon size={16} />
            <span>داكن</span>
          </button>
        </div>
        <details className="account-menu" ref={accountRef}>
          <summary aria-label="الحساب ونطاق العمل">
            <span className="avatar">
              {effectiveUser.name.replace(/^م\.\s*/, "").charAt(0)}
            </span>
            <ChevronDown size={13} />
          </summary>
          <div className="account-panel">
            <strong>{effectiveUser.name}</strong>
            <p>{roleNames[effectiveUser.role]}</p>
            {currentUser.role === "admin" && (
              <label>
                معاينة مساحة عمل موظف
                <select
                  aria-label="معاينة مساحة عمل موظف"
                  value={effectiveUser.id}
                  onChange={(e) => {
                    setViewAsUser(
                      e.target.value === currentUser.id
                        ? null
                        : users.find((u) => u.id === e.target.value) || null,
                    );
                    if (accountRef.current) accountRef.current.open = false;
                  }}
                >
                  {users
                    .filter((u) => u.active)
                    .map((u) => (
                      <option value={u.id} key={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <p className="account-note">
              <UserRound size={14} />
              {scopeLabel(effectiveUser)}
            </p>
          </div>
        </details>
      </div>
    </header>
  );
}
