import { useCRM } from "../context/CRMContext";
import { hasPermission } from "../lib/permissions";
import { isSales, scopeLabel } from "../lib/access";
import { followUpStatus, formatMoney, sourceNames } from "../lib/presentation";
export function ReportsPage() {
  const {
    effectiveUser: u,
    leads,
    bookings,
    followUps,
    purchaseInvoices,
    branches,
  } = useCRM();
  const has = (p: Parameters<typeof hasPermission>[1]) => hasPermission(u, p);
  const contracts = bookings.filter((b) => b.bookingStatus !== "cancelled");
  const converted = new Set(
    contracts
      .filter((b) => leads.some((l) => l.id === b.leadId))
      .map((b) => b.leadId),
  ).size;
  const metrics = [
    {
      allowed: has("customers.view"),
      name: "العملاء",
      value: leads.length,
      note: "داخل نطاق العمل",
    },
    {
      allowed: has("customers.view") && has("bookings.view"),
      name: "عملاء لديهم تعاقد",
      value: leads.length
        ? `${Math.round((converted / leads.length) * 100)}%`
        : "—",
      note: `${converted} عميل من أصل ${leads.length}`,
    },
    {
      allowed: has("bookings.view"),
      name: "قيمة التعاقدات",
      value: `${formatMoney(contracts.reduce((s, b) => s + b.amount, 0))} ج.م`,
      note: "باستبعاد الملغى · ليست قيمة التحصيل",
    },
    {
      allowed: has("followups.view"),
      name: "المتابعات المكتملة",
      value: followUps.filter((f) => f.status === "completed").length,
      note: `من أصل ${followUps.filter((f) => f.status !== "cancelled").length} متابعة غير ملغاة`,
    },
    {
      allowed: has("invoices.view"),
      name: "فواتير في انتظار السداد",
      value: purchaseInvoices.filter((i) =>
        ["draft", "partial"].includes(i.status),
      ).length,
      note: "مسودات ومدفوعة جزئيًا",
    },
  ];
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">الأرقام في سياقها</span>
          <h1>{isSales(u) ? "أدائي" : "تقارير نطاق العمل"}</h1>
          <p>{scopeLabel(u)} · جميع الفترات · المؤشرات المتاحة لصلاحياتك</p>
        </div>
      </div>
      <div className="metric-grid">
        {metrics
          .filter((m) => m.allowed)
          .map((m) => (
            <div className="metric" key={m.name}>
              <span className="metric-top">{m.name}</span>
              <strong className="metric-value">{m.value}</strong>
              <span className="metric-note">{m.note}</span>
            </div>
          ))}
      </div>
      <div className="home-grid">
        {has("customers.view") && (
          <section className="panel">
            <div className="panel-header">
              <h2>العملاء حسب المصدر</h2>
            </div>
            <div className="department-list">
              {Object.entries(sourceNames)
                .map(([id, label]) => ({
                  id,
                  label,
                  count: leads.filter((l) => l.source === id).length,
                }))
                .filter((s) => s.count)
                .map((s) => (
                  <div className="department-row" key={s.id}>
                    <div>
                      <span>{s.label}</span>
                      <strong>{s.count} عميل</strong>
                    </div>
                    <div className="department-bar">
                      <i
                        style={{ width: `${(s.count / leads.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
        {has("bookings.view") && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>حالة الدفع في التعاقدات</h2>
                <p>عدد التعاقدات، وليس المبالغ المحصلة</p>
              </div>
            </div>
            <div className="department-list">
              {Object.entries({
                full: "مدفوع بالكامل",
                deposit: "تم استلام مقدم",
                pending: "في انتظار الدفع",
                refunded: "مسترد",
              }).map(([id, label]) => (
                <div className="department-row" key={id}>
                  <div>
                    <span>{label}</span>
                    <strong>
                      {contracts.filter((b) => b.paymentStatus === id).length}{" "}
                      تعاقد
                    </strong>
                  </div>
                </div>
              ))}
            </div>
            <p className="quiet-note">
              حساب المحصل والمتبقي بدقة يحتاج تسجيل مبالغ الدفعات، وهي غير متاحة
              في البيانات الحالية.
            </p>
          </section>
        )}
      </div>
      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <h2>{isSales(u) ? "سجلاتي حسب الفرع" : "مؤشرات الفروع المتاحة"}</h2>
            <p>
              {isSales(u)
                ? "يعرض سجلاتك وتكليفاتك فقط."
                : "داخل حدود نطاق عملك."}
            </p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>الفرع</th>
                {has("customers.view") && <th>العملاء</th>}
                {has("bookings.view") && <th>قيمة التعاقدات</th>}
                {has("followups.view") && <th>المتابعات المتأخرة</th>}
                {has("invoices.view") && <th>الفواتير</th>}
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  {has("customers.view") && (
                    <td>{leads.filter((l) => l.branchId === b.id).length}</td>
                  )}
                  {has("bookings.view") && (
                    <td>
                      {formatMoney(
                        contracts
                          .filter((c) => c.branchId === b.id)
                          .reduce((s, c) => s + c.amount, 0),
                      )}{" "}
                      ج.م
                    </td>
                  )}
                  {has("followups.view") && (
                    <td>
                      {
                        followUps.filter(
                          (f) =>
                            f.branchId === b.id &&
                            followUpStatus(f) === "overdue",
                        ).length
                      }
                    </td>
                  )}
                  {has("invoices.view") && (
                    <td>
                      {
                        purchaseInvoices.filter((i) => i.branchId === b.id)
                          .length
                      }
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
