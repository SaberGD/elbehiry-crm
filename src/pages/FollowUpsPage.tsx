import { canCompleteFollowUp, canAccessPage, isSales } from "../lib/access";
import { hasPermission } from "../lib/permissions";
import { useState } from "react";
import {
  Phone,
  MessageCircle,
  CalendarDays,
  ArrowUpLeft,
  Check,
  X,
  Clock3,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { followUpStatus, phoneNumber } from "../lib/presentation";
import type { FollowUp } from "../types/crm";
import { useDialog } from "../components/common/useDialog";
interface Props {
  onOpenLead: (id: string) => void;
  initialTab?: "due" | "overdue";
}
export function FollowUpsPage({ onOpenLead, initialTab = "due" }: Props) {
  const { effectiveUser, leads, branches, followUps, updateFollowUpResult } =
    useCRM();
  const [tab, setTab] = useState<string>(initialTab);
  const [selected, setSelected] = useState<FollowUp | null>(null);
  const [result, setResult] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const visible = followUps;
  const list = visible
    .filter((f) => followUpStatus(f) === tab)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const labels: Record<string, string> = {
    due: "اليوم",
    overdue: "المتأخرة",
    upcoming: "القادمة",
    completed: "المكتملة",
    cancelled: "الملغاة",
  };
  const ref = useDialog(!!selected, () => setSelected(null));
  const complete = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selected ||
      !canCompleteFollowUp(effectiveUser, selected) ||
      !result.trim() ||
      (hasNext && !nextDate)
    )
      return;
    updateFollowUpResult(
      selected.id,
      "completed",
      result.trim(),
      hasNext ? nextDate : undefined,
    );
    setSelected(null);
    setResult("");
    setNextDate("");
    setHasNext(false);
  };
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">كل تواصل له خطوة جاية</span>
          <h1>المتابعات</h1>
          <p>
            {isSales(effectiveUser)
              ? "ابدأ بالمستحق وسجّل نتيجة التواصل."
              : "راجع التأخير والموظف المسؤول عن كل متابعة داخل نطاقك."}
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="tab-filter" role="group" aria-label="تصفية المتابعات">
          {Object.entries(labels).map(([id, label]) => (
            <button
              key={id}
              aria-pressed={id === tab}
              onClick={() => setTab(id)}
            >
              {label}{" "}
              <span style={{ opacity: 0.65, marginInlineStart: 5 }}>
                {visible.filter((f) => followUpStatus(f) === id).length}
              </span>
            </button>
          ))}
        </div>
        {list.length ? (
          list.map((f) => (
            <article className="followup-card" key={f.id}>
              <div className="followup-heading">
                {canAccessPage(effectiveUser, "clients") && (
                  <button onClick={() => onOpenLead(f.leadId)}>
                    <h2>{f.leadName}</h2>
                  </button>
                )}
                <span
                  className={`status-pill ${tab === "overdue" ? "is-new" : tab === "completed" ? "is-success" : tab === "due" ? "is-warning" : ""}`}
                >
                  {labels[tab]}
                </span>
              </div>
              <p>{f.reason}</p>
              <div className="followup-meta">
                <span>
                  <CalendarDays size={14} />
                  {f.scheduledAt.replace("T", " ").slice(0, 16)}
                </span>
                <span>{f.assignedAgentName}</span>
                <span dir="ltr">{f.leadPhone}</span>
              </div>
              {f.outcomeResult && <p>النتيجة: {f.outcomeResult}</p>}
              <div className="followup-actions">
                {canCompleteFollowUp(effectiveUser, f) &&
                  !["completed", "cancelled"].includes(tab) && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelected(f);
                        setResult("");
                        setHasNext(false);
                        setNextDate("");
                      }}
                    >
                      <Check size={15} />
                      تسجيل النتيجة
                    </button>
                  )}
                {canAccessPage(effectiveUser, "clients") && (
                  <button
                    className="btn-secondary"
                    onClick={() => onOpenLead(f.leadId)}
                  >
                    ملف العميل
                    <ArrowUpLeft size={14} />
                  </button>
                )}
                {f.assignedAgentId === effectiveUser.id &&
                  hasPermission(effectiveUser, "customers.contact") && (
                    <a
                      className="btn-secondary"
                      href={`tel:${phoneNumber(f.leadPhone)}`}
                    >
                      <Phone size={14} />
                      اتصال
                    </a>
                  )}
                {f.assignedAgentId === effectiveUser.id &&
                  hasPermission(effectiveUser, "customers.contact") && (
                    <a
                      className="btn-secondary"
                      href={`https://wa.me/${phoneNumber(leads.find((l) => l.id === f.leadId)?.whatsappPhone || f.leadPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={14} />
                      واتساب
                    </a>
                  )}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <Clock3 size={28} strokeWidth={1.3} />
            <h3>
              {tab === "due"
                ? "مفيش متابعات مستحقة اليوم"
                : tab === "overdue"
                  ? "مفيش متابعات متأخرة"
                  : "مفيش متابعات في القائمة دي"}
            </h3>
            <p>المتابعات المتاحة حسب صلاحياتك تظهر هنا.</p>
          </div>
        )}
      </section>
      {selected && (
        <div className="dialog-backdrop">
          <div
            className="panel"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="followup-result-title"
            style={{ width: "min(490px,100%)", padding: 27 }}
          >
            <div className="page-heading">
              <div>
                <h2
                  id="followup-result-title"
                  style={{ fontSize: 20, fontWeight: 600 }}
                >
                  نتيجة التواصل
                </h2>
                <p>{selected.leadName}</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="إغلاق تسجيل النتيجة"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={complete}>
              <label className="field">
                <span>
                  إيه اللي حصل؟ <em>مطلوب</em>
                </span>
                <textarea
                  rows={3}
                  required
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="مثلاً: العميل طلب عرض سعر وهيرد يوم الأحد."
                />
              </label>
              <label className="checkbox-line" style={{ marginBlock: 20 }}>
                <input
                  type="checkbox"
                  checked={hasNext}
                  onChange={(e) => setHasNext(e.target.checked)}
                />
                تحديد متابعة تانية <em className="optional-tag">اختياري</em>
              </label>
              {hasNext && (
                <label className="field">
                  <span>الموعد القادم</span>
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </label>
              )}
              <button
                className="btn-primary"
                type="submit"
                style={{ marginTop: 22 }}
              >
                حفظ النتيجة
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
