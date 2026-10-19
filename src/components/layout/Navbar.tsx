import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ElBeheryLogo } from '../common/ElBeheryLogo';
import {
  Menu,
  X,
  Search,
  ChevronDown,
  UserCheck,
  LogOut,
  Bell,
  CheckCheck,
  Calendar,
  Compass,
  ShoppingBag,
  Eye,
  Sun,
  Moon,
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen, activeView }) => {
  const {
    currentUser,
    logout,
    viewAsUser,
    setViewAsUser,
    effectiveUser,
    users,
    notifications,
    markNotificationRead,
    clearAllNotifications,
  } = useCRM();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showViewAsModal, setShowViewAsModal] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Auto-apply font preferences from localStorage
  useEffect(() => {
    try {
      const storageKey = `elbehery_font_prefs_${effectiveUser.id || 'default'}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = JSON.parse(saved);
        const root = document.documentElement;
        if (p.fontSize) root.style.setProperty('--app-font-size', `${p.fontSize}px`);
        if (p.fontFamily) root.style.setProperty('--app-font-family', p.fontFamily);
        if (p.fontWeight) root.style.setProperty('--app-font-weight', p.fontWeight);
      }
    } catch {
      // fallback
    }
  }, [effectiveUser.id]);

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-40 h-16 sm:h-20 liquid-glass-dock transition-all px-3 sm:px-6">
      <div className="h-full w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* Left / Start Zone: Menu Toggle & Global Search */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-700 dark:text-[#c3c7cd] hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#131722] dark:hover:bg-[#1f2536] rounded-xl lg:hidden transition-all cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center border border-slate-200 dark:border-white/10 shrink-0"
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a href="#" className="block lg:hidden shrink-0">
            <ElBeheryLogo size="sm" showText={false} />
          </a>

          {/* Global Search Input */}
          <div className="relative hidden md:block w-64 lg:w-80 xl:w-96 min-w-0">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#8d9197] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="بحث شامل في سجلات البحيري CRM..."
              className="w-full h-9 sm:h-10 pr-9 pl-3 bg-slate-100 dark:bg-[#131722] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-[#dfe2ee] placeholder-slate-400 dark:placeholder-[#8d9197] text-xs focus:outline-none focus:border-slate-400 dark:focus:border-[#7295b3] transition-colors"
            />
          </div>
        </div>

        {/* Right Zone: Controls, Theme Toggle, Notifications, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Admin "View As" Role Switcher Trigger */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setShowViewAsModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#7295b3]/10 dark:hover:bg-[#7295b3]/20 text-slate-700 dark:text-[#7295b3] text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#7295b3]/30 transition-all cursor-pointer h-9 sm:h-10 shadow-xs"
              title="معاينة النظام بصلاحية موظف آخر"
            >
              <Eye className="w-4 h-4 text-slate-600 dark:text-[#7295b3]" />
              <span className="hidden sm:inline">معاينة (View As)</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-[#181c24] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-[#c3c7cd] hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-[#262a33] transition-all cursor-pointer shrink-0"
            title="تبديل وضع الألوان (Dark / Light)"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationsMenu(!showNotificationsMenu);
                setShowAccountMenu(false);
              }}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-[#181c24] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-[#c3c7cd] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#262a33] transition-all cursor-pointer shrink-0"
              title="الإشعارات والتنبيهات الحية"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#0f131b] animate-pulse" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotificationsMenu && (
              <div
                className="liquid-glass-popover absolute left-0 rtl:left-0 rtl:right-auto ltr:right-0 ltr:left-auto top-full mt-3 w-80 sm:w-96 rounded-xl p-4 z-50 animate-liquid-pop"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pb-3 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#dfe2ee] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#abcae9]" />
                      <span>تنبيهات السجلات والتسويات</span>
                    </h4>
                    <p className="text-[11px] text-[#8d9197]">تحديثات مالية وإدارية فورية</p>
                  </div>
                  {unreadNotifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-[#abcae9] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto px-1 py-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8d9197] font-medium">لا توجد تنبيهات جديدة حالياً</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 rounded-lg text-xs transition-all cursor-pointer border ${
                          !n.read
                            ? 'bg-[#abcae9]/10 border-[#abcae9]/30 text-[#dfe2ee]'
                            : 'bg-[#181c24] border-white/5 text-[#8d9197] hover:bg-[#262a33]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-[#dfe2ee] flex items-center gap-1.5">
                            {n.type === 'visit' && <Compass className="w-3.5 h-3.5 text-[#e9c349]" />}
                            {n.type === 'booking' && <ShoppingBag className="w-3.5 h-3.5 text-[#97d0d6]" />}
                            {n.type === 'followup' && <Calendar className="w-3.5 h-3.5 text-[#abcae9]" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[#8d9197] font-mono dir-ltr">{n.dueDate}</span>
                        </div>
                        <p className="text-[#c3c7cd] leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Executive User Profile Block */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 bg-[#181c24] hover:bg-[#262a33] rounded-lg border border-white/10 transition-all cursor-pointer h-10"
            >
              <div className="w-8 h-8 rounded-full bg-[#abcae9] text-[#12334c] flex items-center justify-center font-bold text-sm shrink-0">
                {effectiveUser.name.charAt(0)}
              </div>
              <div className="hidden lg:flex flex-col text-right">
                <span className="font-bold text-xs text-[#dfe2ee] leading-tight line-clamp-1">
                  م. {effectiveUser.name}
                </span>
                <span className="text-[10px] text-[#8d9197] font-normal leading-none mt-0.5">
                  {t(`role.${effectiveUser.role}`)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8d9197]" />
            </button>

            {/* Account Switcher Popover Menu */}
            {showAccountMenu && (
              <div
                className="liquid-glass-popover absolute left-0 rtl:left-0 rtl:right-auto ltr:right-0 ltr:left-auto top-full mt-3 w-72 rounded-xl p-2 z-50 animate-liquid-pop"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-[#dfe2ee]">الحساب الحالي المعتمد</p>
                  <p className="text-xs text-[#8d9197] truncate">{currentUser.email}</p>
                </div>

                <div className="px-1 pt-2">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      logout();
                    }}
                    className="w-full text-right px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin "View As" Modal Selector */}
      {showViewAsModal && (
        <div className="fixed inset-0 bg-[#0a0e16]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181c24] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10 text-[#dfe2ee]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2 text-[#abcae9] font-bold text-base">
                <Eye className="w-5 h-5 text-[#abcae9]" />
                <span>خاصية المعاينة التنفيذية (View As)</span>
              </div>
              <button
                onClick={() => setShowViewAsModal(false)}
                className="text-[#8d9197] hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#c3c7cd] mb-4 leading-relaxed">
              اختر أي مستخدم لمعاينة القوائم واللوحات الخاصة بصلاحياته بالضبط.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {users
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setViewAsUser(u);
                      setShowViewAsModal(false);
                    }}
                    className="w-full text-right dir-ltr:text-left p-3 rounded-xl border border-white/10 hover:border-[#abcae9]/50 hover:bg-[#262a33] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#dfe2ee] group-hover:text-[#abcae9]">{u.name}</div>
                      <div className="text-[11px] text-[#8d9197] font-medium">
                        {t(`role.${u.role}`)} {u.branchName ? `· ${u.branchName}` : ''}
                      </div>
                    </div>
                    <span className="text-xs text-[#abcae9] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      معاينة ←
                    </span>
                  </button>
                ))}
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowViewAsModal(false)}
                className="px-4 py-2 bg-[#262a33] text-[#dfe2ee] rounded-xl text-xs font-semibold hover:bg-[#31353e] transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
