import { canAccessPage } from "../lib/access";
import { hasPermission } from "../lib/permissions";
import { useState } from "react";
import { ArrowUpLeft, ShoppingBag, PackageCheck, X } from "lucide-react";
import { FilterBar, inDateRange } from "../components/common/FilterBar";
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
  const [fBranch, setFBranch] = useState("all");
  const [fAgent, setFAgent] = useState("all");
  const [fState, setFState] = useState("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const resetFilters = () => {
    setQuery("");
    setDept("all");
    setFBranch("all");
    setFAgent("all");
    setFState("all");
    setFFrom("");
    setFTo("");
  };
  const visible = bookings;
  const rows = visible.filter(
    (b) =>
      (dept === "all" ||
        bookingSplit(b)[dept as keyof ReturnType<typeof bookingSplit>] > 0) &&
      (fBranch === "all" || b.branchId === fBranch) &&
      (fAgent === "all" || b.agentId === fAgent) &&
      (fState === "all" ||
        (fState === "cancelled" ? b.bookingStatus === "cancelled" : b.bookingStatus !== "cancelled" && (fState === "delivered" ? !!b.deliveredAt : !b.deliveredAt))) &&
      inDateRange(b.bookingDate, fFrom, fTo) &&
      [b.leadName, b.leadPhone, b.courseName].some((v) =>
        (v || "").includes(query.trim()),
      ),
  );
  // The totals follow the filters, so what you see always adds up.
  const active = rows.filter((b) => b.bookingStatus !== "cancelled");
  const uniq = (list: string[]) => [...new Set(list.filter(Boolean))];
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
        <FilterBar
          search={{ value: query, onChange: setQuery, placeholder: "اسم العميل أو رقم الهاتف أو الخدمة…" }}
          selects={[
            { id: "dept", label: "القسم", value: dept, onChange: setDept, allLabel: "كل الأقسام", primary: true, options: departmentIds.map((id) => ({ value: id, label: departmentNames[id] })) },
            { id: "state", label: "حالة التعاقد", value: fState, onChange: setFState, allLabel: "كل الحالات", primary: true, options: [{ value: "pending", label: "لسه ما اتسلّمش" }, { value: "delivered", label: "تم التسليم" }, { value: "cancelled", label: "ملغي" }] },
            { id: "branch", label: "الفرع", value: fBranch, onChange: setFBranch, allLabel: "كل الفروع", options: uniq(visible.map((b) => b.branchId)).map((id) => ({ value: id, label: visible.find((b) => b.branchId === id)?.branchName || branches.find((x) => x.id === id)?.name || id })) },
            { id: "agent", label: "الموظف", value: fAgent, onChange: setFAgent, allLabel: "كل الموظفين", options: uniq(visible.map((b) => b.agentId)).map((id) => ({ value: id, label: visible.find((b) => b.agentId === id)?.agentName || id })) },
          ]}
          dates={{ from: fFrom, to: fTo, onFrom: setFFrom, onTo: setFTo, label: "تاريخ التعاقد" }}
          count={{ shown: rows.length, noun: "تعاقد" }}
          onReset={resetFilters}
        />
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
