import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { PurchaseInvoice, PurchaseCategory, InvoiceLineItem } from '../types/crm';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Tag,
  Layers,
  X,
  Printer,
  ChevronDown,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const {
    purchaseInvoices,
    purchaseCategories,
    leads,
    branches,
    users,
    brokers,
    effectiveUser,
    addPurchaseInvoice,
    updatePurchaseInvoiceStatus,
    addPurchaseCategory,
    updatePurchaseCategory,
  } = useCRM();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'invoices' | 'categories'>('invoices');

  // Filters for invoices
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Invoice Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);

  // New Invoice Modal State
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(effectiveUser.branchId || branches[0]?.id || '');
  const [selectedAgentId, setSelectedAgentId] = useState(effectiveUser.id);
  const [selectedBrokerId, setSelectedBrokerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceStatus, setInvoiceStatus] = useState<PurchaseInvoice['status']>('paid');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Dynamic invoice items state
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([
    { categoryId: purchaseCategories[0]?.id || 'cat-paints', categoryName: purchaseCategories[0]?.name || 'دهانات', amount: 0 },
  ]);

  // Category Modal State
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');

  // Auto calculate total
  const totalInvoiceAmount = invoiceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Filtered Invoices
  const filteredInvoices = purchaseInvoices.filter((inv) => {
    // Role-based scope
    if (effectiveUser.role === 'branch_manager' && inv.branchId !== effectiveUser.branchId) return false;
    if (effectiveUser.role === 'sales_agent' && inv.agentId !== effectiveUser.id) return false;

    // Search query
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.leadPhone.includes(searchTerm);

    // Branch filter
    const matchBranch = branchFilter === 'all' || inv.branchId === branchFilter;

    // Status filter
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchSearch && matchBranch && matchStatus;
  });

  // Handle adding line item category
  const handleAddItem = () => {
    const availableCat = purchaseCategories.find((c) => c.active && !invoiceItems.some((i) => i.categoryId === c.id));
    if (availableCat) {
      setInvoiceItems([...invoiceItems, { categoryId: availableCat.id, categoryName: availableCat.name, amount: 0 }]);
    } else if (purchaseCategories[0]) {
      setInvoiceItems([...invoiceItems, { categoryId: purchaseCategories[0].id, categoryName: purchaseCategories[0].name, amount: 0 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const handleCategoryChange = (index: number, catId: string) => {
    const cat = purchaseCategories.find((c) => c.id === catId);
    if (!cat) return;
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], categoryId: cat.id, categoryName: cat.name };
    setInvoiceItems(updated);
  };

  const handleAmountChange = (index: number, amountVal: number) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], amount: Math.max(0, amountVal) };
    setInvoiceItems(updated);
  };

  // Submit New Invoice
  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let leadName = customCustomerName;
    let leadPhone = customCustomerPhone;

    if (selectedLeadId) {
      const matchLead = leads.find((l) => l.id === selectedLeadId);
      if (matchLead) {
        leadName = matchLead.name;
        leadPhone = matchLead.phone;
      }
    }

    if (!leadName || !leadPhone) {
      alert('يرجى اختيار عميل أو أدخال اسم العميل ورقم الهاتف');
      return;
    }

    if (totalInvoiceAmount <= 0) {
      alert('يرجى تحديد مبالغ صالحة لأقسام الشراء');
      return;
    }

    const branchObj = branches.find((b) => b.id === selectedBranchId);
    const agentObj = users.find((u) => u.id === selectedAgentId);
    const brokerObj = brokers.find((b) => b.id === selectedBrokerId);

    addPurchaseInvoice({
      date: invoiceDate,
      leadId: selectedLeadId || `ld-cust-${Date.now()}`,
      leadName,
      leadPhone,
      branchId: selectedBranchId,
      branchName: branchObj ? branchObj.name : 'الفرع الرئيسي',
      agentId: selectedAgentId,
      agentName: agentObj ? agentObj.name : effectiveUser.name,
      brokerId: selectedBrokerId || undefined,
      brokerName: brokerObj ? brokerObj.name : undefined,
      items: invoiceItems.filter((i) => i.amount > 0),
      totalAmount: totalInvoiceAmount,
      status: invoiceStatus,
      notes: invoiceNotes,
    });

    // Reset Form
    setIsNewInvoiceOpen(false);
    setSelectedLeadId('');
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setInvoiceNotes('');
    setInvoiceItems([{ categoryId: purchaseCategories[0]?.id || 'cat-paints', categoryName: purchaseCategories[0]?.name || 'دهانات', amount: 0 }]);
  };

  // Create New Category Submit
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    addPurchaseCategory({
      name: newCatName,
      code: newCatCode || newCatName.toUpperCase().slice(0, 5),
      active: true,
    });

    setNewCatName('');
    setNewCatCode('');
    setIsNewCategoryOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-[#0c1017] dark:bg-[#0c0f17] text-[#e2e8f0] p-5 sm:p-6 rounded-2xl shadow-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/10">
            النظام المالي والتوريدات
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#abcae9]" />
            <span>فواتير مشتريات العملاء وتصنيفات الشراء</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            إصدار فواتير المشتريات المتعددة للعميل الواحد، توزيع المبالغ على الأقسام والتصنيفات (دهانات، ديكور، إنشائي، بستان)، وحساب المجموع تلقائياً بالجنيه المصري.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {(effectiveUser.role === 'admin' || effectiveUser.role === 'general_manager') && (
            <button
              onClick={() => setIsNewCategoryOpen(true)}
              className="px-3.5 py-2.5 bg-[#181f2c] hover:bg-[#222c3e] text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
            >
              <Tag className="w-4 h-4 text-[#abcae9]" />
              <span>إدارة التصنيفات</span>
            </button>
          )}

          <button
            onClick={() => setIsNewInvoiceOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#1a212e] dark:hover:bg-[#252f42] rounded-xl text-xs font-bold transition-all border border-slate-600/30 dark:border-white/15 cursor-pointer flex items-center gap-1.5 min-h-[44px] shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#abcae9]" />
            <span>+ إصدار فاتورة مشتريات جديدة</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex glass-card p-2 rounded-2xl shadow-xs gap-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>قائمة فواتير المشتريات ({purchaseInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-slate-800 dark:bg-[#1e2636] text-white border border-white/15 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>تصنيفات الشراء المعتمدة ({purchaseCategories.length})</span>
        </button>
      </div>

      {/* TAB 1: INVOICES LIST */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="glass-card p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 dir-ltr:right-auto dir-ltr:left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث برقم الفاتورة، اسم العميل، أو رقم الهاتف..."
                className="w-full pr-9 dir-ltr:pr-3 dir-ltr:pl-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold"
              >
                <option value="all">كافة الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold"
              >
                <option value="all">كافة الحالات</option>
                <option value="paid">مسددة بالكامل</option>
                <option value="partial">دفعة جزئية / عربون</option>
                <option value="draft">مسودة فاتورة</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>
          </div>

          {/* Invoices List Table / Cards */}
          <div className="glass-card rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right dir-ltr:text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5">رقم الفاتورة والتاريخ</th>
                    <th className="p-3.5">اسم العميل ورقم التواصل</th>
                    <th className="p-3.5">الفرع والموظف المسؤول</th>
                    <th className="p-3.5">تصنيفات المشتريات</th>
                    <th className="p-3.5">الوسيط / الترشيح</th>
                    <th className="p-3.5">المبلغ الإجمالي (EGP)</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        لا توجد فواتير مشتريات مطابقة للبحث حالياً
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-mono">
                          <div className="font-bold text-indigo-600 dark:text-indigo-400">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-400">{inv.date}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{inv.leadName}</div>
                          <div className="text-[11px] text-slate-500 font-mono-numbers">{inv.leadPhone}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.branchName}</div>
                          <div className="text-[11px] text-slate-400">{inv.agentName}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {inv.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200/60 dark:border-slate-700"
                              >
                                {item.categoryName}: <strong className="font-mono-numbers">{item.amount.toLocaleString()}</strong>
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-300">
                          {inv.brokerName ? (
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                              🤝 {inv.brokerName}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">مباشر</span>
                          )}
                        </td>

                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono-numbers text-sm">
                          {inv.totalAmount.toLocaleString()} ج.م
                        </td>

                        <td className="p-3.5">
                          <select
                            value={inv.status}
                            onChange={(e) => updatePurchaseInvoiceStatus(inv.id, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                : inv.status === 'partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            <option value="paid">مسددة بالكامل</option>
                            <option value="partial">دفعة جزئية</option>
                            <option value="draft">مسودة</option>
                            <option value="cancelled">ملغاة</option>
                          </select>
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsInvoiceDetailsOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors cursor-pointer"
                            title="عرض الفاتورة والطباعة"
                          >
                            <Printer className="w-4 h-4" />
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
      )}

      {/* TAB 2: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">إدارة أقسام وتصنيفات المشتريات المعتمدة</h3>
              <p className="text-xs text-slate-500">التصنيفات الافتراضية الخمسة المعتمدة (ديكور، دهانات، إنشائي، بستان، متنوع) بالإضافة إلى أي تصنيفات مخصصة.</p>
            </div>

            <button
              onClick={() => setIsNewCategoryOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#1a212e] dark:hover:bg-[#252f42] border border-slate-600/30 dark:border-white/10 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#abcae9]" />
              <span>إضافة تصنيف شراء جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{cat.name}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500 font-bold">
                      {cat.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    الحالة: {cat.active ? <span className="text-emerald-600 font-semibold">مفعل في الفواتير</span> : <span className="text-slate-400">معطل (محفوظ للتاريخ)</span>}
                  </div>
                </div>

                <button
                  onClick={() => updatePurchaseCategory(cat.id, { active: !cat.active })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    cat.active
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {cat.active ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Purchase Invoice */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#abcae9]" />
                <span>إصدار فاتورة مشتريات جديدة للعميل</span>
              </h3>
              <button onClick={() => setIsNewInvoiceOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 text-xs">
              {/* Customer Selection */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">بيانات العميل المستهدف</h4>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">اختر عميل مسجل حالياً:</label>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => {
                      setSelectedLeadId(e.target.value);
                      const match = leads.find((l) => l.id === e.target.value);
                      if (match) {
                        setCustomCustomerName(match.name);
                        setCustomCustomerPhone(match.phone);
                        if (match.branchId) setSelectedBranchId(match.branchId);
                      }
                    }}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    <option value="">-- أو ادخل عميل جديد أدناه --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} - {l.phone} ({l.branchName || 'فرع غير محدد'})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedLeadId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم العميل *</label>
                      <input
                        type="text"
                        required
                        value={customCustomerName}
                        onChange={(e) => setCustomCustomerName(e.target.value)}
                        placeholder="الاسم الرباعي للعميل..."
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف *</label>
                      <input
                        type="tel"
                        required
                        value={customCustomerPhone}
                        onChange={(e) => setCustomCustomerPhone(e.target.value)}
                        placeholder="01000000000"
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono-numbers"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Branch & Employee Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">تاريخ الفاتورة *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">الفرع التابع *</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">الموظف المسؤول *</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.branchName || 'عام'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Broker / Referral Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">الوسيط / جهة الترشيح (إن وجد):</label>
                <select
                  value={selectedBrokerId}
                  onChange={(e) => setSelectedBrokerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="">-- عميل مباشر (بدون وسيط) --</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      🤝 {b.name} ({b.commissionRate}% عمولة)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Purchase Categories Section */}
              <div className="bg-slate-100/80 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#abcae9]" />
                    <span>توزيع مبالغ المشتريات على الأقسام والمنتجات</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#1a212e] rounded-lg text-xs font-bold border border-white/10 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#abcae9]" />
                    <span>+ إضافة قسم</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                        className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                      >
                        {purchaseCategories
                          .filter((c) => c.active)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={item.amount}
                          onChange={(e) => handleAmountChange(index, parseFloat(e.target.value) || 0)}
                          placeholder="المبلغ ج.م"
                          className="w-32 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono-numbers font-bold text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-[11px] text-slate-500 font-bold">ج.م</span>
                      </div>

                      {invoiceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="حذف هذا القسم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Live Auto Total */}
                <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900 dark:text-slate-100">إجمالي الفاتورة المحسوب تلقائياً:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg font-mono-numbers">
                    {totalInvoiceAmount.toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">حالة السداد *</label>
                  <select
                    value={invoiceStatus}
                    onChange={(e) => setInvoiceStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="paid">مسددة بالكامل</option>
                    <option value="partial">دفعة جزئية / عربون</option>
                    <option value="draft">مسودة فاتورة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات الفاتورة:</label>
                  <input
                    type="text"
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    placeholder="ملاحظات التسليم أو تفاصيل المواد..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#1a212e] dark:hover:bg-[#252f42] border border-slate-600/30 dark:border-white/15 rounded-xl font-bold cursor-pointer transition-all shadow-sm"
                >
                  حفظ وإصدار الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Purchase Category */}
      {isNewCategoryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
              إضافة تصنيف مشتريات جديد
            </h3>

            <form onSubmit={handleCreateCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">اسم التصنيف باللغة العربية *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: إضاءة، رخام، عزل..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الكود المختصر (اختياري)</label>
                <input
                  type="text"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  placeholder="CODE"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
                  إضافة التصنيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Single Invoice Printable View */}
      {selectedInvoice && isInvoiceDetailsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>تفاصيل الفاتورة: {selectedInvoice.invoiceNumber}</span>
              </div>
              <button onClick={() => setIsInvoiceDetailsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedInvoice.leadName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-bold font-mono-numbers">{selectedInvoice.leadPhone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">الفرع والمسؤول:</span>
                <span className="font-bold">{selectedInvoice.branchName} - {selectedInvoice.agentName}</span>
              </div>
              {selectedInvoice.brokerName && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">الوسيط المعتمد:</span>
                  <span className="font-bold text-amber-600">🤝 {selectedInvoice.brokerName}</span>
                </div>
              )}

              <div className="pt-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-2">أقسام ومبالغ الفاتورة:</span>
                <div className="space-y-1.5">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between bg-white dark:bg-slate-900 p-2 rounded-xl border">
                      <span>{item.categoryName}</span>
                      <strong className="font-mono-numbers">{item.amount.toLocaleString()} ج.م</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-between text-sm font-extrabold text-indigo-700 dark:text-indigo-300">
                <span>المبلغ الإجمالي للفاتورة:</span>
                <span className="font-mono-numbers">{selectedInvoice.totalAmount.toLocaleString()} ج.م</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
