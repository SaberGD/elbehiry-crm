import React, { useState } from 'react';
import { Lead } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Star, CheckCircle2, Sparkles, X, ExternalLink, Send, MessageSquare } from 'lucide-react';

interface CustomerRatingModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerRatingModal: React.FC<CustomerRatingModalProps> = ({
  lead,
  isOpen,
  onClose,
}) => {
  const { updateLead, addTimelineEvent, effectiveUser } = useCRM();

  const [stars, setStars] = useState<number>(5);
  const [comment, setComment] = useState<string>('خدمة ممتازة، جودة دهانات فاخرة ومعاملة راقية جداً من فريق العمل!');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen || !lead) return null;

  const evalUrl = lead.uniqueEvaluationUrl || `https://eval.beherypaints.com/rate?leadId=${lead.id}&client=${encodeURIComponent(lead.name)}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nowIso = new Date().toISOString();

    updateLead(lead.id, {
      hasOpenedEvaluationLink: true,
      evaluationOpenedAt: nowIso,
      hasSubmittedRating: true,
      customerRatingStars: stars,
      customerRatingComment: comment,
    });

    addTimelineEvent({
      leadId: lead.id,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: 'call',
      title: 'دخول العميل وتأكيد التقييم المخصص',
      details: `قام العميل ${lead.name} بالدخول على رابط التقييم المخصص وتأكيد التقييم بـ (${stars}/5 نجوم): "${comment}"`,
    });

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 dark:bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-right dir-rtl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>رابط تقييم العميل المخصص تلقائياً</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
              صفحة تقييم العميل: {lead.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unique Link Info Badge */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">الرابط المخصص المولد للعميل:</div>
          <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all select-all font-semibold">
            {evalUrl}
          </div>
        </div>

        {submitted || lead.hasSubmittedRating ? (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              تم تسجيل دخول العميل وإتمام التقييم بنجاح!
            </h3>
            <div className="flex justify-center gap-1 text-amber-400">
              {Array.from({ length: lead.customerRatingStars || stars }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic">
              "{lead.customerRatingComment || comment}"
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">اختر عدد النجوم للتقييم:</label>
              <div className="flex items-center gap-2 justify-center p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStars(s)}
                    className="p-1 text-amber-400 hover:scale-115 transition-transform cursor-pointer"
                  >
                    <Star className={`w-8 h-8 ${s <= stars ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">رأي الملاحظة وتجربة العميل:</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="أدخل انطباع ورأي العميل..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد تسجيل الدخول والتقييم للعميل</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
