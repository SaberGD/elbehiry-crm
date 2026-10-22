import { CustomerBrief } from "../components/common/CustomerBrief";
import { REFERRAL_MIN_STARS, isReferralPhone } from "../lib/referrals";
import { canCompleteFollowUp, canAccessPage, isSales, worksOwnCustomers } from "../lib/access";
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
  Star,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { useLanguage } from "../context/LanguageContext";
import { followUpStatus, phoneNumber } from "../lib/presentation";
import type { FollowUp } from "../types/crm";
import { useDialog } from "../components/common/useDialog";
import { milestoneLabel } from "../lib/postSale";
import { FilterBar, inDateRange } from "../components/common/FilterBar";
import { ReviewCard } from "../components/reviews/ReviewCard";
import { reviewPhase } from "../lib/reviews";
import { lastOutcome } from "../lib/purchases";
import { VoiceNoteField } from "../components/common/VoiceNoteField";
import type { LeadQuickAction } from "../components/common/LeadDetailsModal";
interface Props {
  onOpenLead: (id: string, action?: LeadQuickAction) => void;
  initialTab?: "due" | "overdue";
}
export function FollowUpsPage({ onOpenLead, initialTab = "due" }: Props) {
  const { effectiveUser, leads, branches, followUps, updateFollowUpResult, reviewRequests, addReferralLead, bookings, notBoughtRecords } =
    useCRM();
  const { tr, language } = useLanguage();
  const en = language === "en";
  // The one 48-hour nudge for review requests the customer has not answered.
  const dueReviews = reviewRequests.filter((r) => reviewPhase(r) === "reminder_due");
  const [tab, setTab] = useState<string>(initialTab);
  const [selected, setSelected] = useState<FollowUp | null>(null);
  const [result, setResult] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [hasNext, setHasNext] = useState(false);
  const [kind, setKind] = useState<"all" | "sales" | "post_sale">("all");
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [referralNote, setReferralNote] = useState("");
  const [referralName, setReferralName] = useState("");
  const [referralPhone, setReferralPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [q, setQ] = useState("");
  const [fBranch, setFBranch] = useState("all");
  const [fAgent, setFAgent] = useState("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const isPostSale = (f: FollowUp) => f.category === "post_sale";
  const visible = followUps.filter(
    (f) =>
      (kind === "all" || (kind === "post_sale" ? isPostSale(f) : !isPostSale(f))) &&
      (!q.trim() || f.leadName.includes(q.trim()) || (f.leadPhone || "").includes(q.trim()) || (f.reason || "").includes(q.trim())) &&
      (fBranch === "all" || f.branchId === fBranch) &&
      (fAgent === "all" || f.assignedAgentId === fAgent) &&
      inDateRange(f.scheduledAt, fFrom, fTo),
  );
  const uniq = (l: string[]) => [...new Set(l.filter(Boolean))];
  const rated = followUps.filter(
    (f) => isPostSale(f) && f.status === "completed" && f.satisfactionRating,
  );
  const avgRating = rated.length
    ? rated.reduce((s, f) => s + (f.satisfactionRating || 0), 0) / rated.length
    : 0;
  const list = visible
    .filter((f) => followUpStatus(f) === tab)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const labels: Record<string, string> = {
    due: tr("اليوم", "Today"),
    overdue: tr("المتأخرة", "Overdue"),
    upcoming: tr("القادمة", "Upcoming"),
    completed: tr("المكتملة", "Completed"),
    cancelled: tr("الملغاة", "Cancelled"),
  };
  const ref = useDialog(!!selected, () => setSelected(null));
  const complete = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selected ||
      !canCompleteFollowUp(effectiveUser, selected) ||
      !result.trim() ||
      (hasNext && !nextDate) ||
      (isPostSale(selected) && !rating)
    )
      return;
    const hasReferral = isPostSale(selected) && rating >= REFERRAL_MIN_STARS && !!(referralName.trim() || referralPhone.trim());
    if (hasReferral && (!referralName.trim() || !isReferralPhone(referralPhone))) {
      setFormError(tr("اكتب اسم المرشَّح ورقم موبايله بشكل صحيح، أو سيب الخانتين فاضيين.", "Enter the referral's name and a valid mobile number, or leave both fields empty."));
      return;
    }
    setFormError("");
    updateFollowUpResult(
      selected.id,
      "completed",
      result.trim(),
      hasNext ? nextDate : undefined,
      isPostSale(selected)
        ? {
            satisfactionRating: rating,
            satisfactionComment: ratingComment.trim() || undefined,
            referralNote: [referralName.trim(), referralPhone.trim(), referralNote.trim()].filter(Boolean).join(" · ") || undefined,
          }
        : undefined,
    );
    if (hasReferral) {
      try {
        addReferralLead({ fromLeadId: selected.leadId, name: referralName, phone: referralPhone, followUpId: selected.id });
      } catch {
        /* the call result is already saved; the salesperson can register the prospect from the customer file */
      }
    }
    setSelected(null);
    setRating(0);
    setRatingComment("");
    setReferralNote("");
    setReferralName("");
    setReferralPhone("");
    setResult("");
    setNextDate("");
    setHasNext(false);
  };
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{tr("كل تواصل له خطوة جاية", "Every contact has a next step")}</span>
          <h1>{tr("المتابعات", "Follow-ups")}</h1>
          <p>
            {worksOwnCustomers(effectiveUser)
              ? tr("ابدأ بالمستحق وسجّل نتيجة التواصل.", "Start with what's due and log the contact result.")
              : tr("راجع التأخير والموظف المسؤول عن كل متابعة داخل نطاقك.", "Review delays and the employee responsible for each follow-up in your scope.")}
          </p>
        </div>
      </div>
      {dueReviews.length > 0 && (
        <section className="panel" style={{ marginBottom: 16, borderColor: "#c8232b" }}>
          <div className="panel-header">
            <div>
              <h2>{tr(`تقييمات محتاجة تذكير (${dueReviews.length})`, `Reviews that need a reminder (${dueReviews.length})`)}</h2>
              <p>{tr("عدّت 48 ساعة من غير ما العميل يقيّم. ابعتله تذكير واحد، ولو ما ردش اقفل الطلب.", "48 hours passed without the customer rating. Send one reminder, and if they don't respond close the request.")}</p>
            </div>
          </div>
          <div className="review-list">
            {dueReviews.map((r) => (
              <ReviewCard key={r.id} request={r} showCustomer onOpenLead={onOpenLead} />
            ))}
          </div>
        </section>
      )}
      <section className="panel">
        <FilterBar
          search={{ value: q, onChange: setQ, placeholder: tr("ابحث باسم العميل أو رقمه أو سبب المتابعة…", "Search by customer name, number or follow-up reason…") }}
          selects={[
            { id: "branch", label: tr("الفرع", "Branch"), value: fBranch, onChange: setFBranch, allLabel: tr("كل الفروع", "All branches"), primary: true, options: uniq(followUps.map((f) => f.branchId)).map((id) => ({ value: id, label: branches.find((b) => b.id === id)?.name || id })) },
            { id: "agent", label: tr("الموظف", "Employee"), value: fAgent, onChange: setFAgent, allLabel: tr("كل الموظفين", "All employees"), primary: !worksOwnCustomers(effectiveUser), options: uniq(followUps.map((f) => f.assignedAgentId)).map((id) => ({ value: id, label: followUps.find((f) => f.assignedAgentId === id)?.assignedAgentName || id })) },
          ]}
          dates={{ from: fFrom, to: fTo, onFrom: setFFrom, onTo: setFTo, label: tr("موعد المتابعة", "Follow-up date") }}
          onReset={() => {
            setQ("");
            setFBranch("all");
            setFAgent("all");
            setFFrom("");
            setFTo("");
          }}
        />
        <div
          className="tab-filter"
          role="group"
          aria-label={tr(tr("نوع المتابعة", "Follow-up type"), "Follow-up type")}
          style={{ marginBottom: 10 }}
        >
          {(
            [
              ["all", tr("كل المتابعات", "All follow-ups")],
              ["sales", tr("متابعات البيع", "Sales follow-ups")],
              ["post_sale", tr("بعد البيع", "After sale")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              aria-pressed={kind === id}
              onClick={() => setKind(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {kind !== "sales" && rated.length > 0 && (
          <p className="table-secondary" style={{ marginBottom: 10 }}>
            {tr("متوسط رضا العملاء بعد التسليم:", "Average customer satisfaction after delivery:")} <strong>{avgRating.toFixed(1)}</strong>{" "}
            {tr(`/ 5 من ${rated.length} تقييم`, `/ 5 from ${rated.length} ratings`)}
          </p>
        )}
        <div className="tab-filter" role="group" aria-label={tr(tr("تصفية المتابعات", "Filter follow-ups"), "Filter follow-ups")}>
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
              {isPostSale(f) && (
                <span className="status-pill is-success">
                  {tr("بعد البيع", "After sale")} · {milestoneLabel(f.milestone, en)}
                </span>
              )}
              <p>{f.reason}</p>
              <div className="followup-meta">
                <span>
                  <CalendarDays size={14} />
                  {f.scheduledAt.replace("T", " ").slice(0, 16)}
                </span>
                <span>{f.assignedAgentName}</span>
                <span dir="ltr">{f.leadPhone}</span>
              </div>
              {f.outcomeResult && <p>{tr("النتيجة:", "Result:")} {f.outcomeResult}</p>}
              {f.satisfactionRating && (
                <p>
                  {tr("رضا العميل:", "Customer satisfaction:")} {"★".repeat(f.satisfactionRating)}
                  {"☆".repeat(5 - f.satisfactionRating)}
                  {f.satisfactionComment ? ` — ${f.satisfactionComment}` : ""}
                </p>
              )}
              {f.referralNote && <p>{tr("ترشيحات:", "Referrals:")} {f.referralNote}</p>}
              <div className="followup-actions">
                {canCompleteFollowUp(effectiveUser, f) &&
                  !["completed", "cancelled"].includes(tab) && (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setSelected(f);
                        setRating(0);
                        setRatingComment("");
                        setReferralNote("");
                        setResult("");
                        setHasNext(false);
                        setNextDate("");
                      }}
                    >
                      <Check size={15} />
                      {tr("تسجيل النتيجة", "Log result")}
                    </button>
                  )}
                {canAccessPage(effectiveUser, "clients") && f.category !== "post_sale" && (() => {
                  const last = lastOutcome(f.leadId, bookings, notBoughtRecords);
                  return last.kind === "bought" ? (
                    <span className="last-bought" title={last.what}>
                      {tr("آخر مرة اشترى:", "Last purchase:")} <bdi>{last.date}</bdi> · <bdi>{last.amount.toLocaleString("en-US")}</bdi> {tr("ج.م", "EGP")}
                    </span>
                  ) : (
                    <button
                      className="btn-secondary"
                      onClick={() => onOpenLead(f.leadId, "outcome")}
                    >
                      {tr("اشترى ولا لسه؟", "Bought yet?")}
                    </button>
                  );
                })()}
                {canAccessPage(effectiveUser, "clients") && (
                  <button
                    className="btn-secondary"
                    onClick={() => onOpenLead(f.leadId)}
                  >
                    {tr("ملف العميل", "Customer file")}
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
                      {tr("اتصال", "Call")}
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
                      {tr("واتساب", "WhatsApp")}
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
                ? tr("مفيش متابعات مستحقة اليوم", "No follow-ups due today")
                : tab === "overdue"
                  ? tr("مفيش متابعات متأخرة", "No overdue follow-ups")
                  : tr("مفيش متابعات في القائمة دي", "No follow-ups in this list")}
            </h3>
            <p>{tr("المتابعات المتاحة حسب صلاحياتك تظهر هنا.", "Follow-ups available to your permissions appear here.")}</p>
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
                  {tr("نتيجة التواصل", "Contact result")}
                </h2>
                <p>{selected.leadName}</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label={tr(tr("إغلاق تسجيل النتيجة", "Close result logging"), "Close result logging")}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={complete}>
              {(() => {
                const l = leads.find((x) => x.id === selected.leadId);
                return l ? <CustomerBrief lead={l} compact /> : null;
              })()}
              <label className="field">
                <span>
                  {tr("إيه اللي حصل؟", "What happened?")} <em>{tr("مطلوب", "required")}</em>
                </span>
                <VoiceNoteField
                  rows={3}
                  required
                  value={result}
                  onChange={setResult}
                  placeholder={tr(tr("مثلاً: العميل طلب عرض سعر وهيرد يوم الأحد.", "e.g. the customer asked for a quote and will reply on Sunday."), "e.g. the customer asked for a quote and will reply on Sunday.")}
                />
              </label>
              {isPostSale(selected) && (
                <>
                  <div className="field">
                    <span>
                      {tr("رضا العميل عن الشغل", "Customer satisfaction with the work")} <em>{tr("مطلوب", "required")}</em>
                    </span>
                    <div
                      role="radiogroup"
                      aria-label={tr(tr("تقييم الرضا", "Satisfaction rating"), "Satisfaction rating")}
                      style={{ display: "flex", gap: 6 }}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          type="button"
                          key={n}
                          role="radio"
                          aria-checked={rating === n}
                          aria-label={tr(`${n} من 5`, `${n} of 5`)}
                          onClick={() => setRating(n)}
                          className="icon-button"
                        >
                          <Star
                            size={20}
                            fill={n <= rating ? "#e9a82b" : "none"}
                            color={n <= rating ? "#e9a82b" : "currentColor"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="field">
                    <span>
                      {tr("ملاحظة العميل", "Customer note")} <em className="optional-tag">{tr("اختياري", "optional")}</em>
                    </span>
                    <textarea
                      rows={2}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder={tr(tr("إيه اللي عجبه أو ما عجبوش؟", "What did they like or dislike?"), "What did they like or dislike?")}
                    />
                  </label>
                  {rating >= REFERRAL_MIN_STARS ? (
                    <>
                  <div className="field">
                    <span>
                      {tr("حد من قرايبه أو معارفه محتاج؟", "Does anyone they know need something?")}{" "}
                      <em className="optional-tag">{tr("اختياري", "optional")}</em>
                    </span>
                    <div className="field-grid">
                      <input value={referralName} onChange={(e) => setReferralName(e.target.value)} placeholder={tr(tr("اسمه", "Their name"), "Their name")} />
                      <input dir="ltr" type="tel" inputMode="tel" value={referralPhone} onChange={(e) => setReferralPhone(e.target.value)} placeholder="01xxxxxxxxx" />
                    </div>
                    <p className="quiet-note">{tr("لو العميل سمح، هيتسجل كعميل محتمل وتتجدول متابعة بعد يومين.", "If the customer agrees, they are saved as a prospect and a follow-up is scheduled in two days.")}</p>
                  </div>
                  <label className="field">
                    <span>
                      {tr("ملاحظة عن احتياجه", "Note about their need")} <em className="optional-tag">{tr("اختياري", "optional")}</em>
                    </span>
                    <textarea rows={2} value={referralNote} onChange={(e) => setReferralNote(e.target.value)} placeholder={tr("محتاج إيه؟ (دهان شقة، تشطيب…)", "What do they need? (apartment paint, finishing…)")} />
                  </label>
                    </>
                  ) : (
                    <p className="quiet-note">{tr("الترشيحات بنسألها بس للعميل اللي قيّم 4 أو 5 نجوم. اللي مش راضي بنركّز على حل مشكلته الأول.", "We only ask for referrals from customers who rated 4 or 5 stars. If they are unhappy we focus on solving their problem first.")}</p>
                  )}
                </>
              )}
              {formError && <p className="notice warning" role="alert">{formError}</p>}
              <label className="checkbox-line" style={{ marginBlock: 20 }}>
                <input
                  type="checkbox"
                  checked={hasNext}
                  onChange={(e) => setHasNext(e.target.checked)}
                />
                {tr("تحديد متابعة تانية", "Schedule another follow-up")} <em className="optional-tag">{tr("اختياري", "optional")}</em>
              </label>
              {hasNext && (
                <label className="field">
                  <span>{tr("الموعد القادم", "Next date")}</span>
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
                {tr("حفظ النتيجة", "Save result")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
