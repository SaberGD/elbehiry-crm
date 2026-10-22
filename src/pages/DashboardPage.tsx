import { useState } from "react";
import { splitTotals, bookingSplit } from "../lib/purchases";
import {
  ArrowUpLeft,
  ArrowLeft,
  Plus,
  Users,
  PhoneCall,
  ShoppingBag,
  FileText,
  Building2,
  SlidersHorizontal,
  CalendarDays,
  Check,
  Clock3,
  CircleAlert,
  ChevronDown,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { useLanguage } from "../context/LanguageContext";
import {
  canAccessPage,
  canCreateCustomer,
  isSales,
  scopeLabel, worksOwnCustomers } from "../lib/access";
import {
  hasPermission,
  isDirector,
  positionNames,
  specialties,
} from "../lib/permissions";
import {
  departmentNames,
  followUpStatus,
  formatMoney,
} from "../lib/presentation";
import { BranchDetailsModal } from "../components/common/BranchDetailsModal";
import type { Branch } from "../types/crm";
interface Props {
  setActiveTab: (tab: string) => void;
  onOpenLead: (id: string) => void;
}
const departmentColors: Record<string, string> = {
  construction: "var(--department-construction)",
  decor: "var(--department-decor)",
  garden: "var(--department-garden)",
  general: "var(--department-general)",
};
export function DashboardPage({ setActiveTab, onOpenLead }: Props) {
  const {
    effectiveUser: u,
    leads: scopeLeads,
    followUps: scopeTasks,
    bookings: scopeBookings,
    branches: scopeBranches,
    purchaseInvoices: scopeInvoices,
  } = useCRM();
  const { tr, language, roleName } = useLanguage();
  const en = language === "en";
  const [branchFilter, setBranchFilter] = useState("all");
  const [sort, setSort] = useState("amount");
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const sales = worksOwnCustomers(u),
    has = (p: Parameters<typeof hasPermission>[1]) => hasPermission(u, p);
  const validSort =
    (sort === "amount" && has("bookings.view")) ||
    (sort === "late" && has("followups.view")) ||
    (sort === "missing" && has("customers.view"));
  const activeSort = validSort
    ? sort
    : has("bookings.view")
      ? "amount"
      : has("followups.view")
        ? "late"
        : has("customers.view")
          ? "missing"
          : "amount";
  const inScope = (branch?: string) =>
    branchFilter === "all" || branch === branchFilter;
  const branches = scopeBranches.filter((b) => inScope(b.id));
  const leads = scopeLeads.filter((l) => inScope(l.branchId));
  const followUps = scopeTasks.filter((f) => inScope(f.branchId));
  const active = scopeBookings.filter(
    (b) => inScope(b.branchId) && b.bookingStatus !== "cancelled",
  );
  const invoices = scopeInvoices.filter((i) => inScope(i.branchId));
  const due = followUps.filter((f) => followUpStatus(f) === "due");
  const overdue = followUps.filter((f) => followUpStatus(f) === "overdue");
  const tasks = followUps
    .filter((f) => !["completed", "cancelled"].includes(followUpStatus(f)))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const taskLeadIds = new Set(tasks.map((f) => f.leadId));
  const total = active.reduce((sum, b) => sum + b.amount, 0);
  const notBoughtYet = leads.filter(
    (l) => !active.some((b) => b.leadId === l.id),
  );
  const splitByDept = splitTotals(active);
  const departments = Object.entries(departmentNames).map(([id, name]) => ({
    id,
    name,
    amount: splitByDept[id as keyof typeof splitByDept],
    count: active.filter(
      (b) => bookingSplit(b)[id as keyof typeof splitByDept] > 0,
    ).length,
  }));
  const branchRows = branches
    .filter((b) => b.active)
    .map((b) => {
      const contracts = active.filter((c) => c.branchId === b.id);
      return {
        ...b,
        count: leads.filter((l) => l.branchId === b.id).length,
        late: overdue.filter((f) => f.branchId === b.id).length,
        missing: leads.filter(
          (l) =>
            l.branchId === b.id &&
            !["booked", "not_interested"].includes(l.status) &&
            !taskLeadIds.has(l.id),
        ).length,
        amount: contracts.reduce((s, c) => s + c.amount, 0),
        contracts: contracts.length,
        notBought: leads.filter(
          (l) =>
            l.branchId === b.id && !active.some((bk) => bk.leadId === l.id),
        ).length,
      };
    })
    .sort((a, b) =>
      activeSort === "late"
        ? b.late - a.late
        : activeSort === "missing"
          ? b.missing - a.missing
          : b.amount - a.amount,
    );
  const visibleBranches = branchRows.slice(0, showAllBranches ? undefined : 5);
  const maxAmount = Math.max(...branchRows.map((b) => b.amount), 1);
  const hasBranchSummary =
    !sales && (has("branches.view") || has("staff.view"));
  const date = new Intl.DateTimeFormat(en ? "en-GB" : "ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Cairo",
  }).format(new Date());
  const title = sales
    ? tr("يومك في الفرع", "Your day at the branch")
    : isDirector(u)
      ? tr("نظرة على المؤسسة", "Organization overview")
      : u.role === "branch_manager"
        ? tr("عملاؤك ومبيعات فرعك", "Your customers and branch sales")
        : u.role === "regional_manager"
          ? tr("مبيعات كل الفروع", "Sales across all branches")
          : tr("نطاق الإشراف", "Supervision scope");
  const metric = (
    page: string,
    label: string,
    value: number,
    note: string,
    Icon: typeof Users,
    tone = "neutral",
  ) =>
    canAccessPage(u, page) && (
      <button
        className={`metric studio-metric tone-${tone}`}
        key={page}
        onClick={() => setActiveTab(page)}
      >
        <span className="metric-top">
          <span>{label}</span>
          <span className="metric-icon">
            <Icon size={19} />
          </span>
        </span>
        <strong className="metric-value" dir="ltr">
          {value.toLocaleString("en-GB")}
        </strong>
        <span className="metric-bottom">
          <span className="metric-note">{note}</span>
          <ArrowUpLeft size={16} />
        </span>
      </button>
    );
  const attention = has("followups.view");
  return (
    <div className="design-dashboard">
      <div className="studio-heading">
        <div>
          <span className="eyebrow">
            {roleName(u.role)}
            {u.role === "supervisor"
              ? ` · ${specialties[u.specialty || "sales"]}`
              : ""}
          </span>
          <h1>
            {title}
            <span className="heading-stop" aria-hidden="true">
              .
            </span>
          </h1>
          <p>
            {sales
              ? tr("كل عميل، وموعده، وخطوتك الجاية.", "Every customer, their appointment, and your next step.")
              : tr("أداء الفروع وأولويات المتابعة في مساحة واحدة.", "Branch performance and follow-up priorities in one place.")}
          </p>
        </div>
        <div className="studio-heading-tools">
          <span className="studio-date">
            <CalendarDays size={15} />
            {date}
          </span>
          {canCreateCustomer(u) ? (
            <button
              className="btn-primary"
              onClick={() => setActiveTab("add_client")}
            >
              <Plus size={18} />
              {tr("عميل جديد", "New customer")}
            </button>
          ) : isDirector(u) ? (
            <button
              className="btn-secondary"
              onClick={() => setActiveTab("permissions")}
            >
              <SlidersHorizontal size={16} />
              {tr("الصلاحيات", "Permissions")}
            </button>
          ) : null}
        </div>
      </div>
      <div className="scope-strip">
        <span>
          <Building2 size={16} />
          {scopeLabel(u, en)}
        </span>
        <span className="scope-period">{tr("جميع الفترات", "All periods")}</span>
        {scopeBranches.length > 1 && (
          <label className="scope-select">
            <span className="sr-only">{tr("تصفية بيانات الرئيسية بالفرع", "Filter home data by branch")}</span>
            <select
              aria-label={tr(tr("تصفية بيانات الرئيسية بالفرع", "Filter home data by branch"), "Filter home data by branch")}
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setShowAllBranches(false);
              }}
            >
              <option value="all">{tr("كل الفروع المتاحة", "All available branches")}</option>
              {scopeBranches
                .filter((b) => b.active)
                .map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
            <ChevronDown size={15} />
          </label>
        )}
      </div>
      <div
        className={`studio-overview ${!attention ? "without-attention" : ""}`}
      >
        <section className="performance-hero" aria-label={tr(tr("ملخص الأداء", "Performance summary"), "Performance summary")}>
          <div className="hero-copy">
            <span className="hero-kicker">
              <span />{" "}
              {has("bookings.view")
                ? tr("إجمالي المشتريات المسجلة", "Total recorded purchases")
                : has("customers.view")
                  ? tr("العملاء في نطاقك", "Customers in your scope")
                  : tr("ملخص نطاق العمل", "Scope summary")}
            </span>
            <div className="hero-amount">
              <strong dir="ltr">
                {has("bookings.view")
                  ? formatMoney(total)
                  : has("customers.view")
                    ? leads.length
                    : branches.filter((b) => b.active).length}
              </strong>
              <span>
                {has("bookings.view")
                  ? tr("جنيه مصري", "Egyptian pounds")
                  : has("customers.view")
                    ? tr("عميل مسجل", "registered customers")
                    : tr("فرع متاح", "available branches")}
              </span>
            </div>
            <p>
              {has("bookings.view")
                ? tr(`${active.length} عملية شراء · إجمالي المشتريات على الأقسام الأربعة`, `${active.length} purchases · total purchases across the four departments`)
                : tr("المؤشرات المتاحة وفق اختصاصك وفروعك.", "Indicators available for your specialty and branches.")}
            </p>
            {canAccessPage(u, "reports") && (
              <button
                className="hero-link"
                onClick={() => setActiveTab("reports")}
              >
                {tr("قراءة التقارير", "Read reports")}
                <ArrowUpLeft size={18} />
              </button>
            )}
          </div>
          <div className="hero-mark" aria-hidden="true">
            <div />
            <div />
            <span>{tr("البحيري", "El Behery")}</span>
          </div>
          <span className="hero-footnote">
            {branchFilter === "all" ? tr("داخل نطاق عملك", "Within your scope") : branches[0]?.name}
          </span>
        </section>
        {attention && (
          <section
            className={`attention-card ${overdue.length ? "needs-attention" : ""}`}
            aria-label={tr(tr("ملخص المتابعات", "Follow-ups summary"), "Follow-ups summary")}
          >
            <div className="attention-top">
              <span className="attention-tag">
                <CircleAlert size={14} />
                {overdue.length ? tr("يحتاج مراجعة", "Needs review") : tr("أولويات اليوم", "Today's priorities")}
              </span>
              <span className="attention-icon">
                {overdue.length ? <Clock3 size={21} /> : <Check size={21} />}
              </span>
            </div>
            <h2>
              {sales
                ? overdue.length
                  ? tr("نبدأ بالمتابعات المتأخرة؟", "Start with the overdue follow-ups?")
                  : tr("مواعيدك، خطوة بخطوة.", "Your appointments, step by step.")
                : overdue.length
                  ? tr("متابعات تحتاج مراجعتك.", "Follow-ups that need your review.")
                  : tr("تابع التزام فريقك اليوم.", "Track your team's commitment today.")}
            </h2>
            <p>
              {sales
                ? tr("شوف الموعد وسجّل نتيجة التواصل من ملف العميل.", "See the appointment and log the contact result from the customer file.")
                : tr("راجع الموظف المسؤول والخطوة التالية لكل متابعة.", "Review the responsible employee and next step for each follow-up.")}
            </p>
            <div className="attention-numbers">
              <div>
                <strong>{overdue.length}</strong>
                <span>{tr("متابعات متأخرة", "Overdue follow-ups")}</span>
              </div>
              <div>
                <strong>{due.length}</strong>
                <span>{tr("مستحقة اليوم", "Due today")}</span>
              </div>
            </div>
            <button
              className="attention-link"
              onClick={() =>
                setActiveTab(
                  overdue.length ? "overdue_followups" : "due_followups",
                )
              }
            >
              {sales ? tr("عرض متابعاتي", "View my follow-ups") : tr("مراجعة المتابعات", "Review follow-ups")}
              <ArrowLeft size={17} />
            </button>
          </section>
        )}
      </div>
      <div className="metric-grid studio-metrics">
        {metric(
          "clients",
          sales ? tr("عملاؤك", "Your customers") : tr("العملاء المسجلون", "Registered customers"),
          leads.length,
          tr("داخل نطاق العمل", "Within scope"),
          Users,
        )}
        {metric(
          "bookings",
          tr("عمليات الشراء", "Purchases"),
          active.length,
          tr("باستبعاد الملغى", "Excluding cancelled"),
          ShoppingBag,
        )}
        {metric(
          "followups",
          sales ? tr("متابعات اليوم", "Today's follow-ups") : tr("متابعات متأخرة", "Overdue follow-ups"),
          sales ? due.length : overdue.length,
          sales ? `${overdue.length} متابعة متأخرة` : tr("داخل الفروع المتاحة", "Within available branches"),
          PhoneCall,
          overdue.length ? "warning" : "neutral",
        )}
        {metric(
          "invoices",
          tr("لم يشتروا بعد", "Haven't bought yet"),
          notBoughtYet.length,
          tr("عملاء بلا عملية شراء، فرص للمتابعة", "Customers with no purchase, follow-up opportunities"),
          FileText,
        )}
      </div>
      <div
        className={`studio-analysis-grid ${!hasBranchSummary ? "single-column" : ""}`}
      >
        {hasBranchSummary && (
          <section className="panel branch-performance">
            <div className="studio-panel-heading">
              <div>
                <span className="eyebrow">{tr("من الإجمالي للتفاصيل", "From totals to details")}</span>
                <h2>
                  {isDirector(u) || u.role === "regional_manager"
                    ? tr("مقارنة الفروع", "Branch comparison")
                    : tr("ملخص نطاق العمل", "Scope summary")}
                </h2>
                <p>{tr("راجع الأرقام، ثم افتح الفرع للتفاصيل.", "Review the numbers, then open the branch for details.")}</p>
              </div>
              <select
                className="studio-select"
                aria-label={tr(tr("ترتيب الفروع", "Sort branches"), "Sort branches")}
                value={activeSort}
                onChange={(e) => setSort(e.target.value)}
              >
                {has("bookings.view") && (
                  <option value="amount">{tr("إجمالي المشتريات", "Total purchases")}</option>
                )}
                {has("followups.view") && (
                  <option value="late">{tr("تأخر المتابعة", "Follow-up delays")}</option>
                )}
                {has("customers.view") && (
                  <option value="missing">{tr("بدون خطوة تالية", "No next step")}</option>
                )}
                {!has("bookings.view") &&
                  !has("followups.view") &&
                  !has("customers.view") && (
                    <option value="amount">{tr("الترتيب الحالي", "Current order")}</option>
                  )}
              </select>
            </div>
            <div className="table-scroll branch-desktop">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{tr("الفرع / المسؤول", "Branch / manager")}</th>
                    {has("bookings.view") && <th>{tr("إجمالي المشتريات", "Total purchases")}</th>}
                    {has("followups.view") && <th>{tr("متابعات متأخرة", "Overdue follow-ups")}</th>}
                    {has("customers.view") && <th>{tr("بدون خطوة تالية", "No next step")}</th>}
                    {has("customers.view") && <th>{tr("لم يشتروا بعد", "Haven't bought yet")}</th>}
                    <th>
                      <span className="sr-only">{tr("تفاصيل الفرع", "Branch details")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBranches.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <button
                          className="branch-name"
                          onClick={() => setSelectedBranch(b)}
                        >
                          {b.name}
                        </button>
                        <span className="table-secondary">
                          {b.managerName || tr("مدير الفرع غير محدد", "Branch manager not set")}
                        </span>
                      </td>
                      {has("bookings.view") && (
                        <td className="branch-value">
                          <strong>
                            <bdi>{formatMoney(b.amount)}</bdi>{" "}
                            <small>{tr("ج.م", "EGP")}</small>
                          </strong>
                          <div className="branch-volume" aria-hidden="true">
                            <span
                              style={{
                                width: `${(b.amount / maxAmount) * 100}%`,
                              }}
                            />
                          </div>
                          {!b.contracts && (
                            <span className="no-records">
                              {tr("لا توجد مشتريات مسجلة", "No purchases recorded")}
                            </span>
                          )}
                        </td>
                      )}
                      {has("followups.view") && (
                        <td>
                          <span
                            className={`count-badge ${b.late ? "is-alert" : ""}`}
                          >
                            {b.late}
                          </span>
                        </td>
                      )}
                      {has("customers.view") && (
                        <td>
                          <span
                            className={`count-badge ${b.missing ? "is-pending" : ""}`}
                          >
                            {b.missing}
                          </span>
                        </td>
                      )}
                      {has("customers.view") && <td>{b.notBought}</td>}
                      <td>
                        <button
                          className="branch-open"
                          onClick={() => setSelectedBranch(b)}
                          aria-label={tr(`عرض فرع ${b.name}`, `View branch ${b.name}`)}
                        >
                          <ArrowUpLeft size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="branch-mobile-list">
              {visibleBranches.map((b) => (
                <article className="branch-mobile-card" key={b.id}>
                  <div>
                    <button
                      className="branch-name"
                      onClick={() => setSelectedBranch(b)}
                    >
                      {b.name}
                    </button>
                    <button
                      className="branch-open"
                      aria-label={tr(`عرض فرع ${b.name}`, `View branch ${b.name}`)}
                      onClick={() => setSelectedBranch(b)}
                    >
                      <ArrowUpLeft size={17} />
                    </button>
                  </div>
                  <p>{b.managerName || tr("مدير الفرع غير محدد", "Branch manager not set")}</p>
                  {has("bookings.view") && (
                    <strong className="branch-mobile-amount">
                      <bdi>{formatMoney(b.amount)}</bdi> <small>{tr("ج.م", "EGP")}</small>
                    </strong>
                  )}
                  <div className="branch-mobile-meta">
                    {has("followups.view") && (
                      <span>
                        <i className={b.late ? "dot-alert" : "dot-neutral"} />
                        {tr(`${b.late} متابعة متأخرة`, `${b.late} overdue follow-ups`)}
                      </span>
                    )}
                    {has("customers.view") && (
                      <span>{tr(`${b.missing} بدون خطوة تالية`, `${b.missing} with no next step`)}</span>
                    )}
                    {has("invoices.view") && (
                      <span>{tr(`${b.notBought} لم يشتروا بعد`, `${b.notBought} haven't bought yet`)}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {!branchRows.length && (
              <div className="empty-state">
                <Building2 size={25} />
                <h3>{tr("نطاق العمل لم يُحدد بعد", "Scope not set yet")}</h3>
                <p>{tr("حدد فروع الموظف من ملفه لعرض مؤشرات أدائه.", "Set the employee's branches from their profile to show their performance indicators.")}</p>
              </div>
            )}
            <div className="studio-panel-footer">
              <p>
                {tr("إجمالي المشتريات لكل الفترات. غياب السجلات لا يكفي لتقييم أداء الفرع.", "Total purchases for all periods. Missing records are not enough to judge a branch's performance.")}
              </p>
              {branchRows.length > 5 && (
                <button
                  className="btn-text"
                  onClick={() => setShowAllBranches((v) => !v)}
                >
                  {showAllBranches
                    ? tr("عرض مختصر", "Show less")
                    : tr(`كل الفروع (${branchRows.length})`, `All branches (${branchRows.length})`)}
                  <ChevronDown
                    size={15}
                    className={showAllBranches ? "is-rotated" : ""}
                  />
                </button>
              )}
            </div>
          </section>
        )}
        {has("bookings.view") && (
          <section className="panel department-composition">
            <div className="studio-panel-heading">
              <div>
                <span className="eyebrow">{tr("توزيع النشاط", "Activity distribution")}</span>
                <h2>{tr("كل قسم، ونصيبه", "Each department and its share")}</h2>
                <p>{tr("من إجمالي المشتريات", "Of total purchases")}</p>
              </div>
              <ShoppingBag size={20} />
            </div>
            <div className="composition-track" aria-hidden="true">
              {departments.map((d) => (
                <span
                  key={d.id}
                  style={{
                    width: `${total ? (d.amount / total) * 100 : 0}%`,
                    background: departmentColors[d.id],
                  }}
                />
              ))}
            </div>
            <div className="studio-departments">
              {departments.map((d) => (
                <div className="studio-department" key={d.id}>
                  <div
                    className="department-dot"
                    style={{ background: departmentColors[d.id] }}
                  />
                  <div>
                    <h3>{d.name}</h3>
                    <p>{d.count} {tr("عملية شراء", "purchases")}</p>
                  </div>
                  <div className="department-figure">
                    <strong>
                      <bdi>{formatMoney(d.amount)}</bdi>
                    </strong>
                    <small>
                      {total ? `${Math.round((d.amount / total) * 100)}٪` : "—"}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            <div className="department-note">
              <span>{tr("ج.م", "EGP")}</span>
              <p>
                {tr("القيم هي إجمالي المشتريات غير الملغاة موزّعة على الأقسام الأربعة.", "Values are the total of non-cancelled purchases split across the four departments.")}
              </p>
            </div>
          </section>
        )}
      </div>
      {has("followups.view") && (
        <section className="panel studio-followups">
          <div className="studio-panel-heading">
            <div>
              <span className="eyebrow">{tr("الخطوة القادمة", "Next step")}</span>
              <h2>
                {sales ? tr("المتابعات الأقرب", "Nearest follow-ups") : tr("المتابعات التي تحتاج مراجعة", "Follow-ups needing review")}
              </h2>
              <p>
                {sales
                  ? tr("المتأخر أولًا، وبعده أقرب موعد.", "Overdue first, then the nearest appointment.")
                  : tr("الموعد والمسؤول وآخر سبب مسجل للمتابعة.", "Appointment, owner, and last recorded follow-up reason.")}
              </p>
            </div>
            <button
              className="btn-text"
              onClick={() => setActiveTab("followups")}
            >
              {tr("كل المتابعات", "All follow-ups")}
              <ArrowLeft size={16} />
            </button>
          </div>
          <div className="studio-task-list">
            {tasks.slice(0, 4).map((f) => {
              const status = followUpStatus(f);
              return (
                <article className="studio-task" key={f.id}>
                  <span className="task-symbol">
                    <PhoneCall size={19} />
                  </span>
                  <div className="studio-task-copy">
                    <h3>{f.leadName}</h3>
                    <p>{f.reason}</p>
                    <span>
                      {f.assignedAgentName || tr("الموظف المسؤول", "Responsible employee")} ·{" "}
                      <bdi>{f.scheduledAt.replace("T", " ").slice(0, 16)}</bdi>
                    </span>
                  </div>
                  <span
                    className={`status-pill ${status === "overdue" ? "is-new" : status === "due" ? "is-warning" : ""}`}
                  >
                    <i />
                    {status === "overdue"
                      ? tr("متأخرة", "Overdue")
                      : status === "due"
                        ? tr("اليوم", "Today")
                        : tr("قادمة", "Upcoming")}
                  </span>
                  {has("customers.view") &&
                    scopeLeads.some((l) => l.id === f.leadId) && (
                      <button
                        className="btn-secondary"
                        onClick={() => onOpenLead(f.leadId)}
                      >
                        {tr("ملف العميل", "Customer file")}
                        <ArrowUpLeft size={16} />
                      </button>
                    )}
                </article>
              );
            })}
            {!tasks.length && (
              <div className="empty-state">
                <Check size={27} />
                <h3>{tr("لا توجد متابعات معلّقة", "No pending follow-ups")}</h3>
                <p>{tr("أي مواعيد جديدة داخل نطاقك هتظهر هنا.", "Any new appointments in your scope will appear here.")}</p>
              </div>
            )}
          </div>
        </section>
      )}
      <footer className="studio-page-footer">
        <span>
          <span className="brand-dot" />
          {tr("البحيري للدهانات والديكور", "El Behery for Paints and Decor")}
        </span>
        <span>{tr("تفاصيل وجودة تليق بذوقك", "Quality and detail that suit your taste")}</span>
      </footer>
      <BranchDetailsModal
        key={selectedBranch?.id}
        branch={selectedBranch}
        isOpen={!!selectedBranch}
        onClose={() => setSelectedBranch(null)}
        onOpenLead={onOpenLead}
      />
    </div>
  );
}
