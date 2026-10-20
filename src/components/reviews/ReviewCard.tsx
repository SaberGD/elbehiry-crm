import { useState } from "react";
import { MessageCircle, Send, XCircle } from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import type { ReviewRequest } from "../../types/crm";
import {
  complaintState,
  complaintStateLabel,
  isComplaint,
  reminderMessage,
  reviewLink,
  reviewPhase,
  requestMessage,
  whatsappUrl,
  type ReviewPhase,
} from "../../lib/reviews";

const phaseLabel: Record<ReviewPhase, string> = {
  waiting: "مستني رد العميل",
  reminder_due: "محتاج تذكير",
  reminder_sent: "اتبعت تذكير",
  expired: "انتهى بدون رد",
  answered: "وصل تقييم",
  cancelled: "اتلغى",
};

const when = (iso: string) => new Date(iso).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const Stars = ({ n }: { n: number }) => (
  <span aria-label={`${n} من 5`} style={{ color: "#f5a623", letterSpacing: 2, direction: "ltr", display: "inline-block" }}>
    {"★".repeat(n)}
    <span style={{ color: "var(--line)" }}>{"★".repeat(5 - n)}</span>
  </span>
);

const severityLabel = { low: "بسيطة", medium: "متوسطة", high: "عاجلة" } as const;

/** One review request: its progress, the customer's answer, and what the staff can do about it. */
export function ReviewCard({ request: r, showCustomer = false, onOpenLead }: { request: ReviewRequest; showCustomer?: boolean; onOpenLead?: (id: string) => void }) {
  const { effectiveUser, leads, reviewNotes, markReviewReminderSent, cancelReviewRequest, addReviewNote } = useCRM();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const lead = leads.find((l) => l.id === r.leadId);
  const phase = reviewPhase(r);
  const complaint = isComplaint(r);
  const notes = reviewNotes.filter((n) => n.requestId === r.id).sort((a, b) => a.at.localeCompare(b.at));
  const state = complaintState(r, reviewNotes);
  const canNote = complaint && ["admin", "general_manager", "regional_manager", "branch_manager"].includes(effectiveUser.role);
  const phone = lead?.whatsappPhone || lead?.phone || "";
  const link = reviewLink(r.id);
  const pending = r.status === "sent";
  const resp = r.response;

  const open = (text: string) => window.open(whatsappUrl(phone, text), "_blank", "noopener");
  const addNote = (kind: "note" | "resolved") => {
    if (!note.trim()) return;
    addReviewNote(r.id, note, kind);
    setNote("");
  };

  return (
    <article className={`review-card${complaint && state !== "resolved" ? " is-complaint" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span className="status-pill">{phaseLabel[phase]}</span>
        {complaint && (
          <span className="status-pill" style={{ background: state === "resolved" ? "#e4f4e9" : "#fbeceb", color: state === "resolved" ? "#1b6b3a" : "#a51a21" }}>
            شكوى · {complaintStateLabel[state]}
          </span>
        )}
      </div>
      <h3 className="review-title">
        {showCustomer && (
          <button className="btn-text" style={{ padding: 0, fontWeight: 700 }} onClick={() => onOpenLead?.(r.leadId)}>
            {r.leadName}
          </button>
        )}
        {showCustomer && " · "}
        {r.subjectLabel}
      </h3>
      <p className="table-secondary">
        اتبعت {when(r.sentAt)} · {r.agentName || "—"}
        {r.reminderSentAt && ` · تذكير ${when(r.reminderSentAt)}`}
      </p>

      {r.status === "answered" && resp && (
        <div style={{ marginTop: 10 }}>
          <p>
            <Stars n={resp.rating} /> <strong>{resp.rating}/5</strong>
            {r.answeredAt && <span className="table-secondary"> · {when(r.answeredAt)}</span>}
          </p>
          <p className="table-secondary">
            {[
              resp.treatment ? `المعاملة ${resp.treatment}/5` : "",
              resp.price ? `السعر ${resp.price}/5` : "",
              resp.quality ? `الجودة ${resp.quality}/5` : "",
              resp.wouldRecommend === true ? "هيرشحنا" : resp.wouldRecommend === false ? "مش متأكد إنه يرشحنا" : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {resp.comment && (
            <blockquote style={{ margin: "8px 0", padding: "10px 12px", background: "var(--surface-soft)", borderInlineStart: "3px solid #c8232b", borderRadius: 8 }}>
              {resp.comment}
            </blockquote>
          )}
          {r.ai && (r.ai.category || r.ai.summary) && (
            <p className="table-secondary">
              تحليل ذكي: {r.ai.category && <strong>{r.ai.category}</strong>}
              {r.ai.severity && ` · أولوية ${severityLabel[r.ai.severity]}`}
              {r.ai.summary && ` · ${r.ai.summary}`}
            </p>
          )}
        </div>
      )}

      {r.status === "cancelled" && <p className="table-secondary">السبب: {r.cancelReason}</p>}

      {complaint && notes.length > 0 && (
        <ol style={{ margin: "10px 0 0", paddingInlineStart: 18, fontSize: 13 }}>
          {notes.map((n) => (
            <li key={n.id}>
              {n.kind === "resolved" && <strong>تمت المعالجة: </strong>}
              {n.text} <span className="table-secondary">— {n.byName}، {when(n.at)}</span>
            </li>
          ))}
        </ol>
      )}
      {canNote && state !== "resolved" && (
        <div style={{ marginTop: 10 }}>
          <textarea
            rows={2}
            className="review-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب متابعتك للشكوى (اتصلت بالعميل، وعدته بكذا…)"
          />
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <button className="btn-primary" disabled={!note.trim()} onClick={() => addNote("note")}>
              إضافة متابعة
            </button>
            <button className="btn-secondary" disabled={!note.trim()} onClick={() => addNote("resolved")}>
              تمت المعالجة
            </button>
          </div>
        </div>
      )}

      {pending && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {phase === "reminder_due" && (
            <button
              className="btn-primary"
              onClick={() => {
                open(reminderMessage({ name: r.leadName }, link));
                markReviewReminderSent(r.id);
              }}
            >
              <Send size={14} /> ابعت التذكير على واتساب
            </button>
          )}
          {(phase === "waiting" || phase === "reminder_sent") && (
            <button className="btn-secondary" onClick={() => open(requestMessage({ name: r.leadName }, r.subjectLabel, link))}>
              <MessageCircle size={14} /> فتح واتساب تاني
            </button>
          )}
          <button className="btn-text" onClick={() => setCancelling((v) => !v)}>
            <XCircle size={14} /> {phase === "expired" ? "قفل الطلب" : "إلغاء الطلب"}
          </button>
        </div>
      )}
      {pending && cancelling && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <input className="review-input" style={{ flex: 1, minWidth: 180 }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الإلغاء (العميل مش مهتم، رفض…)" />
          <button
            className="btn-secondary"
            disabled={!reason.trim()}
            onClick={() => {
              cancelReviewRequest(r.id, reason);
              setCancelling(false);
            }}
          >
            تأكيد الإلغاء
          </button>
        </div>
      )}
    </article>
  );
}
