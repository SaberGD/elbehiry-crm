import React, { useState, useMemo, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { useLanguage } from '../context/LanguageContext';
import { Lead, LeadClassification, LeadSource, Department, CustomerCategory, BrokerEntity, InvoiceLineItem } from '../types/crm';
import { DuplicateModal } from '../components/common/DuplicateModal';
import { PurchaseCategorySelector } from '../components/common/PurchaseCategorySelector';
import {
  UserPlus,
  Phone,
  AlertTriangle,
  ArrowRight,
  Save,
  CheckCircle2,
  Send,
  Users,
  Briefcase,
  Link,
  Search,
  Check,
  UserCheck,
  MessageSquare,
  Copy,
  ExternalLink,
  Sparkles,
  CheckSquare,
  Square,
  Share2,
} from 'lucide-react';

interface AddLeadPageProps {
  onSuccessNavigate: (leadId?: string) => void;
  onOpenExistingLead: (lead: Lead) => void;
}

export type RecordType = 'customer' | 'broker' | 'customer_and_broker';

export const AddLeadPage: React.FC<AddLeadPageProps> = ({
  onSuccessNavigate,
  onOpenExistingLead,
}) => {
  const {
    effectiveUser,
    branches,
    users,
    addLead,
    updateLead,
    addBroker,
    addPurchaseInvoice,
    findDuplicateLeadsByPhone,
    leads,
    brokers,
    addTimelineEvent,
  } = useCRM();
  const { t } = useLanguage();

  // Top Record Choice: Customer, Broker, or Customer & Broker
  const [recordType, setRecordType] = useState<RecordType>('customer');

  // Customer Fields
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsappPhone, setCustomerWhatsappPhone] = useState('');
  const [isCustomerSameWhatsapp, setIsCustomerSameWhatsapp] = useState(true);
  const [customerTelegram, setCustomerTelegram] = useState('');
  const [branchId, setBranchId] = useState(effectiveUser.branchId || branches[0]?.id || '');
  const [assignedAgentId, setAssignedAgentId] = useState(effectiveUser.id);
  const [customerNotes, setCustomerNotes] = useState('');
  const [customerPurchaseItems, setCustomerPurchaseItems] = useState<InvoiceLineItem[]>([]);

  // Broker Fields
  const [brokerSearchTerm, setBrokerSearchTerm] = useState('');
  const [brokerType, setBrokerType] = useState<'individual' | 'company' | 'office' | 'other'>('individual');
  const [brokerName, setBrokerName] = useState('');
  const [brokerTitle, setBrokerTitle] = useState(''); // اللقب / الشهرة
  const [brokerPhone, setBrokerPhone] = useState('');
  const [brokerWhatsappPhone, setBrokerWhatsappPhone] = useState('');
  const [isBrokerSameWhatsapp, setIsBrokerSameWhatsapp] = useState(true);
  const [brokerTelegram, setBrokerTelegram] = useState('');
  const [brokerCommissionRate, setBrokerCommissionRate] = useState(5);
  const [brokerBranchId, setBrokerBranchId] = useState(effectiveUser.branchId || branches[0]?.id || '');
  const [brokerAgentId, setBrokerAgentId] = useState(effectiveUser.id);
  const [brokerNotes, setBrokerNotes] = useState('');

  // Auto-set initial branch to logged-in user's branch
  useEffect(() => {
    if (effectiveUser.branchId) {
      setBranchId(effectiveUser.branchId);
      setBrokerBranchId(effectiveUser.branchId);
    }
  }, [effectiveUser.branchId]);

  // Link existing broker if registering customer only
  const [selectedExistingBrokerId, setSelectedExistingBrokerId] = useState('');

  // Duplicate Check Modal State
  const [duplicates, setDuplicates] = useState<Lead[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Post-Registration Success & WhatsApp Dispatch State
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [registeredSummary, setRegisteredSummary] = useState<{
    leadId?: string;
    name: string;
    phone: string;
    whatsappPhone: string;
    recordType: RecordType;
  } | null>(null);

  const [hasTelegram, setHasTelegram] = useState<'yes' | 'no'>('no');
  const [evaluationLink, setEvaluationLink] = useState('https://g.page/r/ElbeheryPaints/review');
  const [telegramLink, setTelegramLink] = useState('https://t.me/ElbeheryPaints');
  const [copiedMessageToast, setCopiedMessageToast] = useState(false);
  const [isWhatsappSentRecorded, setIsWhatsappSentRecorded] = useState(false);

  // Search existing customers for auto-population
  const matchingCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return [];
    const q = customerSearchTerm.toLowerCase();
    return leads.filter(
      (l) => l.name.toLowerCase().includes(q) || l.phone.includes(q)
    ).slice(0, 5);
  }, [customerSearchTerm, leads]);

  // Search existing brokers for auto-population
  const matchingBrokers = useMemo(() => {
    if (!brokerSearchTerm.trim()) return [];
    const q = brokerSearchTerm.toLowerCase();
    return brokers.filter(
      (b) => b.name.toLowerCase().includes(q) || b.phone.includes(q)
    ).slice(0, 5);
  }, [brokerSearchTerm, brokers]);

  const selectExistingCustomer = (lead: Lead) => {
    setCustomerName(lead.name);
    setCustomerPhone(lead.phone);
    setCustomerWhatsappPhone(lead.whatsappPhone || lead.phone);
    setIsCustomerSameWhatsapp(lead.isSameWhatsApp ?? true);
    if (lead.branchId) setBranchId(lead.branchId);
    if (lead.assignedAgentId) setAssignedAgentId(lead.assignedAgentId);
    setCustomerNotes(lead.notes || '');
    setCustomerSearchTerm('');
  };

  const selectExistingBroker = (broker: BrokerEntity) => {
    setBrokerName(broker.name);
    setBrokerPhone(broker.phone);
    setBrokerWhatsappPhone(broker.whatsappPhone || broker.phone);
    setIsBrokerSameWhatsapp(broker.isSameWhatsApp ?? true);
    if (broker.type === 'company') setBrokerType('company');
    else if (broker.type === 'contractor') setBrokerType('office');
    else setBrokerType('individual');
    if (broker.commissionRate) setBrokerCommissionRate(broker.commissionRate);
    setBrokerNotes(broker.notes || '');
    setBrokerSearchTerm('');
  };

  // Customer Phone Change & Duplicate check
  const handleCustomerPhoneChange = (val: string) => {
    setCustomerPhone(val);
    if (isCustomerSameWhatsapp) {
      setCustomerWhatsappPhone(val);
    }
    if (val.length >= 7) {
      const found = findDuplicateLeadsByPhone(val);
      setDuplicates(found);
    } else {
      setDuplicates([]);
    }
  };

  // Broker Phone Change
  const handleBrokerPhoneChange = (val: string) => {
    setBrokerPhone(val);
    if (isBrokerSameWhatsapp) {
      setBrokerWhatsappPhone(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (recordType === 'customer' || recordType === 'customer_and_broker') {
      const found = findDuplicateLeadsByPhone(customerPhone);
      if (found.length > 0) {
        setDuplicates(found);
        setShowDuplicateModal(true);
        return;
      }
    }

    const branchObj = branches.find((b) => b.id === (recordType === 'broker' ? brokerBranchId : branchId));
    const agentObj = users.find((u) => u.id === (recordType === 'broker' ? brokerAgentId : assignedAgentId));

    let createdBrokerId: string | undefined = undefined;
    let createdLeadId: string | undefined = undefined;

    // Create Broker record if required
    if (recordType === 'broker' || recordType === 'customer_and_broker') {
      const brokerTypeMapping: Record<'individual' | 'company' | 'office' | 'other', 'individual' | 'company' | 'engineering_company' | 'contractor'> = {
        individual: 'individual',
        company: 'company',
        office: 'engineering_company',
        other: 'contractor',
      };

      const finalBrokerWhatsapp = isBrokerSameWhatsapp ? brokerPhone : (brokerWhatsappPhone || brokerPhone);

      const newBroker = addBroker({
        name: brokerName,
        type: brokerTypeMapping[brokerType],
        phone: brokerPhone,
        whatsappPhone: finalBrokerWhatsapp,
        isSameWhatsApp: isBrokerSameWhatsapp,
        email: '',
        commissionRate: brokerCommissionRate,
        active: true,
        notes: [
          brokerTitle ? `اللقب/الشهرة: ${brokerTitle}` : '',
          brokerTelegram ? `تليجرام: ${brokerTelegram}` : '',
          brokerNotes,
        ].filter(Boolean).join(' | '),
      });
      createdBrokerId = newBroker.id;
    }

    // Create Customer record if required
    if (recordType === 'customer' || recordType === 'customer_and_broker') {
      const targetBrokerId = createdBrokerId || (selectedExistingBrokerId || undefined);
      const matchedBroker = brokers.find((b) => b.id === targetBrokerId);

      const finalCustomerWhatsapp = isCustomerSameWhatsapp ? customerPhone : (customerWhatsappPhone || customerPhone);

      const created = addLead({
        name: customerName,
        phone: customerPhone,
        whatsappPhone: finalCustomerWhatsapp,
        isSameWhatsApp: isCustomerSameWhatsapp,
        email: undefined,
        customerCategory: 'individual',
        companyNameRelationship: matchedBroker ? `الوسيط المرتبط: ${matchedBroker.name}` : (brokerName ? `الوسيط المرتبط: ${brokerName}` : undefined),
        source: recordType === 'customer_and_broker' ? 'referral' : 'walk_in',
        branchId,
        branchName: branchObj?.name,
        assignedAgentId,
        assignedAgentName: agentObj?.name,
        status: 'new',
        classification: 'A',
        department: 'decor',
        departmentName: 'قسم العامة والخدمات',
        notes: [
          customerTelegram ? `تليجرام: ${customerTelegram}` : '',
          customerNotes,
        ].filter(Boolean).join(' | '),
      });
      createdLeadId = created.id;

      // If customer has purchase category items with amount > 0, create a purchase invoice automatically
      const validItems = customerPurchaseItems.filter((i) => i.amount > 0);
      const totalPurchase = validItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);

      if (validItems.length > 0 && totalPurchase > 0) {
        addPurchaseInvoice({
          date: new Date().toISOString().split('T')[0],
          leadId: created.id,
          leadName: created.name,
          leadPhone: created.phone,
          branchId,
          branchName: branchObj?.name || 'الفرع الرئيسي',
          agentId: assignedAgentId,
          agentName: agentObj?.name || effectiveUser.name,
          brokerId: targetBrokerId,
          brokerName: matchedBroker ? matchedBroker.name : (brokerName || undefined),
          items: validItems,
          totalAmount: totalPurchase,
          status: 'paid',
          notes: 'فاتورة مشتريات منشأة تلقائياً مع تسجيل العميل',
        });
      }
    }

    const finalName = recordType === 'broker' ? brokerName : customerName;
    const finalPhone = recordType === 'broker' ? brokerPhone : customerPhone;
    const finalWhatsapp = recordType === 'broker'
      ? (isBrokerSameWhatsapp ? brokerPhone : (brokerWhatsappPhone || brokerPhone))
      : (isCustomerSameWhatsapp ? customerPhone : (customerWhatsappPhone || customerPhone));

    if (createdLeadId) {
      const generatedLink = `https://eval.beherypaints.com/rate?leadId=${createdLeadId}&client=${encodeURIComponent(customerName)}`;
      setEvaluationLink(generatedLink);
    }

    setRegisteredSummary({
      leadId: createdLeadId,
      name: finalName,
      phone: finalPhone,
      whatsappPhone: finalWhatsapp,
      recordType,
    });
    setSavedSuccess(true);
  };

  // Helper: Construct WhatsApp message string
  const formattedWhatsappMessage = useMemo(() => {
    if (!registeredSummary) return '';
    return `أهلاً بك أ./عزيزنا ${registeredSummary.name} ✨
يسعدنا انضمامك لمنظومة البحيري (El.Behery Paints).

⭐ نرجو منك تقييم تجربتك ورأيك يهمنا جداً عبر رابط جوجل التالي:
${evaluationLink}

📢 كما يمكنك الانضمام لقناتنا الرسمية على التليجرام لمتابعة أحدث العروض والخدمات:
${telegramLink}

شكراً لثقتك بنا وتواصلك معنا!`;
  }, [registeredSummary, evaluationLink, telegramLink]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(formattedWhatsappMessage);
    setCopiedMessageToast(true);
    setTimeout(() => setCopiedMessageToast(false), 2200);
  };

  const handleOpenWhatsappSend = () => {
    if (!registeredSummary) return;
    let raw = registeredSummary.whatsappPhone || registeredSummary.phone;
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('01') && clean.length === 11) {
      clean = '2' + clean;
    }
    const url = `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(formattedWhatsappMessage)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>تسجيل سجل جديد - Al-Buhairi CRM</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إضافة عميل، وسيط، أو تسجيل عميل ووسيط معاً وربطهما تلقائياً
          </p>
        </div>

        {!savedSuccess && (
          <button
            onClick={() => onSuccessNavigate()}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer min-h-[38px]"
          >
            <ArrowRight className="w-4 h-4 dir-ltr:rotate-180" />
            <span>العودة للقائمة</span>
          </button>
        )}
      </div>

      {!savedSuccess && (
        <>
          {/* 3-WAY RECORD TYPE SELECTOR */}
          <div className="glass-card p-4 rounded-2xl shadow-xs">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              اختر نوع السجل المراد إنشاؤه:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRecordType('customer')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  recordType === 'customer'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-700 dark:border-slate-500 ring-2 ring-slate-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold">
                    1
                  </span>
                  {recordType === 'customer' && <Check className="w-5 h-5 text-slate-800 dark:text-slate-200" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">1. عميل</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">تسجيل عميل جديد مباشرة</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecordType('broker')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  recordType === 'broker'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-700 dark:border-slate-500 ring-2 ring-slate-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold">
                    2
                  </span>
                  {recordType === 'broker' && <Check className="w-5 h-5 text-slate-800 dark:text-slate-200" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">2. وسيط</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">مكتب استشاري، سمسار أو جهة ترشيح</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecordType('customer_and_broker')}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  recordType === 'customer_and_broker'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    3
                  </span>
                  {recordType === 'customer_and_broker' && <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">3. عميل ووسيط</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">تسجيل الكيانين معاً وربطهما تلقائياً</div>
                </div>
              </button>
            </div>
          </div>

          {/* Duplicate Alert Banner */}
          {duplicates.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in flex-wrap">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    تنبيه: تم العثور على {duplicates.length} عميل مسجل برقم الهاتف هذا!
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    العميل: {duplicates[0].name} ({duplicates[0].branchName})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenExistingLead(duplicates[0])}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
              >
                فتح السجل الحالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Form Container or Success Dispatch View */}
      <div className="glass-card p-6 rounded-2xl shadow-xs">
        {savedSuccess && registeredSummary ? (
          /* POST-REGISTRATION WHATSAPP / TELEGRAM DISPATCH VIEW */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تم حفظ {registeredSummary.recordType === 'broker' ? 'الوسيط' : registeredSummary.recordType === 'customer_and_broker' ? 'العميل والوسيط' : 'العميل'} بنجاح!
              </h2>
              <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 flex-wrap">
                <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  الاسم: <strong className="text-emerald-700 dark:text-emerald-400">{registeredSummary.name}</strong>
                </span>
                <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono-numbers">
                  الواتساب: <strong className="text-emerald-700 dark:text-emerald-400">{registeredSummary.whatsappPhone}</strong>
                </span>
              </div>
            </div>

            {/* Links Config Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>روابط المتابعة والتقييم للعميل:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رابط تقييم جوجل (Evaluation Link):</label>
                  <input
                    type="url"
                    value={evaluationLink}
                    onChange={(e) => setEvaluationLink(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رابط التليجرام (Telegram Link):</label>
                  <input
                    type="url"
                    value={telegramLink}
                    onChange={(e) => setTelegramLink(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Telegram Question */}
            <div className="p-4 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <label className="block font-bold text-slate-900 dark:text-slate-100 text-sm">
                هل للعميل / الوسيط حساب على تطبيق التليجرام؟
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setHasTelegram('yes')}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    hasTelegram === 'yes'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>نعم، لديه تليجرام</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasTelegram('no')}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    hasTelegram === 'no'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>لا، ليس لديه تليجرام (إرسال رسالة التقييم عبر الواتساب)</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Message Preview Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>نص الرسالة الجاهزة للإرسال:</span>
                </span>
                {copiedMessageToast && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full animate-bounce">
                    ✓ تم نسخ النص إلى الحافظة!
                  </span>
                )}
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed relative">
                {formattedWhatsappMessage}
              </div>

              {/* Confirmation Checkbox for Sales Dispatch */}
              <div className="p-3.5 bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2.5 font-bold text-xs text-emerald-900 dark:text-emerald-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isWhatsappSentRecorded}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsWhatsappSentRecorded(checked);
                      if (registeredSummary?.leadId) {
                        updateLead(registeredSummary.leadId, {
                          whatsappMessageSent: checked,
                          whatsappSentBy: checked ? effectiveUser.name : undefined,
                          whatsappSentAt: checked ? new Date().toISOString() : undefined,
                        });
                        if (checked) {
                          addTimelineEvent({
                            leadId: registeredSummary.leadId,
                            authorId: effectiveUser.id,
                            authorName: effectiveUser.name,
                            type: 'call',
                            title: 'تأكيد إرسال رسالة الواتساب',
                            details: `قام الموظف ${effectiveUser.name} بتأكيد إرسال رسالة الترحيب والتقييم للعميل عبر الواتساب.`,
                          });
                        }
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>تأكيد أنه تم إرسال الرسالة للعميل عبر الواتساب (تحديد الموظف المرسل)</span>
                </label>

                {isWhatsappSentRecorded && (
                  <span className="text-[11px] font-bold bg-emerald-600 text-white px-3 py-1 rounded-xl shadow-xs animate-in fade-in">
                    ✓ تم التوثيق بواسطة: {effectiveUser.name}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span>نسخ النص للرسالة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleOpenWhatsappSend();
                      if (!isWhatsappSentRecorded) {
                        setIsWhatsappSentRecorded(true);
                        if (registeredSummary?.leadId) {
                          updateLead(registeredSummary.leadId, {
                            whatsappMessageSent: true,
                            whatsappSentBy: effectiveUser.name,
                            whatsappSentAt: new Date().toISOString(),
                          });
                          addTimelineEvent({
                            leadId: registeredSummary.leadId,
                            authorId: effectiveUser.id,
                            authorName: effectiveUser.name,
                            type: 'call',
                            title: 'تأكيد إرسال رسالة الواتساب',
                            details: `قام الموظف ${effectiveUser.name} بتأكيد إرسال رسالة الترحيب والتقييم للعميل عبر الواتساب.`,
                          });
                        }
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4.5 h-4.5 fill-current" />
                    <span>إرسال مباشر عبر الواتساب</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSuccessNavigate(registeredSummary.leadId)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-[#1a212e] dark:hover:bg-[#252f42] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>إنهاء والانتقال للسجل</span>
                  <ArrowRight className="w-4 h-4 dir-ltr:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* SECTION 1: CUSTOMER FORM (if recordType is 'customer' or 'customer_and_broker') */}
            {(recordType === 'customer' || recordType === 'customer_and_broker') && (
              <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">تسجيل العميل</h3>
                  </div>
                </div>

                {/* Existing Customer Search Auto-fill */}
                <div className="relative bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-500" />
                    <span>البحث عن عميل سابق لملء البيانات تلقائياً:</span>
                  </label>
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    placeholder="ابحث باسم العميل أو رقم الهاتف..."
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  {matchingCustomers.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                      {matchingCustomers.map((mc) => (
                        <button
                          key={mc.id}
                          type="button"
                          onClick={() => selectExistingCustomer(mc)}
                          className="w-full text-right p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{mc.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono-numbers">{mc.phone}</span>
                          </div>
                          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                            تعبئة البيانات
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">اسم العميل *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="اسم العميل الكامل..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">رقم التليفون *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      placeholder="01000000000"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Customer WhatsApp Phone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>رقم الواتساب *</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isCustomerSameWhatsapp}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsCustomerSameWhatsapp(checked);
                            if (checked) setCustomerWhatsappPhone(customerPhone);
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>نفس رقم الهاتف</span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      required
                      disabled={isCustomerSameWhatsapp}
                      value={isCustomerSameWhatsapp ? customerPhone : customerWhatsappPhone}
                      onChange={(e) => setCustomerWhatsappPhone(e.target.value)}
                      placeholder="01000000000"
                      className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers focus:ring-2 focus:ring-emerald-500 outline-none ${
                        isCustomerSameWhatsapp ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800/80' : ''
                      }`}
                    />
                  </div>

                  {/* Customer Telegram (Optional) */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      <span>رقم التليجرام (اختياري)</span>
                    </label>
                    <input
                      type="tel"
                      value={customerTelegram}
                      onChange={(e) => setCustomerTelegram(e.target.value)}
                      placeholder="01000000000 أو @username"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الفرع *</label>
                    <select
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned Agent */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الموظف المسؤول *</label>
                    <select
                      value={assignedAgentId}
                      onChange={(e) => setAssignedAgentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.branchName || 'فرع عام'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer Notes (Optional) */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      ملاحظات العميل (اختياري)
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="تفاصيل المتابعة والملاحظات..."
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl outline-none"
                    />
                  </div>

                  {/* Purchase Categories & Prices */}
                  <div className="sm:col-span-2 pt-2">
                    <PurchaseCategorySelector
                      items={customerPurchaseItems}
                      onChange={setCustomerPurchaseItems}
                      title="مشتريات/تعاقدات العميل عند التسجيل (اختياري)"
                      subtitle="حدد أقسام الشراء وأدخل قيم المشتريات للعميل بالجنيه المصري (EGP)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: BROKER FORM (if recordType is 'broker' or 'customer_and_broker') */}
            {(recordType === 'broker' || recordType === 'customer_and_broker') && (
              <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">تسجيل الوسيط</h3>
                  </div>
                </div>

                {/* Existing Broker Search Auto-fill */}
                <div className="relative bg-purple-50/50 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60">
                  <label className="block font-bold text-purple-900 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-purple-600" />
                    <span>البحث عن وسيط سابق لملء البيانات تلقائياً:</span>
                  </label>
                  <input
                    type="text"
                    value={brokerSearchTerm}
                    onChange={(e) => setBrokerSearchTerm(e.target.value)}
                    placeholder="ابحث باسم الوسيط أو رقم الهاتف..."
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg text-xs"
                  />
                  {matchingBrokers.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                      {matchingBrokers.map((mb) => (
                        <button
                          key={mb.id}
                          type="button"
                          onClick={() => selectExistingBroker(mb)}
                          className="w-full text-right p-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{mb.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono-numbers">{mb.phone}</span>
                          </div>
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                            تعبئة البيانات
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Broker Type Selector */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نوع الوسيط *</label>
                    <select
                      value={brokerType}
                      onChange={(e) => setBrokerType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold"
                    >
                      <option value="individual">فرد</option>
                      <option value="company">شركة</option>
                      <option value="office">مكتب</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>

                  {/* Broker Name */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">اسم الوسيط *</label>
                    <input
                      type="text"
                      required
                      value={brokerName}
                      onChange={(e) => setBrokerName(e.target.value)}
                      placeholder="اسم الوسيط أو الكيان..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    />
                  </div>

                  {/* Broker Nickname / Alias (Optional) */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      اللقب / الشهرة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={brokerTitle}
                      onChange={(e) => setBrokerTitle(e.target.value)}
                      placeholder="مثال: أبو أحمد السمسار..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    />
                  </div>

                  {/* Broker Phone */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">رقم التليفون *</label>
                    <input
                      type="tel"
                      required
                      value={brokerPhone}
                      onChange={(e) => handleBrokerPhoneChange(e.target.value)}
                      placeholder="01000000000"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers"
                    />
                  </div>

                  {/* Broker WhatsApp Phone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>رقم الواتساب *</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isBrokerSameWhatsapp}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsBrokerSameWhatsapp(checked);
                            if (checked) setBrokerWhatsappPhone(brokerPhone);
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>نفس رقم الهاتف</span>
                      </label>
                    </div>
                    <input
                      type="tel"
                      required
                      disabled={isBrokerSameWhatsapp}
                      value={isBrokerSameWhatsapp ? brokerPhone : brokerWhatsappPhone}
                      onChange={(e) => setBrokerWhatsappPhone(e.target.value)}
                      placeholder="01000000000"
                      className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers focus:ring-2 focus:ring-emerald-500 outline-none ${
                        isBrokerSameWhatsapp ? 'opacity-80 cursor-not-allowed bg-slate-100 dark:bg-slate-800/80' : ''
                      }`}
                    />
                  </div>

                  {/* Broker Telegram (Optional) */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      <span>رقم التليجرام (اختياري)</span>
                    </label>
                    <input
                      type="tel"
                      value={brokerTelegram}
                      onChange={(e) => setBrokerTelegram(e.target.value)}
                      placeholder="01000000000"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers"
                    />
                  </div>

                  {/* Broker Commission Rate */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نسبة العمولة %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={brokerCommissionRate}
                      onChange={(e) => setBrokerCommissionRate(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers font-bold text-purple-600 dark:text-purple-400"
                    />
                  </div>

                  {/* Broker Branch */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الفرع *</label>
                    <select
                      value={brokerBranchId}
                      onChange={(e) => setBrokerBranchId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Broker Agent */}
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">الموظف المسؤول *</label>
                    <select
                      value={brokerAgentId}
                      onChange={(e) => setBrokerAgentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Broker Notes (Optional) */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      ملاحظات (اختياري)
                    </label>
                    <textarea
                      value={brokerNotes}
                      onChange={(e) => setBrokerNotes(e.target.value)}
                      placeholder="طبيعة العمل والملاحظات..."
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Optional: Link Customer to existing Broker if registering Customer only */}
            {recordType === 'customer' && brokers.length > 0 && (
              <div className="p-4 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <label className="block font-bold text-slate-900 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-[#abcae9]" />
                  <span>ربط هذا العميل بوسيط مسجل سابقاً (اختياري):</span>
                </label>
                <select
                  value={selectedExistingBrokerId}
                  onChange={(e) => setSelectedExistingBrokerId(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-medium"
                >
                  <option value="">بدون وسيط (عميل مباشر)</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.commissionRate}% عمولة)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => onSuccessNavigate()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white dark:bg-[#1a212e] dark:hover:bg-[#252f42] border border-slate-600/30 dark:border-white/15 rounded-xl font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4 text-[#abcae9]" />
                <span>
                  {recordType === 'customer' && 'حفظ العميل'}
                  {recordType === 'broker' && 'حفظ الوسيط'}
                  {recordType === 'customer_and_broker' && 'حفظ العميل والوسيط وربطهما'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Duplicate Warning Modal */}
      <DuplicateModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicates}
        onOpenExisting={(l) => {
          setShowDuplicateModal(false);
          onOpenExistingLead(l);
        }}
      />
    </div>
  );
};


