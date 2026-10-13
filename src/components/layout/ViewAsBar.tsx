import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, XCircle, ShieldCheck } from 'lucide-react';

export const ViewAsBar: React.FC = () => {
  const { viewAsUser, setViewAsUser, currentUser } = useCRM();
  const { t } = useLanguage();

  if (!viewAsUser) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md flex items-center justify-between gap-4 sticky top-0 z-50 border-b border-amber-700">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="flex h-2 w-2 rounded-full bg-amber-200 animate-pulse shrink-0" />
        <Eye className="w-4 h-4 shrink-0 text-amber-100" />
        <div className="truncate">
          <span className="font-bold">{t('app.view_as_active')}: </span>
          <span className="bg-amber-700 px-2 py-0.5 rounded text-amber-100 font-semibold mx-1">
            {viewAsUser.name} ({t(`role.${viewAsUser.role}`)})
          </span>
          <span className="hidden md:inline text-amber-100/90 text-xs mr-2">
            · {currentUser.name} (الصلاحيات الأصلية محفوظة وآمنة)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setViewAsUser(null)}
          className="flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900 text-amber-100 px-3 py-1 rounded-md text-xs font-semibold transition-colors shadow-xs border border-amber-500/40 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>{t('app.exit_view_as')}</span>
        </button>
      </div>
    </div>
  );
};
