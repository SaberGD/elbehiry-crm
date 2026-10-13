import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Lead, LeadStatus, LeadSource } from '../types/crm';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Phone,
  Calendar,
  Building2,
  ChevronDown,
  Eye,
  Share2,
  Trash2,
  Download,
  CheckSquare,
  Square,
  PhoneCall,
  PlusCircle,
} from 'lucide-react';

interface LeadsPageProps {
  onOpenLead: (leadId: string) => void;
  onNavigateAddLead: () => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ onOpenLead, onNavigateAddLead }) => {
  const { effectiveUser, leads, branches, users, courses, reassignLead, deleteLead } = useCRM();
  const { t } = useLanguage();

  const role = effectiveUser.role;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selected Leads for mass reassign
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [massAgentId, setMassAgentId] = useState('');
  const [showMassReassign, setShowMassReassign] = useState(false);

  // Scoped Leads according to user role
  const scopedLeads = leads.filter((l) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return l.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return l.branchId === effectiveUser.branchId && l.teamId === effectiveUser.teamId;
    return l.assignedAgentId === effectiveUser.id;
  });

  // Filtered Leads
  const filteredLeads = scopedLeads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      (l.whatsappPhone && l.whatsappPhone.includes(searchQuery)) ||
      (l.courseOfInterest && l.courseOfInterest.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || l.status === selectedStatus;
    const matchesBranch = selectedBranch === 'all' || l.branchId === selectedBranch;
    const matchesAgent = selectedAgent === 'all' || l.assignedAgentId === selectedAgent;
    const matchesSource = selectedSource === 'all' || l.source === selectedSource;
    const matchesCategory = selectedCategory === 'all' || l.customerCategory === selectedCategory;

    return matchesSearch && matchesStatus && matchesBranch && matchesAgent && matchesSource && matchesCategory;
  });

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleMassReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!massAgentId || selectedLeadIds.length === 0) return;

    selectedLeadIds.forEach((id) => {
      reassignLead(id, massAgentId);
    });

    setSelectedLeadIds([]);
    setShowMassReassign(false);
  };

  const exportCSV = () => {
    const headers = 'اسم العميل,الهاتف,الحالة,الفرع,المسؤول,المصدر,الاهتمام,المتابعة القادمة\n';
    const rows = filteredLeads
      .map(
        (l) =>
          `"${l.name}","${l.phone}","${l.status}","${l.branchName || ''}","${l.assignedAgentName || ''}","${l.source}","${l.courseOfInterest}","${l.nextFollowUpDate || ''}"`
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `almasar_crm_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#abcae9]" />
            <span>إدارة العملاء والفرص البيعية</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            عرض وتصنيف كافة العملاء المتاحين ضمن نطاق صلاحياتك ({filteredLeads.length} عميل)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={onNavigateAddLead}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#1a212e] dark:hover:bg-[#252f42] border border-slate-600/30 dark:border-white/15 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <UserPlus className="w-4 h-4 text-[#abcae9]" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 dir-ltr:right-auto dir-ltr:left-3 top-2.5" />
            <input
              type="text"
              placeholder="البحث باسم العميل، الهواتف، أو الكورس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 dir-ltr:pr-3 dir-ltr:pl-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium outline-none"
            >
              <option value="all">كافة الحالات</option>
              <option value="new">جديد</option>
              <option value="uncontacted">لم يتم التواصل</option>
              <option value="contacted">تم التواصل</option>
              <option value="interested">مهتم</option>
              <option value="prospect">محتمل</option>
              <option value="needs_followup">يحتاج متابعة</option>
              <option value="not_interested">غير مهتم</option>
              <option value="booked">تم الحجز</option>
            </select>
          </div>

          {/* Branch Filter */}
          {(role === 'admin' || role === 'branch_manager') && (
            <div>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium outline-none"
              >
                <option value="all">كافة الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Agent Filter */}
          <div>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium outline-none"
            >
              <option value="all">كافة الموظفين</option>
              {users
                .filter((u) => u.role === 'sales_agent' || u.role === 'team_leader')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Customer Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium outline-none"
            >
              <option value="all">كافة تصنيفات العملاء</option>
              <option value="individual">عميل فردي</option>
              <option value="engineering_company">شركة هندسية</option>
              <option value="decor_company">شركة تصميم وديكور</option>
              <option value="contractor">مقاول تنفيذ</option>
              <option value="engineer">مهندس استشاري / حر</option>
              <option value="painter">فني دهانات / نقاش</option>
              <option value="technician">فني / عامل</option>
              <option value="broker_individual">سمسار / وسيط فردي</option>
              <option value="broker_company">شركة وساطة عقارية</option>
            </select>
          </div>
        </div>

        {/* Mass Action Controls */}
        {selectedLeadIds.length > 0 && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-4 animate-in fade-in duration-150 flex-wrap">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              تم تحديد {selectedLeadIds.length} عميل
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMassReassign(!showMassReassign)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>إعادة توزيع المحدد</span>
              </button>
            </div>
          </div>
        )}

        {/* Mass Reassign Modal/Form */}
        {showMassReassign && (
          <form
            onSubmit={handleMassReassign}
            className="p-3 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center gap-3 animate-in fade-in flex-wrap"
          >
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">نقل المحدد إلى:</span>
            <select
              value={massAgentId}
              onChange={(e) => setMassAgentId(e.target.value)}
              required
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              <option value="">اختر مسؤول المبيعات...</option>
              {users
                .filter((u) => u.role === 'sales_agent')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.branchName || 'فرع عام'})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              تنفيذ النقل
            </button>
            <button
              type="button"
              onClick={() => setShowMassReassign(false)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              إلغاء
            </button>
          </form>
        )}
      </div>

      {/* Leads Main Table */}
      <div className="glass-card rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right dir-ltr:text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                    {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">{t('th.name')}</th>
                <th className="p-3.5">{t('th.phone')}</th>
                <th className="p-3.5">{t('th.status')}</th>
                <th className="p-3.5">{t('th.interest')}</th>
                <th className="p-3.5">{t('th.branch')}</th>
                <th className="p-3.5">{t('th.assigned_to')}</th>
                <th className="p-3.5">{t('th.next_followup')}</th>
                <th className="p-3.5 text-center">{t('th.actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    لا توجد سجلات عملاء مطابقة للبحث الحالي
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <button onClick={() => toggleSelectLead(lead.id)} className="text-slate-400 hover:text-slate-700">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => onOpenLead(lead.id)}
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-right dir-ltr:text-left transition-colors cursor-pointer block"
                        >
                          {lead.name}
                        </button>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">المصدر: {lead.source}</span>
                      </td>

                      <td className="p-3.5 font-mono-numbers font-medium text-slate-700 dark:text-slate-300">
                        {lead.phone}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            lead.status === 'booked'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : lead.status === 'interested'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : lead.status === 'needs_followup'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {t(`status.${lead.status}`)}
                        </span>
                      </td>

                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {lead.courseOfInterest}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{lead.branchName || 'عام'}</td>

                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                        {lead.assignedAgentName || 'غير مخصص'}
                      </td>

                      <td className="p-3.5 font-mono-numbers font-semibold text-indigo-700 dark:text-indigo-400">
                        {lead.nextFollowUpDate || '—'}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onOpenLead(lead.id)}
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          التفاصيل
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
  );
};
