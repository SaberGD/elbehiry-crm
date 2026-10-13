import React, { useState } from 'react';
import { Branch, Lead, Visit, Booking, User, Team, Department } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Building2,
  MapPin,
  Phone,
  UserCheck,
  Users,
  ShoppingBag,
  TrendingUp,
  Compass,
  GitBranch,
  MessageSquare,
  PlusCircle,
  Calendar,
  Building,
  Paintbrush,
  Trees,
  Layers,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

interface BranchDetailsModalProps {
  branch: Branch | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenLead?: (leadId: string) => void;
  onAddClientForBranch?: (branchId: string) => void;
}

export const BranchDetailsModal: React.FC<BranchDetailsModalProps> = ({
  branch,
  isOpen,
  onClose,
  onOpenLead,
  onAddClientForBranch,
}) => {
  const { leads, bookings, visits, users, teams } = useCRM();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'teams_staff' | 'clients' | 'sales'>('overview');

  if (!isOpen || !branch) return null;

  // Filter branch specific data
  const branchLeads = leads.filter((l) => l.branchId === branch.id);
  const branchBookings = bookings.filter((b) => b.branchId === branch.id);
  const branchVisits = visits.filter((v) => v.branchId === branch.id);
  const branchTeams = teams.filter((tm) => tm.branchId === branch.id);
  const branchStaff = users.filter((u) => u.branchId === branch.id);

  const totalRevenue = branchBookings.reduce((sum, b) => sum + b.amount, 0);

  // Sales per department
  const deptStats: Record<Department, { label: string; icon: React.ElementType; amount: number; count: number }> = {
    construction: {
      label: 'قسم الإنشائي والمقاولات',
      icon: Building,
      amount: branchBookings.filter((b) => b.department === 'construction').reduce((sum, b) => sum + b.amount, 0),
      count: branchBookings.filter((b) => b.department === 'construction').length,
    },
    decor: {
      label: 'قسم الديكورات والدهانات',
      icon: Paintbrush,
      amount: branchBookings.filter((b) => b.department === 'decor').reduce((sum, b) => sum + b.amount, 0),
      count: branchBookings.filter((b) => b.department === 'decor').length,
    },
    garden: {
      label: 'قسم البستان واللاندسكيب',
      icon: Trees,
      amount: branchBookings.filter((b) => b.department === 'garden').reduce((sum, b) => sum + b.amount, 0),
      count: branchBookings.filter((b) => b.department === 'garden').length,
    },
    general: {
      label: 'قسم المتنوع والخدمات',
      icon: Layers,
      amount: branchBookings.filter((b) => b.department === 'general').reduce((sum, b) => sum + b.amount, 0),
      count: branchBookings.filter((b) => b.department === 'general').length,
    },
  };

  const managerObj = users.find((u) => u.id === branch.managerId || u.name === branch.managerName);

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#181d2a] text-[#d9b438] flex items-center justify-center font-bold text-xl shrink-0 shadow-sm border border-slate-200 dark:border-white/10">
              🏢
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">{branch.name}</h2>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-[#181d2a] text-slate-800 dark:text-[#d9b438] border border-slate-200 dark:border-white/10">
                  {branch.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  فرع نشط
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#7295b3] shrink-0" />
                  <span>{branch.city} · {branch.address}</span>
                </span>
                <span className="flex items-center gap-1 font-mono-numbers">
                  <Phone className="w-3.5 h-3.5 text-[#7295b3] shrink-0" />
                  <span>{branch.phone}</span>
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#7295b3] shrink-0" />
                  <span>المدير: {branch.managerName || 'غير معين'}</span>
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Branch Financial KPI Strip */}
        <div className="bg-slate-50 dark:bg-[#121620] border-b border-slate-200 dark:border-white/10 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
          <div className="bg-white dark:bg-[#0c1017] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">إجمالي إيرادات الفرع:</div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono-numbers">
              {totalRevenue.toLocaleString('ar-EG')} ج.م
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c1017] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">عملاء الفرع المسجلين:</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 font-mono-numbers">
              {branchLeads.length} عميل
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c1017] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">فرق المبيعات بالفرع:</div>
            <div className="text-base font-bold text-slate-700 dark:text-[#7295b3] mt-0.5 font-mono-numbers">
              {branchTeams.length} فرق عمل
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c1017] p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">الزيارات والمعاينات:</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono-numbers">
              {branchVisits.length} معاينة
            </div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1017] px-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'border-[#d9b438] text-slate-900 dark:text-[#d9b438] bg-slate-50 dark:bg-white/5'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            نظرة عامة ومبيعات الأقسام
          </button>

          <button
            onClick={() => setActiveTab('teams_staff')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'teams_staff'
                ? 'border-[#d9b438] text-slate-900 dark:text-[#d9b438] bg-slate-50 dark:bg-white/5'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            فرق العمل والموظفين ({branchStaff.length})
          </button>

          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'clients'
                ? 'border-[#d9b438] text-slate-900 dark:text-[#d9b438] bg-slate-50 dark:bg-white/5'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            جدول عملاء الفرع ({branchLeads.length})
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'sales'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            سجل عمليات البيع بالحجز ({branchBookings.length})
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & DEPARTMENT BREAKDOWN */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>تفاصيل مبيعات الفرع بحسب الأقسام الأربعة (إنشائي، ديكورات، بستان، متنوع):</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['construction', 'decor', 'garden', 'general'] as Department[]).map((deptKey) => {
                    const st = deptStats[deptKey];
                    const Icon = st.icon;

                    return (
                      <div
                        key={deptKey}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{st.label}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono-numbers">
                            {st.count} مبيعات
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-xs text-slate-500 dark:text-slate-400">إجمالي المبيعات:</span>
                          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                            {st.amount.toLocaleString('ar-EG')} ج.م
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Branch Contact Details Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-3">
                <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>معلومات التواصل والإدارة في الفرع:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">مدير الفرع المعتمد:</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">
                      {branch.managerName || 'غير مخصص'}
                    </strong>
                    {managerObj && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-numbers block mt-0.5">
                        هاتف: {managerObj.phone}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">هاتف المعرض والفرع:</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm mt-0.5 font-mono-numbers block">
                      {branch.phone}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">العنوان والموقع:</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                      {branch.city} - {branch.address}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEAMS AND STAFF */}
          {activeTab === 'teams_staff' && (
            <div className="space-y-6">
              {/* Teams Section */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>فرق العمل والميدان بالفرع ({branchTeams.length}):</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {branchTeams.length === 0 ? (
                    <div className="p-4 text-slate-400 dark:text-slate-500 text-xs sm:col-span-2 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      لا توجد فرق عمل مسجلة بهذا الفرع حالياً
                    </div>
                  ) : (
                    branchTeams.map((tm) => (
                      <div key={tm.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{tm.name}</div>
                        <div className="text-slate-600 dark:text-slate-300">المشرف: <strong>{tm.supervisorName || 'غير معين'}</strong></div>
                        <div className="text-slate-600 dark:text-slate-300">قائد الفريق: <strong className="text-indigo-600 dark:text-indigo-400">{tm.leaderName || 'غير معين'}</strong></div>
                        <div className="text-slate-500 dark:text-slate-400 font-mono-numbers text-[11px]">عدد الأعضاء: {tm.memberIds.length} موظف</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Staff Table */}
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>موظفو ومسؤولو مبيعات الفرع ({branchStaff.length}):</span>
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right dir-ltr:text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">اسم الموظف</th>
                        <th className="p-3">الدور المخصص</th>
                        <th className="p-3">رقم الهاتف</th>
                        <th className="p-3">الفريق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {branchStaff.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                            لا يوجد موظفون مخصصون لهذا الفرع
                          </td>
                        </tr>
                      ) : (
                        branchStaff.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                            <td className="p-3 font-semibold text-indigo-600 dark:text-indigo-400">{t(`role.${u.role}`)}</td>
                            <td className="p-3 font-mono-numbers text-slate-700 dark:text-slate-300">{u.phone}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{u.teamName || 'غير معين'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENTS TABLE */}
          {activeTab === 'clients' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  سجل عملاء {branch.name} ({branchLeads.length})
                </h3>

                {onAddClientForBranch && (
                  <button
                    onClick={() => {
                      onClose();
                      onAddClientForBranch(branch.id);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    + إضافة عميل للفرع
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right dir-ltr:text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">الهاتف والواتس</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">المسؤول</th>
                      <th className="p-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {branchLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                          لا يوجد عملاء مسجلون في هذا الفرع بعد
                        </td>
                      </tr>
                    ) : (
                      branchLeads.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{l.name}</td>
                          <td className="p-3 font-mono-numbers">
                            <div className="text-slate-800 dark:text-slate-200">{l.phone}</div>
                            {l.whatsappPhone && (
                              <a
                                href={`https://wa.me/20${l.whatsappPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                              >
                                💬 واتس: {l.whatsappPhone}
                              </a>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {t(`status.${l.status}`)}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{l.assignedAgentName || 'عام'}</td>
                          <td className="p-3 text-center">
                            {onOpenLead && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenLead(l.id);
                                }}
                                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded font-semibold text-xs cursor-pointer"
                              >
                                الملف
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CONFIRMED SALES / BOOKINGS */}
          {activeTab === 'sales' && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                سجل عمليات البيع المؤكدة في {branch.name} ({branchBookings.length})
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-right dir-ltr:text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">العميل</th>
                      <th className="p-3">القيمة والأسعار (ج.م)</th>
                      <th className="p-3">المسؤول البائع</th>
                      <th className="p-3">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {branchBookings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                          لا توجد مبيعات مؤكدة مسجلة بهذا الفرع حتى الآن
                        </td>
                      </tr>
                    ) : (
                      branchBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{b.leadName}</td>
                          <td className="p-3 font-mono-numbers font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {b.amount.toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{b.agentName}</td>
                          <td className="p-3 font-mono-numbers text-slate-500 dark:text-slate-400">{b.bookingDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
