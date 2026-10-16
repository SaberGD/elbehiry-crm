import { useCRM } from "../../context/CRMContext";
import { canContactCustomer } from "../../lib/access";
import { useState } from "react";
import { X, Copy, MessageCircle, Check } from "lucide-react";
import type { Lead } from "../../types/crm";
import { phoneNumber } from "../../lib/presentation";
import { useDialog } from "./useDialog";

interface Props {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}
export function CustomerRatingModal({ lead, isOpen, onClose }: Props) {
  const { effectiveUser, followUps } = useCRM();
  const [message, setMessage] = useState("");
  const ref = useDialog(isOpen, onClose);
  if (!isOpen || !lead || !canContactCustomer(effectiveUser, lead, followUps))
    return null;
  const url =
    lead.uniqueEvaluationUrl ||
    `https://eval.beherypaints.com/rate?leadId=${encodeURIComponent(lead.id)}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("تم نسخ الرابط.");
    } catch {
      setMessage("تعذر النسخ. تقدر تحدد الرابط وتنسخه يدويًا.");
    }
  };
  return (
    <div
      className="dialog-backdrop"
      style={{ zIndex: 80 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-share-title"
        className="panel"
        ref={ref}
        style={{ width: "min(480px,100%)", padding: 27 }}
      >
        <div className="page-heading">
          <div>
            <span className="eyebrow">رأي العميل يهمنا</span>
            <h2
              id="rating-share-title"
              style={{ fontSize: 20, fontWeight: 600 }}
            >
              طلب تقييم من العميل
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="إغلاق رابط التقييم"
          >
            <X size={18} />
          </button>
        </div>
        <p className="quiet-note" style={{ padding: "0 0 20px" }}>
          شارك الرابط مع {lead.name} عشان يكتب رأيه بنفسه. فتح الرابط أو إرساله
          مش تأكيد لاستلام تقييم.
        </p>
        <label className="field">
          <span>رابط التقييم</span>
          <input
            readOnly
            value={url}
            dir="ltr"
            onFocus={(e) => e.target.select()}
          />
        </label>
        <div
          style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}
        >
          <button className="btn-secondary" onClick={copy}>
            {message.startsWith("تم") ? (
              <Check size={16} />
            ) : (
              <Copy size={16} />
            )}
            نسخ الرابط
          </button>
          <a
            className="btn-primary"
            href={`https://wa.me/${phoneNumber(lead.whatsappPhone || lead.phone)}?text=${encodeURIComponent(`أهلاً أ/ ${lead.name}، رأيك في تجربتك مع البحيري يهمنا. تقدر تشاركنا تقييمك من هنا: ${url}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={16} />
            مشاركة على واتساب
          </a>
        </div>
        {message && (
          <p
            role="status"
            className="quiet-note"
            style={{ padding: "15px 0 0" }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
