import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { useLanguage } from '../../context/LanguageContext';
import { ElBeheryLogo } from '../common/ElBeheryLogo';
import {
  Users,
  Building2,
  GitBranch,
  PhoneCall,
  ShoppingBag,
  BarChart3,
  ShieldCheck,
  Settings,
  UserPlus,
  Compass,
  FileText,
  UserCheck2,
  FolderOpen,
  X,
  PieChart,
  Layers,
  Award,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  badgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { effectiveUser, followUps } = useCRM();
  const { t } = useLanguage();

  const getNavItems = (): NavItem[] => {
    const role = effectiveUser.role;

    const myFollowups = followUps.filter((f) => {
      if (role === 'sales_agent') return f.assignedAgentId === effectiveUser.id;
      if (role === 'team_leader' || role === 'branch_manager') return f.branchId === effectiveUser.branchId;
      return true;
    });

    const overdueCount = myFollowups.filter((f) => f.status === 'overdue').length;

    if (role === 'admin' || role === 'general_manager' || role === 'regional_manager') {
      return [
        { id: 'dept_dashboard', labelKey: 'nav.dept_dashboard', icon: Layers },
        { id: 'analytics_dashboard', labelKey: 'nav.analytics_dashboard', icon: PieChart },
        { id: 'clients', labelKey: 'nav.all_clients', icon: Users },
        { id: 'visits', labelKey: 'nav.visits_inquiries', icon: Compass },
        { id: 'followups', labelKey: 'nav.followups', icon: PhoneCall, badgeCount: overdueCount > 0 ? overdueCount : undefined },
        { id: 'bookings', labelKey: 'nav.bookings', icon: ShoppingBag },
        { id: 'invoices', labelKey: 'nav.invoices', icon: FileText },
        { id: 'brokers', labelKey: 'nav.brokers', icon: FolderOpen },
        { id: 'users', labelKey: 'nav.users_staff', icon: UserCheck2 },
        { id: 'branches', labelKey: 'nav.branches', icon: Building2 },
        { id: 'teams', labelKey: 'nav.teams', icon: GitBranch },
        { id: 'reports', labelKey: 'nav.reports', icon: BarChart3 },
        { id: 'audit', labelKey: 'nav.audit_log', icon: ShieldCheck },
        { id: 'settings', labelKey: 'nav.settings', icon: Settings },
      ];
    }

    if (role === 'branch_manager') {
      return [
        { id: 'dept_dashboard', labelKey: 'nav.dept_dashboard', icon: Layers },
        { id: 'analytics_dashboard', labelKey: 'nav.analytics_dashboard', icon: PieChart },
        { id: 'clients', labelKey: 'nav.branch_clients', icon: Users },
        { id: 'visits', labelKey: 'nav.visits_inquiries', icon: Compass },
        { id: 'followups', labelKey: 'nav.followups', icon: PhoneCall, badgeCount: overdueCount > 0 ? overdueCount : undefined },
        { id: 'bookings', labelKey: 'nav.bookings', icon: ShoppingBag },
        { id: 'invoices', labelKey: 'nav.invoices', icon: FileText },
        { id: 'users', labelKey: 'nav.users_staff', icon: UserCheck2 },
        { id: 'teams', labelKey: 'nav.teams', icon: GitBranch },
        { id: 'reports', labelKey: 'nav.reports', icon: BarChart3 },
        { id: 'settings', labelKey: 'nav.settings', icon: Settings },
      ];
    }

    return [
      { id: 'dept_dashboard', labelKey: 'nav.dept_dashboard', icon: Layers },
      { id: 'analytics_dashboard', labelKey: 'nav.analytics_dashboard', icon: PieChart },
      { id: 'clients', labelKey: 'nav.my_clients', icon: Users },
      { id: 'add_client', labelKey: 'nav.add_client', icon: UserPlus },
      { id: 'record_visit', labelKey: 'nav.record_visit', icon: Compass },
      { id: 'followups', labelKey: 'nav.my_followups', icon: PhoneCall, badgeCount: overdueCount > 0 ? overdueCount : undefined },
      { id: 'bookings', labelKey: 'nav.bookings', icon: ShoppingBag },
      { id: 'invoices', labelKey: 'nav.invoices', icon: FileText },
      { id: 'reports', labelKey: 'nav.my_performance', icon: Award },
      { id: 'settings', labelKey: 'nav.settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-[#080b10]/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Rail */}
      <aside
        className={`fixed top-0 bottom-0 right-0 rtl:right-0 rtl:left-auto ltr:left-0 ltr:right-auto z-50 liquid-glass-sidebar flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:translate-x-0 ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${sidebarOpen ? 'translate-x-0' : 'translate-x-full ltr:-translate-x-full'}`}
      >
        {/* Sidebar Brand Header - Click logo to collapse/expand */}
        <div className={`h-16 sm:h-20 flex items-center border-b border-slate-200 dark:border-white/10 shrink-0 transition-all ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}>
          <div
            onClick={toggleCollapse}
            title={isCollapsed ? 'انقر لتكبير القائمة' : 'انقر لطي القائمة إلى أيقونات'}
            className="cursor-pointer group flex items-center gap-2"
          >
            <ElBeheryLogo size="md" showText={!isCollapsed} />
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCollapse}
                title="طي القائمة الجانبية إلى أيقونات"
                className="hidden lg:flex p-1.5 text-slate-500 dark:text-[#8a94a6] hover:text-slate-900 dark:hover:text-[#7295b3] hover:bg-slate-100 dark:hover:bg-[#181d2a] rounded-xl transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-500 dark:text-[#8a94a6] hover:text-slate-900 dark:hover:text-white rounded-xl lg:hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              title="توسيع القائمة الجانبية"
              className="hidden lg:flex p-1.5 text-slate-500 dark:text-[#8a94a6] hover:text-slate-900 dark:hover:text-[#7295b3] hover:bg-slate-100 dark:hover:bg-[#181d2a] rounded-xl transition-colors cursor-pointer mt-1"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          )}
        </div>

        {/* Section Title */}
        {!isCollapsed && (
          <div className="px-5 py-2.5 text-[10px] font-bold text-slate-400 dark:text-[#8a94a6] uppercase tracking-widest font-mono">
            بوابة الأعمال · CRM
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const labelText = t(item.labelKey);

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                title={isCollapsed ? labelText : undefined}
                className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[42px] relative group ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-slate-100 dark:bg-[#151a26] text-slate-900 dark:text-[#7295b3] shadow-xs border-r-2 border-slate-700 dark:border-[#7295b3]'
                    : 'text-slate-600 dark:text-[#c3c7cd] hover:bg-slate-100/80 dark:hover:bg-[#141824] hover:text-slate-900 dark:hover:text-[#e2e8f0]'
                }`}
              >
                <div className={`flex items-center gap-3 truncate ${isCollapsed ? 'justify-center' : ''}`}>
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-slate-900 dark:text-[#7295b3]' : 'text-slate-400 dark:text-[#8a94a6] group-hover:text-slate-800 dark:group-hover:text-[#e2e8f0]'}`} />
                  {!isCollapsed && <span className="truncate">{labelText}</span>}
                </div>

                {/* Overdue Notification Badge */}
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#d9b438] text-[#241a00] ${
                      isCollapsed ? 'absolute -top-1 -right-1 shadow-md' : ''
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}

                {/* Hover Tooltip when Collapsed */}
                {isCollapsed && (
                  <div className="absolute right-full rtl:right-full rtl:left-auto ltr:left-full ltr:right-auto mr-2 rtl:mr-2 ltr:ml-2 px-2.5 py-1 bg-[#181d2a] text-[#e2e8f0] text-xs font-semibold rounded-md shadow-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap hidden lg:block">
                    {labelText}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Executive Scope / Tier Footer */}
        <div className={`p-3 border-t border-white/10 bg-[#080b10]/40 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#181d2a] border border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d9b438] text-[20px]">shield_with_house</span>
                <div className="flex flex-col text-right">
                  <span className="font-bold text-xs text-[#e2e8f0]">صلاحية عليا</span>
                  <span className="text-[10px] text-[#8a94a6] font-mono">Enterprise Tier</span>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#d9b438] ring-2 ring-[#d9b438]/20 animate-pulse" />
            </div>
          ) : (
            <div
              title="صلاحية عليا - Enterprise Tier"
              className="w-10 h-10 rounded-lg bg-[#181d2a] border border-white/10 flex items-center justify-center text-[#d9b438]"
            >
              <span className="material-symbols-outlined text-[20px]">shield_with_house</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
