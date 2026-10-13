import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Department, Booking, Lead, Branch } from '../types/crm';
import { ElBeheryLogo } from '../components/common/ElBeheryLogo';
import { BranchDetailsModal } from '../components/common/BranchDetailsModal';
import {
  Building,
  Paintbrush,
  Trees,
  Layers,
  ShoppingBag,
  TrendingUp,
  Building2,
  Users,
  ChevronLeft,
  Star,
  MessageSquare,
  ArrowUpRight,
  Phone,
  BarChart2,
  Eye,
} from 'lucide-react';

interface DepartmentDashboardPageProps {
  setActiveTab: (tab: string) => void;
  onOpenLead: (leadId: string) => void;
}

export const DepartmentDashboardPage: React.FC<DepartmentDashboardPageProps> = ({
  setActiveTab,
  onOpenLead,
}) => {
  const { effectiveUser, leads, bookings, branches, visits } = useCRM();
  const { t } = useLanguage();

  const [activeDept, setActiveDept] = useState<Department>('decor');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const deptConfigs: Record<
    Department,
    { title: string; subtitle: string; icon: React.ElementType; color: string; bgLight: string; bgDark: string }
  > = {
    construction: {
      title: 'قسم الإنشائي والمقاولات',
      subtitle: 'أعمال الخرسانات والبناء والمقاولات العامة',
      icon: Building,
      color: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-500/10 border-amber-200 text-amber-900',
      bgDark: 'dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300',
    },
    decor: {
      title: 'قسم الديكورات والدهانات',
      subtitle: 'دهانات البحيري والتشتيبات والديكورات الحديثة',
      icon: Paintbrush,
      color: 'text-[#abcae9] dark:text-[#abcae9]',
      bgLight: 'bg-[#abcae9]/10 border-[#abcae9]/20 text-[#abcae9]',
      bgDark: 'dark:bg-[#abcae9]/10 dark:border-[#abcae9]/30 dark:text-[#abcae9]',
    },
    garden: {
      title: 'قسم البستان واللاندسكيب',
      subtitle: 'تنسيق الحدائق والمساحات الخضراء وشبكات الري',
      icon: Trees,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgLight: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      bgDark: 'dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400',
    },
    general: {
      title: 'قسم المتنوع والمنتجات الإضافية',
      subtitle: 'الخدمات الخاصة، التوريدات والتنوعات العامة',
      icon: Layers,
      color: 'text-[#d9b438] dark:text-[#d9b438]',
      bgLight: 'bg-[#d9b438]/10 border-[#d9b438]/20 text-[#d9b438]',
      bgDark: 'dark:bg-[#d9b438]/10 dark:border-[#d9b438]/30 dark:text-[#d9b438]',
    },
  };

  // Helper to filter data by department
  const getDeptBookings = (dept: Department) => bookings.filter((b) => b.department === dept);
  const getDeptLeads = (dept: Department) => leads.filter((l) => l.department === dept);
  const getDeptVisits = (dept: Department) => visits.filter((v) => v.department === dept);

  const currentBookings = getDeptBookings(activeDept);
  const currentLeads = getDeptLeads(activeDept);
  const currentVisits = getDeptVisits(activeDept);

  const totalDeptRevenue = currentBookings.reduce((sum, b) => sum + b.amount, 0);

  // Overall totals across all 4 departments for quick header overview
  const totalAllRevenue = bookings.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#181c24] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-[#dfe2ee] p-5 sm:p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#262a33] border border-slate-200 dark:border-white/10 shrink-0">
            <ElBeheryLogo size="lg" showText={false} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#d9b438]/15 text-[#b8951d] dark:text-[#d9b438] border border-[#d9b438]/30 font-mono">
                البحيري CRM • البوابة الرئيسية
              </span>
              <span className="text-xs text-slate-500 dark:text-[#8d9197]">· {effectiveUser.branchName || 'كافة فروع المؤسسة'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-1 text-slate-900 dark:text-[#dfe2ee] tracking-tight">
              أقسام ومبيعات البحيري CRM 🏢
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#8d9197] mt-1 max-w-2xl leading-relaxed">
              استعراض المبيعات الحية حسب القطاعات (إنشائي، ديكور، بستان، دهانات، متنوع) ومتابعة أداء الفروع.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setActiveTab('analytics_dashboard')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-[#1a212e] dark:hover:bg-[#252f42] text-white border border-slate-600/30 dark:border-white/10 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 min-h-[42px]"
          >
            <BarChart2 className="w-4 h-4 text-[#7295b3]" />
            <span>لوحة التحليلات والإحصائيات العامة ←</span>
          </button>
        </div>
      </div>

      {/* 4 Departments Quick Stat Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['construction', 'decor', 'garden', 'general'] as Department[]).map((deptKey) => {
          const cfg = deptConfigs[deptKey];
          const Icon = cfg.icon;
          const deptBk = getDeptBookings(deptKey);
          const deptRev = deptBk.reduce((sum, b) => sum + b.amount, 0);
          const isSelected = activeDept === deptKey;

          return (
            <button
              key={deptKey}
              onClick={() => setActiveDept(deptKey)}
              className={`p-4 sm:p-5 rounded-2xl glass-card text-right dir-ltr:text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[130px] ${
                isSelected
                  ? 'border-[#799ebd] dark:border-[#799ebd] shadow-lg ring-1 ring-[#799ebd]/40 bg-[#181d2a]/90'
                  : 'hover:border-[#799ebd]/40 hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${cfg.bgLight} ${cfg.bgDark}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {cfg.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono-numbers">
                      {deptBk.length} عمليات حجز
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#799ebd] animate-pulse" />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between w-full">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">إجمالي المبيعات:</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                  {deptRev.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Department Overview & Branch Sales Breakdown */}
      <div className="glass-card rounded-2xl p-5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {React.createElement(deptConfigs[activeDept].icon, {
              className: `w-7 h-7 ${deptConfigs[activeDept].color}`,
            })}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {deptConfigs[activeDept].title} - المبيعات وتفاصيل الفروع
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {deptConfigs[activeDept].subtitle}
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-right dir-ltr:text-left">
            <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">مبيعات القسم الكلية</div>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-200 font-mono-numbers">
              {totalDeptRevenue.toLocaleString('ar-EG')} ج.م
            </div>
          </div>
        </div>

        {/* Branch Sales Breakdown for this department (من أنهي فرع وبكام) */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#7295b3]" />
            <span>تفاصيل مبيعات القسم حسب الفروع (من أنهي فرع وبكام):</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {branches.map((branch) => {
              const branchDeptBookings = currentBookings.filter((b) => b.branchId === branch.id);
              const branchDeptRev = branchDeptBookings.reduce((sum, b) => sum + b.amount, 0);

              return (
                <button
                  key={branch.id}
                  onClick={() => {
                    setSelectedBranch(branch);
                    setIsBranchModalOpen(true);
                  }}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-[#7295b3] space-y-2 text-right dir-ltr:text-left transition-all cursor-pointer group shadow-2xs hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-[#7295b3] transition-colors flex items-center gap-1">
                      <span>{branch.name}</span>
                      <ChevronLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity dir-ltr:rotate-180" />
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                      {branch.code}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">إجمالي القيمة:</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                      {branchDeptRev.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-numbers flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>عدد المبيعات: {branchDeptBookings.length} عملية</span>
                    <span className="text-[#7295b3] font-bold text-[10px]">فتح الفرع ←</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Recent Sales & Inquiries in this Department */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>سجل عمليات الحجز والمبيعات بالقسم ({currentBookings.length})</span>
            </h3>

            <button
              onClick={() => setActiveTab('add_client')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-[#1a212e] dark:hover:bg-[#252f42] text-white border border-slate-600/30 dark:border-white/10 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              + إضافة عملية بيع جديدة
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right dir-ltr:text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">اسم العميل</th>
                  <th className="p-3">الهاتف والواتس</th>
                  <th className="p-3">الفرع البائع</th>
                  <th className="p-3">القيمة والأسعار (بكام)</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">تاريخ البيع</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                      لا توجد مبيعات مسجلة في هذا القسم بعد
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((b) => {
                    const leadObj = leads.find((l) => l.id === b.leadId);
                    const whatsappNum = leadObj?.whatsappPhone || leadObj?.phone || b.leadPhone;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {b.leadName}
                        </td>
                        <td className="p-3 font-mono-numbers">
                          <div className="text-slate-800 dark:text-slate-200">{b.leadPhone}</div>
                          {whatsappNum && (
                            <a
                              href={`https://wa.me/20${whatsappNum.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                            >
                              💬 واتس: {whatsappNum}
                            </a>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{b.branchName}</td>
                        <td className="p-3 font-mono-numbers font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          {b.amount.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{b.agentName}</td>
                        <td className="p-3 font-mono-numbers text-slate-500 dark:text-slate-400">{b.bookingDate}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onOpenLead(b.leadId)}
                            className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-[#abcae9] rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          >
                            ملف العميل
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Branch Details Modal */}
      <BranchDetailsModal
        branch={selectedBranch}
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onOpenLead={onOpenLead}
        onAddClientForBranch={(branchId) => setActiveTab('add_client')}
      />
    </div>
  );
};
