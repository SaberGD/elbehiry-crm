import { canAccessPage } from "../lib/access";
import { useState } from "react";
import { Search, ArrowUpLeft, ShoppingBag } from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { formatMoney } from "../lib/presentation";
interface Props {
  onOpenLead: (id: string) => void;
}
export function BookingsPage({ onOpenLead }: Props) {
  const { effectiveUser, bookings, branches, leads } = useCRM();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const visible = bookings;
  const active = visible.filter((b) => b.bookingStatus !== "cancelled");
  const rows = visible.filter(
    (b) =>
      (status === "all" || b.paymentStatus === status) &&
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
          <p>قيمة الاتفاق وحالة الدفع لكل عميل داخل نطاق عملك.</p>
        </div>
      </div>
      <div
        className="metric-grid"
        style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}
      >
        <div className="metric">
          <span className="metric-top">التعاقدات غير الملغاة</span>
          <strong className="metric-value">{active.length}</strong>
        </div>
        <div className="metric">
          <span className="metric-top">إجمالي قيمة التعاقدات</span>
          <strong className="metric-value">
            {formatMoney(active.reduce((s, b) => s + b.amount, 0))}
            <small>ج.م</small>
          </strong>
          <span className="metric-note">
            قيمة الاتفاقات، وتشمل المبالغ غير المحصلة
          </span>
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
            aria-label="حالة الدفع"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">كل حالات الدفع</option>
            <option value="pending">لم يتم الدفع</option>
            <option value="deposit">تم استلام مقدم</option>
            <option value="full">مدفوع بالكامل</option>
            <option value="refunded">مسترد</option>
          </select>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العميل والخدمة</th>
                  <th>قيمة التعاقد</th>
                  <th>حالة الدفع</th>
                  <th>التاريخ</th>
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
                      <span
                        className={`status-pill ${b.bookingStatus === "cancelled" ? "is-new" : b.paymentStatus === "full" ? "is-success" : "is-warning"}`}
                      >
                        {b.bookingStatus === "cancelled"
                          ? "ملغى"
                          : {
                              full: "مدفوع بالكامل",
                              deposit: "تم استلام مقدم",
                              pending: "لم يتم الدفع",
                              refunded: "مسترد",
                            }[b.paymentStatus]}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{b.bookingDate}</td>
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
    </div>
  );
}
