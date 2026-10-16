import { canManageCatalog } from '../lib/access';
import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { BrokerEntity } from '../types/crm';
import {
  Users,
  Plus,
  Search,
  Building,
  Briefcase,
  DollarSign,
  TrendingUp,
  Percent,
  Phone,
  FileText,
  Award,
  BarChart3,
  CheckCircle2,
  X,
  ChevronLeft,
} from 'lucide-react';

export const BrokersPage: React.FC = () => {
  const { brokers, purchaseInvoices, leads, addBroker, updateBroker, effectiveUser } = useCRM();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerEntity | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<BrokerEntity['type']>('engineering_company');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isSameWhatsApp, setIsSameWhatsApp] = useState(true);
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [commissionRate, setCommissionRate] = useState(5);
  const [notes, setNotes] = useState('');

  // Calculations for referral analytics
  const totalVolumeAllBrokers = brokers.reduce((sum, b) => sum + b.totalVolume, 0);
  const totalReferralsAllBrokers = brokers.reduce((sum, b) => sum + b.totalReferrals, 0);
  const totalCommissionEstAllBrokers = brokers.reduce((sum, b) => sum + (b.totalVolume * (b.commissionRate / 100)), 0);

  // Filtered Brokers
  const filteredBrokers = brokers.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone.includes(searchTerm) ||
      (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = typeFilter === 'all' || b.type === typeFilter;

    return matchSearch && matchType;
  });

  const handleOpenAddModal = () => {
    setEditingBroker(null);
    setName('');
    setType('engineering_company');
    setPhone('');
    setWhatsappPhone('');
    setIsSameWhatsApp(true);
    setEmail('');
    setTaxNumber('');
    setAddress('');
    setCommissionRate(5);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: BrokerEntity) => {
    setEditingBroker(b);
    setName(b.name);
    setType(b.type);
    setPhone(b.phone);
    setWhatsappPhone(b.whatsappPhone || b.phone);
    setIsSameWhatsApp(b.isSameWhatsApp ?? true);
    setEmail(b.email || '');
    setTaxNumber(b.taxNumber || '');
    setAddress(b.address || '');
    setCommissionRate(b.commissionRate);
    setNotes(b.notes || '');
    setIsModalOpen(true);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (isSameWhatsApp) {
      setWhatsappPhone(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalWhatsapp = isSameWhatsApp ? phone : (whatsappPhone || phone);

    if (editingBroker) {
      updateBroker(editingBroker.id, {
        name,
        type,
        phone,
        whatsappPhone: finalWhatsapp,
        isSameWhatsApp,
        email,
        taxNumber,
        address,
        commissionRate,
        notes,
      });
    } else {
      addBroker({
        name,
        type,
        phone,
        whatsappPhone: finalWhatsapp,
        isSameWhatsApp,
        email,
        taxNumber,
        address,
        commissionRate,
        active: true,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-[#1d1d1c] dark:bg-[#0c0f17] text-[#f0efea] p-5 sm:p-6 rounded-2xl shadow-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/10">
            شراكات ومصادر الترشيح والعمولات
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#dc424b]" />
            <span>إدارة الوسطاء والمكاتب الهندسية والتحليلات</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            متابعة المكاتب الهندسية، شركات المقاولات، والوسطاء العقاريين، احتساب نسبة العمولة % وحجم التحويلات والمبيعات الإجمالية الناتجة عن ترشيحاتهم.
          </p>
        </div>

        {canManageCatalog(effectiveUser) && (<button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#292928] dark:hover:bg-[#343431] rounded-xl text-xs font-bold transition-all border border-slate-600/30 dark:border-white/15 cursor-pointer flex items-center gap-1.5 min-h-[44px] shadow-sm"
        >
          <Plus className="w-4 h-4 text-[#dc424b]" />
          <span>+ إضافة وسيط / جهة ترشيح جديدة</span>
        </button>)}
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>إجمالي الوسطاء المسجلين</span>
            <Users className="w-4 h-4 text-[#c8232b]" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono-numbers">
            {brokers.length} <span className="text-xs font-normal text-slate-400">جهة</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>إجمالي العملاء الموردين</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono-numbers">
            {totalReferralsAllBrokers} <span className="text-xs font-normal text-slate-400">عميل</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>حجم المبيعات والتوريدات (EGP)</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono-numbers">
            {totalVolumeAllBrokers.toLocaleString()} ج.م
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>تقدير مستحقات العمولات</span>
            <Percent className="w-4 h-4 text-[#c8232b]" />
          </div>
          <div className="text-xl font-bold text-[#c8232b] dark:text-[#c8232b] mt-1 font-mono-numbers">
            {totalCommissionEstAllBrokers.toLocaleString()} ج.م
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 dir-ltr:right-auto dir-ltr:left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالاسم، الهاتف، أو الوصف..."
            className="w-full pr-9 dir-ltr:pr-3 dir-ltr:pl-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold"
        >
          <option value="all">كافة أنواع الوسطاء</option>
          <option value="engineering_company">شركة استشارات هندسية</option>
          <option value="contractor">شركة مقاولات وتنفيذ</option>
          <option value="individual">وسيط فردي / استشاري</option>
          <option value="company">شركة وساطة عقارية</option>
        </select>
      </div>

      {/* Brokers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBrokers.map((b) => (
          <div
            key={b.id}
            className="glass-card rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-500 hover:scale-[1.01] transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{b.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                    {b.type === 'engineering_company' && '🏛️ مكتب هندسي'}
                    {b.type === 'contractor' && '🏗️ شركة مقاولات'}
                    {b.type === 'individual' && '👤 وسيط فردي'}
                    {b.type === 'company' && '🏢 شركة وساطة'}
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-xs border border-purple-200 dark:border-purple-800">
                  {b.commissionRate}% عمولة
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mt-3">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono-numbers">{b.phone}</span>
                </div>
                {b.taxNumber && (
                  <div className="text-[11px] text-slate-500">
                    الملف الضريبي: <span className="font-mono">{b.taxNumber}</span>
                  </div>
                )}
                {b.notes && <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-2">{b.notes}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                  <div className="text-slate-400 text-[10px]">الترشيحات</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono-numbers">{b.totalReferrals} عميل</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                  <div className="text-slate-400 text-[10px]">حجم المبيعات</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers">
                    {b.totalVolume.toLocaleString()} ج.م
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {canManageCatalog(effectiveUser) && (<button
                onClick={() => handleOpenEditModal(b)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                تعديل البيانات
              </button>)}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add or Edit Broker */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingBroker ? 'تعديل بيانات الوسيط / جهة الترشيح' : 'إضافة وسيط / جهة ترشيح جديدة'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الاسم الكامل / اسم الشركة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مكتب... / المهندس..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نوع الكيان *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="engineering_company">مكتب / شركة هندسية</option>
                    <option value="contractor">شركة مقاولات</option>
                    <option value="individual">وسيط فردي / مهندس</option>
                    <option value="company">شركة وساطة وتسويق</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نسبة العمولة % *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono-numbers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">رقم الهاتف *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="01000000000"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono-numbers"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-800 dark:text-slate-200">رقم الواتساب *</label>
                    <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSameWhatsApp}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsSameWhatsApp(checked);
                          if (checked) setWhatsappPhone(phone);
                        }}
                        className="rounded text-emerald-600 cursor-pointer"
                      />
                      <span>نفس الهاتف</span>
                    </label>
                  </div>
                  <input
                    type="tel"
                    required
                    disabled={isSameWhatsApp}
                    value={isSameWhatsApp ? phone : whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="01000000000"
                    className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono-numbers ${
                      isSameWhatsApp ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800/80' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">السجل / الرقم الضريبي</label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="100-200-300"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">ملاحظات / نطاق العمل</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="وصف طبيعة الشراكة..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                  {editingBroker ? 'تحديث البيانات' : 'حفظ الوسيط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
