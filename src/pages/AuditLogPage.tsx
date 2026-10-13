import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Search, ShieldAlert, Clock } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useCRM();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>سجل العمليات والرقابة الإدارية (Audit Log)</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تسجيل لكافة إجراءات التعديل والتخصيص والحذف والعمليات المنفذة في النظام
        </p>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 dir-ltr:right-auto dir-ltr:left-3 top-2.5" />
            <input
              type="text"
              placeholder="البحث بالعملية، اسم المستخدم، أو التفاصيل..."
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
                <th className="p-3.5">الوقت والتاريخ</th>
                <th className="p-3.5">المستخدم</th>
                <th className="p-3.5">الدور الوظيفي</th>
                <th className="p-3.5">العملية المنفذة</th>
                <th className="p-3.5">تفاصيل الإجراء</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    لا توجد سجلات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono-numbers text-indigo-700 dark:text-indigo-400 font-semibold">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{log.userName}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">{t(`role.${log.userRole}`)}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-md truncate">{log.details}</td>
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
