import { useMemo, useState } from "react";
import { useCRM } from "../context/CRMContext";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { averageRating, complaintState, isComplaint, reviewPhase } from "../lib/reviews";

type Tab = "complaints" | "all" | "waiting";

/** Customer reviews and complaints inside the viewer's scope. */
export function FeedbackPage({ onOpenLead }: { onOpenLead: (id: string) => void }) {
  const { reviewRequests, reviewNotes, effectiveUser } = useCRM();
  const [tab, setTab] = useState<Tab>("complaints");
  const manager = ["admin", "general_manager", "regional_manager", "branch_manager"].includes(effectiveUser.role);

  const data = useMemo(() => {
    const sorted = [...reviewRequests].sort((a, b) => (b.answeredAt || b.sentAt).localeCompare(a.answeredAt || a.sentAt));
    const complaints = sorted.filter(isComplaint);
    const open = complaints.filter((r) => complaintState(r, reviewNotes) !== "resolved");
    const waiting = sorted.filter((r) => r.status === "sent");
    const answered = sorted.filter((r) => r.status === "answered");
    return { sorted, complaints, open, waiting, answered, avg: averageRating(sorted) };
  }, [reviewRequests, reviewNotes]);

  const dueReminders = data.waiting.filter((r) => reviewPhase(r) === "reminder_due").length;
  const list = tab === "complaints" ? data.complaints : tab === "waiting" ? data.waiting : data.sorted;
  const rate = reviewRequests.length ? Math.round((data.answered.length / reviewRequests.filter((r) => r.status !== "cancelled").length || 0) * 100) : 0;

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">صوت العميل</span>
          <h1>التقييمات والشكاوى</h1>
          <p>
            {manager
              ? "الشكاوى بتوصل هنا فور ما العميل يبعتها. تقدر تضيف متابعة عليها بس، من غير تعديل أو حذف."
              : "تقييمات عملائك وطلبات التقييم اللي لسه مستنية رد."}
          </p>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: 16 }}>
        <div className="metric">
          <span className="metric-top">متوسط التقييم</span>
          <strong className="metric-value">{data.avg === null ? "—" : data.avg.toFixed(1)}</strong>
          <span className="metric-note">من {data.answered.length} تقييم</span>
        </div>
        <div className="metric">
          <span className="metric-top">شكاوى مفتوحة</span>
          <strong className="metric-value" style={data.open.length ? { color: "#c8232b" } : undefined}>
            {data.open.length}
          </strong>
          <span className="metric-note">من إجمالي {data.complaints.length}</span>
        </div>
        <div className="metric">
          <span className="metric-top">مستنية رد العميل</span>
          <strong className="metric-value">{data.waiting.length}</strong>
          <span className="metric-note">{dueReminders ? `${dueReminders} محتاجة تذكير` : "مفيش تذكير مطلوب"}</span>
        </div>
        <div className="metric">
          <span className="metric-top">نسبة الرد</span>
          <strong className="metric-value">{Number.isFinite(rate) ? rate : 0}%</strong>
          <span className="metric-note">من الطلبات المبعوتة</span>
        </div>
      </div>

      <section className="panel">
        <div className="tab-filter" role="group" aria-label="تصفية التقييمات" style={{ marginBottom: 12 }}>
          {(
            [
              ["complaints", `الشكاوى (${data.complaints.length})`],
              ["all", `كل الطلبات (${data.sorted.length})`],
              ["waiting", `مستنية رد (${data.waiting.length})`],
            ] as const
          ).map(([id, label]) => (
            <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="empty-state">
            <h3>{tab === "complaints" ? "مفيش شكاوى. كويس!" : "لسه مفيش حاجة هنا"}</h3>
            <p>الموظف بيطلب التقييم من ملف العميل بزر «طلب تقييم»، والرد بيظهر هنا تلقائيًا.</p>
          </div>
        ) : (
          <div className="review-list">
            {list.map((r) => (
              <ReviewCard key={r.id} request={r} showCustomer onOpenLead={onOpenLead} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
