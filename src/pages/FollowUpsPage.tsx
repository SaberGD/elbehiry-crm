import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { FollowUp } from '../types/crm';
import { PhoneCall, AlertTriangle, CheckCircle2, Clock, Calendar, PlusCircle, Eye } from 'lucide-react';

interface FollowUpsPageProps {
  onOpenLead: (leadId: string) => void;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({ onOpenLead }) => {
  const { effectiveUser, followUps, updateFollowUpResult } = useCRM();
  const { t } = useLanguage();

  const role = effectiveUser.role;

  const [activeTab, setActiveTab] = useState<'due' | 'overdue' | 'upcoming' | 'completed'>('due');

  // Result logging modal
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [outcomeResult, setOutcomeResult] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [hasNextFollowUp, setHasNextFollowUp] = useState(false);

  // Scoped followups
  const scopedFollowUps = followUps.filter((f) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return f.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return f.branchId === effectiveUser.branchId;
    return f.assignedAgentId === effectiveUser.id;
  });

  const dueList = scopedFollowUps.filter((f) => f.status === 'due');
  const overdueList = scopedFollowUps.filter((f) => f.status === 'overdue');
  const upcomingList = scopedFollowUps.filter((f) => f.status === 'upcoming');
  const completedList = scopedFollowUps.filter((f) => f.status === 'completed');

  const currentList =
    activeTab === 'due'
      ? dueList
      : activeTab === 'overdue'
      ? overdueList
      : activeTab === 'upcoming'
      ? upcomingList
      : completedList;

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp || !outcomeResult) return;

    updateFollowUpResult(
      selectedFollowUp.id,
      'completed',
      outcomeResult,
      hasNextFollowUp ? nextDate : undefined
    );

    setSelectedFollowUp(null);
    setOutcomeResult('');
    setNextDate('');
    setHasNextFollowUp(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <PhoneCall className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>محرك إدارة المتابعات والمهام اليومية</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          متابعة مواعيد التواصل مع العملاء وتسجيل نتائج المكالمات والزيارات
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex glass-card rounded-2xl p-2 shadow-xs gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('due')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] ${
            activeTab === 'due'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>المستحقة اليوم ({dueList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] ${
            activeTab === 'overdue'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>المتأخرة ({overdueList.length})</span>
          {overdueList.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] ${
            activeTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>المتابعات القادمة ({upcomingList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>المكتملة ({completedList.length})</span>
        </button>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentList.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            لا توجد متابعات في هذا القسم حالياً
          </div>
        ) : (
          currentList.map((f) => (
            <div
              key={f.id}
              className={`glass-card rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                f.status === 'overdue'
                  ? 'border-red-500/40 dark:border-red-500/40 bg-red-500/5'
                  : f.status === 'due'
                  ? 'border-amber-500/40 dark:border-amber-500/40 bg-amber-500/5'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : f.status === 'due'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : f.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      {t(`followup.${f.status}`)}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{f.leadName}</span>
                  </div>

                  <span className="font-mono-numbers text-xs text-indigo-700 dark:text-indigo-400 font-bold">
                    {f.scheduledAt}
                  </span>
                </div>

                <div className="mt-3 text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">السبب:</strong> {f.reason}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    نوع التواصل: <span className="font-semibold">{f.type}</span> · رقم الهاتف:{' '}
                    <span className="font-mono-numbers">{f.leadPhone}</span>
                  </div>
                  {f.notes && <p className="text-slate-500 dark:text-slate-400 italic text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded">{f.notes}</p>}
                  {f.outcomeResult && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-medium text-xs mt-2">
                      <strong>نتيجة المتابعة:</strong> {f.outcomeResult}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => onOpenLead(f.leadId)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer min-h-[38px]"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ملف العميل</span>
                </button>

                {f.status !== 'completed' && (
                  <button
                    onClick={() => setSelectedFollowUp(f)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer min-h-[38px] flex items-center justify-center"
                  >
                    تسجيل نتيجة التواصل
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Outcome Modal */}
      {selectedFollowUp && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
              تسجيل نتيجة تنفيذ المتابعة للعميل: {selectedFollowUp.leadName}
            </h3>

            <form onSubmit={handleCompleteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">النتيجة والملاحظات التفصيلية *</label>
                <textarea
                  required
                  rows={3}
                  value={outcomeResult}
                  onChange={(e) => setOutcomeResult(e.target.value)}
                  placeholder="مثال: تم الاتصال، وافق العميل على العرض وطلب إرسال تفاصيل رابط الدفع على الواتساب..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasNextFollowUp}
                    onChange={(e) => setHasNextFollowUp(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>جدولة متابعة أخرى قادمة مع نفس العميل؟</span>
                </label>

                {hasNextFollowUp && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">الموعد القادم:</label>
                    <input
                      type="datetime-local"
                      required
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFollowUp(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  حفظ واكتمال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
