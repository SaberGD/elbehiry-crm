import { useState } from "react";
import {
  ArrowUpLeft,
  Plus,
  Users,
  PhoneCall,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import {
  canAccessPage,
  canCreateCustomer,
  isSales,
  scopeLabel,
} from "../lib/access";
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
interface Props {
  setActiveTab: (tab: string) => void;
  onOpenLead: (id: string) => void;
}
export function DashboardPage({ setActiveTab, onOpenLead }: Props) {
  const {
    effectiveUser: u,
    leads,
    followUps,
    bookings,
    branches,
    users,
    purchaseInvoices,
  } = useCRM();
  const [showAllBranches, setShowAllBranches] = useState(false);
  const sales = isSales(u);
  const has = (p: Parameters<typeof hasPermission>[1]) => hasPermission(u, p);
  const due = followUps.filter((f) => followUpStatus(f) === "due");
  const overdue = followUps.filter((f) => followUpStatus(f) === "overdue");
  const active = bookings.filter((b) => b.bookingStatus !== "cancelled");
  const tasks = followUps
    .filter((f) => !["completed", "cancelled"].includes(followUpStatus(f)))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const total = active.reduce((s, b) => s + b.amount, 0);
  const branchRows = branches
    .filter((b) => b.active)
    .map((b) => ({
      ...b,
      count: leads.filter((l) => l.branchId === b.id).length,
      late: overdue.filter((f) => f.branchId === b.id).length,
      missing: leads.filter(
        (l) =>
          l.branchId === b.id &&
          !["booked", "not_interested"].includes(l.status) &&
          !tasks.some((f) => f.leadId === l.id),
      ).length,
      amount: active
        .filter((c) => c.branchId === b.id)
        .reduce((s, c) => s + c.amount, 0),
      invoices: purchaseInvoices.filter((i) => i.branchId === b.id),
    }))
    .sort((a, b) => b.amount - a.amount);
  const metric = (
    page: string,
    label: string,
    value: string | number,
    note: string,
    Icon: typeof Users,
  ) =>
    canAccessPage(u, page) && (
      <button className="metric" onClick={() => setActiveTab(page)} key={page}>
        <span className="metric-top">
          {label}
          <Icon />
        </span>
        <strong className="metric-value">{value}</strong>
        <span className="metric-note">{note}</span>
      </button>
    );
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {positionNames[u.role]}
            {u.role === "supervisor"
              ? ` · ${specialties[u.specialty || "sales"]}`
              : ""}
          </span>
          <h1>
            {sales
              ? "يومك في الفرع"
              : isDirector(u)
                ? "نظرة على المؤسسة"
                : u.role === "branch_manager"
                  ? "أداء الفرع وفريقك"
                  : "نطاق الإشراف"}
          </h1>
          <p>
            {sales
              ? "عملاؤك ومواعيدك والخطوة القادمة."
              : u.specialty === "accounts"
                ? "راجع الفواتير وحالات السداد داخل نطاق إشرافك."
                : "راجع النتائج والتأخير والمسؤول عن كل خطوة."}{" "}
            · {scopeLabel(u)}
          </p>
        </div>
        {canCreateCustomer(u) && (
          <button
            className="btn-primary"
            onClick={() => setActiveTab("add_client")}
          >
            <Plus size={17} />
            عميل جديد
          </button>
        )}
      </div>
      {has("followups.view") && (
        <section className="overview-banner" aria-label="ملخص المتابعات">
          <div>
            <span className="banner-label">
              {sales ? "أولويات اليوم" : "متابعة الالتزام"}
            </span>
            <h2>
              {sales
                ? overdue.length
                  ? "عندك متابعات فات ميعادها"
                  : due.length
                    ? "متابعاتك المستحقة اليوم"
                    : "مفيش متابعات مستحقة اليوم"
                : overdue.length
                  ? "متابعات متأخرة تحتاج مراجعة المسؤولين"
                  : "راجع التزام الفروع بمواعيد المتابعة"}
            </h2>
            <p>
              {sales
                ? "افتح ملف العميل وسجّل نتيجة التواصل."
                : `${overdue.length} متابعة متأخرة في نطاقك. راجع الموظف المسؤول قبل تحديد الإجراء.`}
            </p>
          </div>
          <div className="banner-action">
            <div className="banner-number">
              <strong>{overdue.length + due.length}</strong>
              <small>
                {sales ? "متابعة مسندة لك" : "متابعة مستحقة في نطاقك"}
              </small>
            </div>
            <button
              onClick={() =>
                setActiveTab(
                  overdue.length ? "overdue_followups" : "due_followups",
                )
              }
            >
              {sales ? "عرض متابعاتي" : "مراجعة المتابعات"}
              <ArrowUpLeft size={20} />
            </button>
          </div>
        </section>
      )}
      <div className="metric-grid">
        {metric(
          "clients",
          sales ? "عملاؤك" : "عملاء نطاقك",
          leads.length,
          "وفق صلاحياتك ونطاق عملك",
          Users,
        )}
        {metric(
          "followups",
          sales ? "متابعات اليوم" : "متابعات متأخرة",
          sales ? due.length : overdue.length,
          sales ? `${overdue.length} متأخرة` : "راجع المسؤول وتاريخ الاستحقاق",
          PhoneCall,
        )}
        {metric(
          "bookings",
          "قيمة التعاقدات",
          `${formatMoney(total)} ج.م`,
          "كل الفترات · باستبعاد الملغى · ليست تحصيلًا",
          ShoppingBag,
        )}
        {metric(
          "invoices",
          "فواتير في انتظار السداد",
          purchaseInvoices.filter((i) =>
            ["draft", "partial"].includes(i.status),
          ).length,
          "مسودات ومدفوعة جزئيًا",
          TrendingUp,
        )}
      </div>
      {!sales && (has("branches.view") || has("staff.view")) && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                {isDirector(u) || u.role === "regional_manager"
                  ? "مقارنة الفروع"
                  : "ملخص نطاق العمل"}
              </h2>
              <p>
                {has("bookings.view")
                  ? "مرتبة حسب قيمة التعاقدات المسجلة لجميع الفترات؛ الترتيب ليس تقييمًا شاملًا للفرع."
                  : "المؤشرات المتاحة حسب اختصاصك."}
              </p>
            </div>
            {isDirector(u) && (
              <button
                className="btn-secondary"
                onClick={() => setActiveTab("permissions")}
              >
                مصفوفة الصلاحيات
              </button>
            )}
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الفرع والمسؤول</th>
                  {has("bookings.view") && <th>قيمة التعاقدات</th>}
                  {has("followups.view") && <th>متابعات متأخرة</th>}
                  {has("customers.view") && <th>عملاء بدون خطوة قادمة</th>}
                  {has("invoices.view") && <th>فواتير معلّقة</th>}
                </tr>
              </thead>
              <tbody>
                {branchRows
                  .slice(0, showAllBranches ? undefined : 6)
                  .map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.name}</strong>
                        <span className="table-secondary">
                          {b.managerName || "لم يحدد مدير للفرع"}
                        </span>
                      </td>
                      {has("bookings.view") && (
                        <td>{formatMoney(b.amount)} ج.م</td>
                      )}
                      {has("followups.view") && (
                        <td>
                          <button
                            className="btn-text"
                            onClick={() => setActiveTab("overdue_followups")}
                          >
                            {b.late}
                          </button>
                        </td>
                      )}
                      {has("customers.view") && <td>{b.missing}</td>}
                      {has("invoices.view") && (
                        <td>
                          {
                            b.invoices.filter((i) =>
                              ["draft", "partial"].includes(i.status),
                            ).length
                          }
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {branchRows.length > 6 && (
            <div className="filter-count">
              <span>
                نعرض {showAllBranches ? branchRows.length : 6} من{" "}
                {branchRows.length} فرع. غياب السجلات لا يكفي للحكم على أداء
                الفرع.
              </span>
              <button onClick={() => setShowAllBranches((v) => !v)}>
                {showAllBranches ? "عرض مختصر" : "عرض كل الفروع"}
              </button>
            </div>
          )}
          {!branchRows.length && (
            <p className="empty-state">
              لم يُحدد نطاق العمل. حدده من ملف الموظف.
            </p>
          )}
        </section>
      )}
      <div className="home-grid" style={{ marginTop: 20 }}>
        {has("followups.view") && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  {sales ? "المتابعات الأقرب" : "المتابعات التي تحتاج مراجعة"}
                </h2>
                <p>
                  {sales
                    ? "المتأخر أولًا، وبعده أقرب موعد"
                    : "الموظف المسؤول وموعد كل متابعة"}
                </p>
              </div>
            </div>
            {tasks.slice(0, 5).map((f) => (
              <div className="task-row" key={f.id}>
                <div className="task-copy">
                  <h3>{f.leadName}</h3>
                  <p>{f.reason}</p>
                  <p>
                    {f.scheduledAt.replace("T", " ")} ·{" "}
                    {f.assignedAgentName || "مسؤول غير محدد"}
                  </p>
                </div>
                <span
                  className={`status-pill ${followUpStatus(f) === "overdue" ? "is-new" : ""}`}
                >
                  {followUpStatus(f) === "overdue"
                    ? "متأخرة"
                    : followUpStatus(f) === "due"
                      ? "اليوم"
                      : "قادمة"}
                </span>
                {has("customers.view") && (
                  <button
                    className="table-link"
                    onClick={() => onOpenLead(f.leadId)}
                  >
                    عرض الملف
                    <ArrowUpLeft size={16} />
                  </button>
                )}
              </div>
            ))}
            {!tasks.length && (
              <p className="empty-state">لا توجد متابعات معلّقة في نطاقك.</p>
            )}
          </section>
        )}
        {has("bookings.view") && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>قيمة التعاقدات حسب القسم</h2>
                <p>كل الفترات · بدون التعاقدات الملغاة</p>
              </div>
            </div>
            <div className="department-list">
              {Object.entries(departmentNames).map(([id, label]) => {
                const amount = active
                  .filter((b) => b.department === id)
                  .reduce((s, b) => s + b.amount, 0);
                return (
                  <div className="department-row" key={id}>
                    <div>
                      <span>{label}</span>
                      <strong>{formatMoney(amount)} ج.م</strong>
                    </div>
                    <div className="department-bar">
                      <i
                        style={{
                          width: `${total ? (amount / total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
      {!sales && has("staff.view") && (
        <section className="panel" style={{ marginTop: 20 }}>
          <div className="panel-header">
            <div>
              <h2>الالتزام بالمتابعة حسب الموظف</h2>
              <p>الأعداد المسجلة داخل نطاقك، مع استبعاد المتابعات الملغاة.</p>
            </div>
            <button className="btn-text" onClick={() => setActiveTab("users")}>
              دليل الموظفين
            </button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>الفرع</th>
                  <th>مكتملة</th>
                  <th>متأخرة</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(
                    (s) =>
                      s.active &&
                      followUps.some((f) => f.assignedAgentId === s.id),
                  )
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.branchName}</td>
                      <td>
                        {
                          followUps.filter(
                            (f) =>
                              f.assignedAgentId === s.id &&
                              f.status === "completed",
                          ).length
                        }
                      </td>
                      <td>
                        {
                          overdue.filter((f) => f.assignedAgentId === s.id)
                            .length
                        }
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!has("followups.view") && (
            <p className="quiet-note">
              بيانات المتابعات غير متاحة لهذا الاختصاص.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
