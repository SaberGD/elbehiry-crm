import { canAccessPage } from "../lib/access";
import { hasPermission } from "../lib/permissions";
import { useState } from "react";
import { Search, ArrowUpLeft, ShoppingBag, PackageCheck, X } from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { formatMoney, today, departmentNames } from "../lib/presentation";
import { departmentIds, bookingSplit } from "../lib/purchases";
import { useDialog } from "../components/common/useDialog";
import type { Booking } from "../types/crm";
interface Props {
  onOpenLead: (id: string) => void;
}
export function BookingsPage({ onOpenLead }: Props) {
  const { effectiveUser, bookings, branches, leads, followUps, completeBooking } =
    useCRM();
  const canDeliver = hasPermission(effectiveUser, "bookings.create");
  const [delivering, setDelivering] = useState<Booking | null>(null);
  const [deliveredAt, setDeliveredAt] = useState(today());
  const dialogRef = useDialog(!!delivering, () => setDelivering(null));
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const visible = bookings;
  const active = visible.filter((b) => b.bookingStatus !== "cancelled");
  const rows = visible.filter(
    (b) =>
      (dept === "all" ||
        bookingSplit(b)[dept as keyof ReturnType<typeof bookingSplit>] > 0) &&
      [b.leadName, b.leadPhone, b.courseName].some((v) =>
        v.includes(query.trim()),
      ),
  );
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">من الاهتمام للتعاقد</span>
          <h1>الحجوزات والتعاقدات</h1>
          <p>اشترى كام، ومتوزع إزاي على الأقسام الأربعة، لكل عميل داخل نطاقك.</p>
        </div>
      </div>
      <div
        className="metric-grid"
        style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}
      >
        <div className="metric">
          <span className="metric-top">عمليات الشراء غير الملغاة</span>
          <strong className="metric-value">{active.length}</strong>
        </div>
        <div className="metric">
          <span className="metric-top">إجمالي المشتريات</span>
          <strong className="metric-value">
            {formatMoney(active.reduce((s, b) => s + b.amount, 0))}
            <small>ج.م</small>
          </strong>
          <span className="metric-note">قيمة المشتريات الكلية لكل الأقسام</span>
        </div>
      </div>
      <section className="panel">
        <div className="filter-toolbar">
          <label className="directory-search">
            <Search size={17} />
            <input
              aria-label="البحث في التعاقدات"
              placeholder="اسم العميل أو رقم الهاتف أو الخدمة…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="القسم"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="all">كل الأقسام</option>
            {departmentIds.map((id) => (
              <option key={id} value={id}>
                {departmentNames[id]}
              </option>
            ))}
          </select>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العميل والخدمة</th>
                  <th>إجمالي المشتريات</th>
                  <th>التوزيع على الأقسام</th>
                  <th>التاريخ</th>
                  <th>التسليم وما بعد البيع</th>
                  <th>الملف</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td>
                      {canAccessPage(effectiveUser, "clients") && (
                        <button
                          className="customer-name"
                          onClick={() => onOpenLead(b.leadId)}
                        >
                          {b.leadName}
                        </button>
                      )}
                      <span className="table-secondary">{b.courseName}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatMoney(b.amount)} ج.م
                    </td>
                    <td>
                      {b.bookingStatus === "cancelled" ? (
                        <span className="status-pill is-new">ملغى</span>
                      ) : (
                        departmentIds
                          .filter((id) => bookingSplit(b)[id] > 0)
                          .map((id) => (
                            <span className="table-secondary" key={id}>
                              {departmentNames[id]}:{" "}
                              {formatMoney(bookingSplit(b)[id])} ج.م
                            </span>
                          ))
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{b.bookingDate}</td>
                    <td>
                      {(() => {
                        if (b.bookingStatus === "cancelled") return "—";
                        const post = followUps.filter(
                          (f) =>
                            f.bookingId === b.id && f.category === "post_sale",
                        );
                        if (post.length) {
                          const done = post.filter(
                            (f) => f.status === "completed",
                          ).length;
                          return (
                            <>
                              <span className="status-pill is-success">
                                تم التسليم {b.deliveredAt ?? ""}
                              </span>
                              <span className="table-secondary">
                                متابعات بعد البيع: {done}/{post.length}
                              </span>
                            </>
                          );
                        }
                        return canDeliver ? (
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setDelivering(b);
                              setDeliveredAt(today());
                            }}
                          >
                            <PackageCheck size={14} />
                            تم التسليم
                          </button>
                        ) : (
                          "—"
                        );
                      })()}
                    </td>
                    <td>
                      {canAccessPage(effectiveUser, "clients") && (
                        <button
                          className="table-link"
                          onClick={() => onOpenLead(b.leadId)}
                          aria-label={`فتح ملف ${b.leadName}`}
                        >
                          <ArrowUpLeft size={17} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ShoppingBag size={28} />
            <h3>مفيش تعاقدات مطابقة</h3>
            <p>التعاقدات الجديدة هتظهر هنا بعد تسجيلها من ملف العميل.</p>
          </div>
        )}
      </section>
      {delivering && (
        <div className="dialog-backdrop">
          <div
            className="panel"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deliver-title"
            style={{ width: "min(470px,100%)", padding: 27 }}
          >
            <div className="page-heading">
              <div>
                <h2 id="deliver-title" style={{ fontSize: 20, fontWeight: 600 }}>
                  تسليم الشغل
                </h2>
                <p>
                  {delivering.leadName} · {delivering.courseName}
                </p>
              </div>
              <button
                className="icon-button"
                onClick={() => setDelivering(null)}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                completeBooking(delivering.id, deliveredAt);
                setDelivering(null);
              }}
            >
              <label className="field">
                <span>
                  تاريخ التسليم <em>مطلوب</em>
                </span>
                <input
                  type="date"
                  required
                  value={deliveredAt}
                  max={today()}
                  onChange={(e) => setDeliveredAt(e.target.value)}
                />
              </label>
              <p className="table-secondary" style={{ marginTop: 14 }}>
                هتتجدول 4 متابعات للموظف المسؤول: بعد أسبوع، بعد شهر، بعد 6
                شهور، وبعد سنة من التسليم. كل متابعة فيها تقييم رضا العميل
                وسؤال عن معارفه.
              </p>
              <button
                className="btn-primary"
                type="submit"
                style={{ marginTop: 20 }}
              >
                تأكيد التسليم وجدولة المتابعات
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
