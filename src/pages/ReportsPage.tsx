import React from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, TrendingUp, Users, ShoppingBag, Award, Building2, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { effectiveUser, leads, visits, followUps, bookings, branches, users } = useCRM();
  const { t } = useLanguage();

  const role = effectiveUser.role;

  // Scoped Data
  const scopedLeads = leads.filter((l) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return l.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return l.branchId === effectiveUser.branchId && l.teamId === effectiveUser.teamId;
    return l.assignedAgentId === effectiveUser.id;
  });

  const scopedBookings = bookings.filter((b) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return b.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return b.branchId === effectiveUser.branchId;
    return b.agentId === effectiveUser.id;
  });

  const totalRevenue = scopedBookings.reduce((sum, b) => sum + b.amount, 0);
  const conversionRate = scopedLeads.length > 0 ? Math.round((scopedBookings.length / scopedLeads.length) * 100) : 0;

  // Source breakdown
  const sourceBreakdown = scopedLeads.reduce((acc, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span>التقارير الإحصائية ومؤشرات الأداء (KPIs)</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تحليلات رقمية حقيقية لنطاق عملك الحالي ({t(`role.${role}`)})
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي إيرادات المبيعات</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono-numbers">
            {totalRevenue.toLocaleString('ar-EG')} ج.م
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono-numbers">{scopedBookings.length} عملية حجز مؤكدة</div>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">معدل التحويل (Lead Conversion)</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 font-mono-numbers">{conversionRate}%</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono-numbers">من أصل {scopedLeads.length} عميل محتمل</div>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">الزيارات والاستفسارات الميدانية</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono-numbers">{visits.length}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">مسجلة بمقرات الفروع</div>
        </div>

        <div className="glass-card p-5 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">إجمالي المتابعات المنجزة</div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2 font-mono-numbers">
            {followUps.filter((f) => f.status === 'completed').length}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono-numbers">مكالمات وزيارات منفذة</div>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Breakdown */}
        <div className="glass-card rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>توزيع العملاء حسب مصادر الحملات والاستفسارات</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(sourceBreakdown).map(([source, count]) => {
              const pct = scopedLeads.length > 0 ? Math.round((count / scopedLeads.length) * 100) : 0;
              return (
                <div key={source} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span className="capitalize">{source}</span>
                    <span className="font-mono-numbers text-indigo-700 dark:text-indigo-400">{count} عميل ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch / Staff Conversion Ranking */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>ترتيب أداء الفروع والمبيعات</span>
          </h3>

          <div className="space-y-3">
            {branches.map((b) => {
              const bLeads = leads.filter((l) => l.branchId === b.id);
              const bBookings = bookings.filter((bk) => bk.branchId === b.id);
              const bRev = bBookings.reduce((sum, bk) => sum + bk.amount, 0);

              return (
                <div key={b.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{b.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-numbers mt-0.5">
                      {bLeads.length} عميل · {bBookings.length} حجز
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono-numbers text-sm">
                      {bRev.toLocaleString('ar-EG')} ج.م
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
