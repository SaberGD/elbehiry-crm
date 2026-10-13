import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Branch } from '../types/crm';
import { BranchDetailsModal } from '../components/common/BranchDetailsModal';
import {
  Users,
  Building2,
  PhoneCall,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Clock,
  UserCheck,
  ArrowUpRight,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onOpenLead: (leadId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab, onOpenLead }) => {
  const { effectiveUser, leads, visits, followUps, bookings, branches, users } = useCRM();
  const { t } = useLanguage();

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const handleOpenBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsBranchModalOpen(true);
  };

  const role = effectiveUser.role;

  // Role Scoped Filters
  const scopedLeads = leads.filter((l) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return l.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return l.branchId === effectiveUser.branchId && l.teamId === effectiveUser.teamId;
    return l.assignedAgentId === effectiveUser.id;
  });

  const scopedFollowUps = followUps.filter((f) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return f.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return f.branchId === effectiveUser.branchId;
    return f.assignedAgentId === effectiveUser.id;
  });

  const scopedBookings = bookings.filter((b) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return b.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return b.branchId === effectiveUser.branchId;
    return b.agentId === effectiveUser.id;
  });

  const scopedVisits = visits.filter((v) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return v.branchId === effectiveUser.branchId;
    return v.receivedByAgentId === effectiveUser.id;
  });

  // Key Metrics
  const totalLeadsCount = scopedLeads.length;
  const bookedCount = scopedLeads.filter((l) => l.status === 'booked').length;
  const conversionRate = totalLeadsCount > 0 ? Math.round((bookedCount / totalLeadsCount) * 100) : 0;

  const dueTodayCount = scopedFollowUps.filter((f) => f.status === 'due').length;
  const overdueCount = scopedFollowUps.filter((f) => f.status === 'overdue').length;

  const totalRevenue = scopedBookings.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-[#dfe2ee] p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#d9b438]/15 text-[#b8951d] dark:text-[#d9b438] border border-[#d9b438]/30 font-mono">
              {t(`role.${role}`)}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#8d9197]">· {effectiveUser.branchName || 'كافة فروع المؤسسة'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-[#dfe2ee] tracking-tight">
            مرحباً بك، م. {effectiveUser.name} 👋
          </h1>
          <p className="text-xs text-slate-600 dark:text-[#8d9197] mt-1 max-w-2xl leading-relaxed">
            {role === 'admin' && 'لوحة القيادة المركزية لمتابعة محفظة الأعمال وأداء جميع الفروع والفرق والتحليلات النقدية.'}
            {role === 'branch_manager' && 'لوحة متابعة الفرع: السجلات التنفيذية، أداء الموظفين، والتحصيلات المستحقة.'}
            {role === 'supervisor' && 'لوحة الإشراف والتنفيذ لمتابعة جودة الصفحات والعقود.'}
            {role === 'team_leader' && 'لوحة قائد الفريق: توزيع العملاء الميداني والمتابعات التنفيذية اليومية.'}
            {role === 'sales_agent' && 'مساحة العمل اليومية: متابعة المبيعات المسجلة وتحديث حالات العملاء.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('add_client')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-[#1a212e] dark:hover:bg-[#252f42] text-white border border-slate-600/30 dark:border-white/10 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            <span>+ إضافة سجل جديد</span>
          </button>
          <button
            onClick={() => setActiveTab('record_visit')}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#151a24] dark:hover:bg-[#1e2533] text-slate-800 dark:text-[#dfe2ee] rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-white/10 cursor-pointer flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            <span>تسجيل زيارة فرع</span>
          </button>
        </div>
      </div>

      {/* KPI Interactive Stat Cards (Clickable to open details) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Leads */}
        <button
          onClick={() => setActiveTab('clients')}
          className="glass-card p-3.5 sm:p-5 rounded-2xl transition-all text-right dir-ltr:text-left cursor-pointer group flex items-center justify-between min-h-[100px] min-w-0"
          title="انقر لعرض تفاصيل العملاء"
        >
          <div className="min-w-0 flex-1 pl-2">
            <div className="fit-title font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-[#7295b3] transition-colors flex items-center gap-1 truncate">
              <span>إجمالي العملاء</span>
              <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180 shrink-0" />
            </div>
            <div className="fit-value font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono-numbers">
              {totalLeadsCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">المسجلين في النطاق</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-[#7295b3] flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>

        {/* Card 2: Overdue Followups */}
        <button
          onClick={() => setActiveTab('overdue_followups')}
          className="glass-card p-3.5 sm:p-5 rounded-2xl transition-all text-right dir-ltr:text-left cursor-pointer group flex items-center justify-between min-h-[100px] min-w-0"
          title="انقر لعرض المتابعات المتأخرة"
        >
          <div className="min-w-0 flex-1 pl-2">
            <div className="fit-title font-semibold text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-1 truncate">
              <span>المتابعات المستحقة</span>
              <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180 shrink-0" />
            </div>
            <div className="fit-value font-bold text-red-600 dark:text-red-500 mt-1 font-mono-numbers">
              {overdueCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium truncate">
              {dueTodayCount} مستحقة اليوم
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>

        {/* Card 3: Bookings */}
        <button
          onClick={() => setActiveTab('bookings')}
          className="glass-card p-3.5 sm:p-5 rounded-2xl transition-all text-right dir-ltr:text-left cursor-pointer group flex items-center justify-between min-h-[100px] min-w-0"
          title="انقر لعرض الحجوزات المؤكدة"
        >
          <div className="min-w-0 flex-1 pl-2">
            <div className="fit-title font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1 truncate">
              <span>الحجوزات المؤكدة</span>
              <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180 shrink-0" />
            </div>
            <div className="fit-value font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono-numbers">
              {bookedCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5 truncate">
              نسبة التحويل {conversionRate}%
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>

        {/* Card 4: Total Sales Value */}
        <button
          onClick={() => setActiveTab('reports')}
          className="glass-card p-3.5 sm:p-5 rounded-2xl transition-all text-right dir-ltr:text-left cursor-pointer group flex items-center justify-between min-h-[100px] min-w-0"
          title="انقر لعرض التقارير المالية والإحصائيات"
        >
          <div className="min-w-0 flex-1 pl-2">
            <div className="fit-title font-semibold text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors flex items-center gap-1 truncate">
              <span>إجمالي المبيعات (ج.م)</span>
              <ChevronLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180 shrink-0" />
            </div>
            <div className="fit-value font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono-numbers">
              {totalRevenue.toLocaleString('ar-EG')}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{scopedBookings.length} عملية حجز</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Column: Urgent Action Required */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue & Urgent Follow-ups Widget */}
          <div className="bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-[#121620] border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">المتابعات التي تحتاج إجراء عاجل</h3>
              </div>
              <button
                onClick={() => setActiveTab('followups')}
                className="text-xs text-slate-700 dark:text-[#7295b3] font-bold hover:underline cursor-pointer"
              >
                عرض كافة المتابعات ({scopedFollowUps.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {scopedFollowUps.filter((f) => f.status === 'overdue' || f.status === 'due').length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                  ✨ لا توجد متابعات متأخرة أو مستحقة حالياً. عمل ممتاز!
                </div>
              ) : (
                scopedFollowUps
                  .filter((f) => f.status === 'overdue' || f.status === 'due')
                  .slice(0, 5)
                  .map((f) => (
                    <div
                      key={f.id}
                      className="p-4 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              f.status === 'overdue'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}
                          >
                            {t(`followup.${f.status}`)}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{f.leadName}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono-numbers">({f.leadPhone})</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">{f.reason}</p>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          الموعد المحدد: <span className="font-mono-numbers text-slate-700 dark:text-[#7295b3] font-semibold">{f.scheduledAt}</span> · المسؤول: {f.assignedAgentName || 'عام'}
                        </div>
                      </div>

                      <button
                        onClick={() => onOpenLead(f.leadId)}
                        className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-[#1a212e] dark:hover:bg-[#252f42] text-white border border-slate-600/30 dark:border-white/10 rounded-xl text-xs font-semibold shrink-0 cursor-pointer min-h-[38px] flex items-center justify-center transition-colors shadow-xs"
                      >
                        فتح العميل
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Recent Visits and Walk-in Inquiries */}
          <div className="bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-[#121620] border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#7295b3]" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">أحدث الزيارات والاستفسارات بمقرات الفروع</h3>
              </div>
              <button
                onClick={() => setActiveTab('visits')}
                className="text-xs text-slate-700 dark:text-[#7295b3] font-bold hover:underline cursor-pointer"
              >
                عرض سجل الزيارات ({scopedVisits.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {scopedVisits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">لم تسجل زيارات فروع حديثة</div>
              ) : (
                scopedVisits.slice(0, 4).map((v) => (
                  <div key={v.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                        <span>{v.visitorName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono-numbers">({v.phone || 'بدون رقم'})</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                          {v.branchName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{v.reason}</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">النتيجة: {v.outcome}</p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 shrink-0 font-mono-numbers">
                      {v.date} {v.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Roles & Team Summaries */}
        <div className="space-y-6">
          {/* Branch Performance Grid (For Admin / Branch Manager) */}
          {(role === 'admin' || role === 'branch_manager') && (
            <div className="bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#7295b3]" />
                <span>أداء الفروع والمبيعات</span>
              </h3>

              <div className="space-y-3">
                {branches.map((b) => {
                  const bLeads = leads.filter((l) => l.branchId === b.id);
                  const bBookings = bookings.filter((bk) => bk.branchId === b.id);
                  const bRevenue = bBookings.reduce((sum, bk) => sum + bk.amount, 0);

                  return (
                    <button
                      key={b.id}
                      onClick={() => handleOpenBranch(b)}
                      className="w-full text-right dir-ltr:text-left p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#7295b3]">
                        <span>{b.name}</span>
                        <span className="text-slate-700 dark:text-[#7295b3] font-mono-numbers">{bLeads.length} عميل</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>المدير: {b.managerName || 'غير معين'}</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono-numbers">
                          {bRevenue.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Sales Agents Leaderboard */}
          <div className="bg-white dark:bg-[#0c1017] rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#7295b3]" />
              <span>أعلى مسؤول المبيعات إنجازاً</span>
            </h3>

            <div className="space-y-3">
              {users
                .filter((u) => u.role === 'sales_agent')
                .map((ag) => {
                  const agBookings = bookings.filter((b) => b.agentId === ag.id);
                  const agRevenue = agBookings.reduce((sum, b) => sum + b.amount, 0);

                  return (
                    <div key={ag.id} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-xs">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{ag.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{ag.branchName || 'فرع عام'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono-numbers">
                          {agRevenue.toLocaleString('ar-EG')} ج.م
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono-numbers">{agBookings.length} حجز</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Branch Details Modal */}
      <BranchDetailsModal
        branch={selectedBranch}
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onOpenLead={onOpenLead}
        onAddClientForBranch={() => setActiveTab('add_client')}
      />
    </div>
  );
};
