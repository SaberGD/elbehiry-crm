import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { useLanguage } from '../../context/LanguageContext';
import { LayoutDashboard, Users, PhoneCall, UserPlus, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  setSidebarOpen,
}) => {
  const { followUps, effectiveUser } = useCRM();
  const { t } = useLanguage();

  const myFollowups = followUps.filter((f) => {
    if (effectiveUser.role === 'sales_agent') return f.assignedAgentId === effectiveUser.id;
    return f.branchId === effectiveUser.branchId;
  });
  const urgentCount = myFollowups.filter((f) => f.status === 'overdue' || f.status === 'due').length;

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 liquid-glass-dock rounded-2xl py-2 px-3 flex items-center justify-around shadow-2xl transition-all">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl min-w-[50px] min-h-[42px] cursor-pointer transition-all active:scale-95 ${
          activeTab === 'dashboard' || activeTab === 'dept_dashboard'
            ? 'bg-slate-800 dark:bg-[#151a26] text-white dark:text-[#7295b3] shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <LayoutDashboard className="w-4.5 h-4.5" />
        <span className="text-[10px] truncate font-medium">الرئيسية</span>
      </button>

      <button
        onClick={() => setActiveTab('clients')}
        className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl min-w-[50px] min-h-[42px] cursor-pointer transition-all active:scale-95 ${
          activeTab === 'clients'
            ? 'bg-slate-800 dark:bg-[#151a26] text-white dark:text-[#7295b3] shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Users className="w-4.5 h-4.5" />
        <span className="text-[10px] truncate font-medium">العملاء</span>
      </button>

      <button
        onClick={() => setActiveTab('add_client')}
        className="flex flex-col items-center justify-center gap-1 p-1 rounded-xl text-white bg-slate-800 dark:bg-[#1a212e] hover:bg-slate-700 min-w-[44px] h-[42px] shadow-sm cursor-pointer active:scale-90 border border-slate-600/30 dark:border-white/20"
        title="إضافة عميل"
      >
        <UserPlus className="w-4.5 h-4.5 text-[#7295b3]" />
      </button>

      <button
        onClick={() => setActiveTab('followups')}
        className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl min-w-[50px] min-h-[42px] cursor-pointer relative transition-all active:scale-95 ${
          activeTab === 'followups' || activeTab === 'due_followups' || activeTab === 'overdue_followups'
            ? 'bg-slate-800 dark:bg-[#151a26] text-white dark:text-[#7295b3] shadow-xs font-bold'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <PhoneCall className="w-4.5 h-4.5" />
        <span className="text-[10px] truncate font-medium">المتابعات</span>
        {urgentCount > 0 && (
          <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse border border-white" />
        )}
      </button>

      <button
        onClick={() => setSidebarOpen(true)}
        className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl min-w-[50px] min-h-[42px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-95 transition-all"
      >
        <Menu className="w-4.5 h-4.5" />
        <span className="text-[10px] truncate font-medium">القائمة</span>
      </button>
    </div>
  );
};
