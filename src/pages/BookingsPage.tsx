import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, Search, PlusCircle, TrendingUp, CheckCircle, CreditCard, Eye } from 'lucide-react';

interface BookingsPageProps {
  onOpenLead: (leadId: string) => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ onOpenLead }) => {
  const { effectiveUser, bookings, branches, courses } = useCRM();
  const { t } = useLanguage();

  const role = effectiveUser.role;

  const [searchQuery, setSearchQuery] = useState('');

  // Scoped bookings
  const scopedBookings = bookings.filter((b) => {
    if (role === 'admin') return true;
    if (role === 'branch_manager' || role === 'supervisor') return b.branchId === effectiveUser.branchId;
    if (role === 'team_leader') return b.branchId === effectiveUser.branchId;
    return b.agentId === effectiveUser.id;
  });

  const totalRevenue = scopedBookings.reduce((sum, b) => sum + b.amount, 0);

  const filteredBookings = scopedBookings.filter((b) => {
    const matchesSearch =
      b.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.leadPhone.includes(searchQuery) ||
      b.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>إدارة الحجوزات والمبيعات المؤكدة</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة الاشتراكات والدبلومات المسجلة وإيرادات المبيعات
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-2xl flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold">إجمالي المبيعات المحققة</div>
            <div className="text-base font-bold text-emerald-900 dark:text-emerald-200 font-mono-numbers">
              {totalRevenue.toLocaleString('ar-EG')} ج.م
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 dir-ltr:right-auto dir-ltr:left-3 top-2.5" />
            <input
              type="text"
              placeholder="البحث باسم العميل أو الكورس أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 dir-ltr:pr-3 dir-ltr:pl-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right dir-ltr:text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">اسم العميل</th>
                <th className="p-3.5">الهاتف</th>
                <th className="p-3.5">الكورس / البرنامج</th>
                <th className="p-3.5">القيمة (ج.م)</th>
                <th className="p-3.5">حالة الدفع</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">مسؤول البيع</th>
                <th className="p-3.5">تاريخ الحجز</th>
                <th className="p-3.5 text-center">الإجراء</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    لا توجد حجوزات مؤكدة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{b.leadName}</td>
                    <td className="p-3.5 font-mono-numbers text-slate-700 dark:text-slate-300">{b.leadPhone}</td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">{b.courseName}</td>
                    <td className="p-3.5 font-mono-numbers font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {b.amount.toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {b.paymentStatus === 'deposit' ? 'مقدم حجز' : b.paymentStatus === 'full' ? 'سداد كامل' : 'معلق'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{b.branchName}</td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">{b.agentName}</td>
                    <td className="p-3.5 font-mono-numbers text-slate-500 dark:text-slate-400">{b.bookingDate}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onOpenLead(b.leadId)}
                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        سجل العميل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
