import React, { useState } from 'react';
import { Lead, LeadStatus, Department } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { useLanguage } from '../../context/LanguageContext';
import { CustomerRatingModal } from './CustomerRatingModal';
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  UserCheck,
  Calendar,
  Clock,
  Compass,
  PhoneCall,
  ShoppingBag,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit3,
  Share2,
  MessageSquare,
  Star,
  Building,
  Paintbrush,
  Trees,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  isOpen,
  onClose,
}) => {
  const {
    timelineEvents,
    visits,
    followUps,
    bookings,
    purchaseInvoices,
    users,
    branches,
    courses,
    effectiveUser,
    updateLead,
    reassignLead,
    addFollowUp,
    updateFollowUpResult,
    addBooking,
    addTimelineEvent,
  } = useCRM();

  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'timeline' | 'visits' | 'followups' | 'bookings' | 'invoices'>('timeline');

  // Rating Modal
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Quick Action Form States
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState('');

  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [followUpType, setFollowUpType] = useState<'call' | 'whatsapp' | 'branch_visit' | 'email'>('call');

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department>('decor');
  const [bookingAmount, setBookingAmount] = useState<number>(18500);
  const [paymentStatus, setPaymentStatus] = useState<'full' | 'deposit' | 'pending'>('deposit');
  const [bookingNotes, setBookingNotes] = useState('');

  const [showReassignForm, setShowReassignForm] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');

  if (!isOpen || !lead) return null;

  const leadTimeline = timelineEvents.filter((e) => e.leadId === lead.id);
  const leadVisits = visits.filter((v) => v.linkedLeadId === lead.id || (v.phone && v.phone === lead.phone));
  const leadFollowUps = followUps.filter((f) => f.leadId === lead.id);
  const leadBookings = bookings.filter((b) => b.leadId === lead.id);
  const leadInvoices = purchaseInvoices.filter((i) => i.leadId === lead.id || i.leadPhone === lead.phone);

  const availableAgents = users.filter((u) => u.role === 'sales_agent' || u.role === 'team_leader');

  const whatsappNum = lead.whatsappPhone || lead.phone;
  const whatsappUrl = `https://wa.me/20${whatsappNum.replace(/\D/g, '')}`;

  const deptLabels: Record<Department, string> = {
    construction: '🏗️ قسم الإنشائي والمقاولات',
    decor: '🎨 قسم الديكورات والدهانات',
    garden: '🌿 قسم البستان واللاندسكيب',
    general: '📦 قسم المتنوع والخدمات',
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    addTimelineEvent({
      leadId: lead.id,
      authorId: effectiveUser.id,
      authorName: effectiveUser.name,
      type: 'note',
      title: 'إضافة ملاحظة تواصل جديدة',
      details: noteText,
    });

    updateLead(lead.id, {
      lastContactDate: new Date().toISOString().slice(0, 10),
      notes: `${lead.notes ? lead.notes + ' | ' : ''}${noteText}`,
    });

    setNoteText('');
    setShowNoteForm(false);
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate || !followUpReason) return;

    addFollowUp({
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      assignedAgentId: lead.assignedAgentId || effectiveUser.id,
      branchId: lead.branchId,
      scheduledAt: followUpDate,
      reason: followUpReason,
      type: followUpType,
      notes: `تم الإضافة من سجل العميل بواسطة ${effectiveUser.name}`,
    });

    setFollowUpDate('');
    setFollowUpReason('');
    setShowFollowUpForm(false);
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();

    addBooking({
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      branchId: lead.branchId,
      agentId: lead.assignedAgentId || effectiveUser.id,
      department: selectedDept,
      courseId: `ps-${selectedDept}`,
      courseName: deptLabels[selectedDept],
      bookingDate: new Date().toISOString().slice(0, 10),
      amount: bookingAmount,
      paymentStatus: paymentStatus,
      bookingStatus: 'confirmed',
      source: lead.source,
      notes: bookingNotes,
    });

    setShowBookingForm(false);
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentId) return;
    reassignLead(lead.id, newAgentId);
    setShowReassignForm(false);
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateLead(lead.id, { status: newStatus });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-6 flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
              {lead.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white truncate">{lead.name}</h2>
                {lead.customerCategory && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                    {t(`category.${lead.customerCategory}`) || lead.customerCategory}
                  </span>
                )}
                {lead.companyNameRelationship && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    🏢 {lead.companyNameRelationship}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {deptLabels[lead.department || 'decor']}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {t(`status.${lead.status}`)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                <span className="font-mono-numbers">هاتف: {lead.phone}</span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded font-bold font-mono-numbers flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>واتس: {whatsappNum}</span>
                </a>
                <span>· الفرع: {lead.branchName}</span>
                <span>· المسؤول: {lead.assignedAgentName || 'غير مخصص'}</span>
              </p>

              {/* WhatsApp Message Dispatch Status & Confirmation */}
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                {lead.whatsappMessageSent ? (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم إرسال الواتساب والتقييم (بواسطة: {lead.whatsappSentBy || 'الموظف'} {lead.whatsappSentAt ? `في ${new Date(lead.whatsappSentAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}` : ''})</span>
                  </span>
                ) : (
                  <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 text-[11px] font-bold cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateLead(lead.id, {
                            whatsappMessageSent: true,
                            whatsappSentBy: effectiveUser.name,
                            whatsappSentAt: new Date().toISOString(),
                          });
                          addTimelineEvent({
                            leadId: lead.id,
                            authorId: effectiveUser.id,
                            authorName: effectiveUser.name,
                            type: 'call',
                            title: 'تأكيد إرسال الواتساب',
                            details: `قام الموظف ${effectiveUser.name} بتوثيق إرسال رسالة التقييم للعميل عبر الواتساب.`,
                          });
                        }
                      }}
                      className="rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                    />
                    <span>تأكيد إرسال رسالة الواتساب للعميل</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Info Strip & Quick Controls */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-slate-400 dark:text-slate-400 font-medium">القسم المطلوب:</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {deptLabels[lead.department || 'decor']}
            </div>
          </div>
          <div>
            <div className="text-slate-400 dark:text-slate-400 font-medium">المصدر والفرع:</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {lead.source} · {lead.branchName}
            </div>
          </div>
          <div>
            <div className="text-slate-400 dark:text-slate-400 font-medium">التقييمات:</div>
            <div className="flex items-center gap-2 mt-0.5 font-bold text-amber-500">
              <span title="تقييم المكان">🏢 {lead.locationRating || 5}/5</span>
              <span title="تقييم المعاملة">🤝 {lead.treatmentRating || 5}/5</span>
              <span title="تقييم الأسعار">💰 {lead.priceRating || 4}/5</span>
            </div>
          </div>
          <div>
            <div className="text-slate-400 dark:text-slate-400 font-medium">تغيير الحالة السريع:</div>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
              className="mt-0.5 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="new">طلب جديد</option>
              <option value="uncontacted">لم يتم التواصل</option>
              <option value="contacted">تم التواصل</option>
              <option value="interested">مهتم</option>
              <option value="prospect">عميل محتمل</option>
              <option value="needs_followup">يحتاج متابعة</option>
              <option value="not_interested">غير مهتم</option>
              <option value="booked">تم التعاقد والبيع</option>
            </select>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer min-h-[36px]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>محادثة واتساب مباشرة</span>
          </a>

          <button
            onClick={() => setShowRatingModal(true)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer min-h-[36px]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>رابط تقييم العميل المخصص</span>
          </button>

          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer min-h-[36px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تسجيل ملاحظة</span>
          </button>

          <button
            onClick={() => setShowFollowUpForm(!showFollowUpForm)}
            className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer min-h-[36px]"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>جدولة متابعة</span>
          </button>

          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer min-h-[36px]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>إتمام تعاقد / بيع</span>
          </button>

          <button
            onClick={() => setShowReassignForm(!showReassignForm)}
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer min-h-[36px]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>نقل لموظف آخر</span>
          </button>
        </div>

        {/* Expandable Quick Forms */}
        {showNoteForm && (
          <form onSubmit={handleAddNote} className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900 animate-in slide-in-from-top duration-150">
            <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-1">تسجيل تفاصيل التفاعل والملاحظة:</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="اكتب تفاصيل الاتصال أو العينات أو المقايسة المطلوبة..."
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={2}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowNoteForm(false)}
                className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
              >
                حفظ الملاحظة
              </button>
            </div>
          </form>
        )}

        {showBookingForm && (
          <form onSubmit={handleAddBooking} className="p-4 bg-amber-50/60 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900 animate-in slide-in-from-top duration-150 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">القسم المباع عليه:</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value as Department)}
                required
                className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 rounded text-xs"
              >
                <option value="decor">🎨 قسم الديكورات والدهانات</option>
                <option value="construction">🏗️ قسم الإنشائي والمقاولات</option>
                <option value="garden">🌿 قسم البستان واللاندسكيب</option>
                <option value="general">📦 قسم المتنوع والخدمات</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">القيمة المالية (ج.م):</label>
              <input
                type="number"
                value={bookingAmount}
                onChange={(e) => setBookingAmount(Number(e.target.value))}
                required
                className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 rounded text-xs font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">حالة السداد:</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 rounded text-xs"
              >
                <option value="deposit">سداد مقدم تعاقد</option>
                <option value="full">سداد كامل</option>
                <option value="pending">آجل / معلق</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">ملاحظات العقد والبيع:</label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="تفاصيل التوريد أو الموقع..."
                className="w-full p-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-200 rounded text-xs"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
              >
                تأكيد البيع والتعاقد
              </button>
            </div>
          </form>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            السجل الزمني للعميل ({leadTimeline.length})
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'visits'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            سجل المعاينات والفرع ({leadVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'followups'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            المتابعات ({leadFollowUps.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'bookings'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            الحجوزات والتعاقدات ({leadBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'invoices'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            فواتير المشتريات ({leadInvoices.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'timeline' && (
            <div className="space-y-3 relative before:absolute before:inset-0 before:right-3.5 dir-ltr:before:right-auto dir-ltr:before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {leadTimeline.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">لا يوجد سجل أحداث سابق للعميل</div>
              ) : (
                leadTimeline.map((ev) => (
                  <div key={ev.id} className="relative flex items-start gap-3 group">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0 z-10">
                      •
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{ev.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{ev.details}</p>
                      </div>

                      <div className="text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 shrink-0 font-medium border border-slate-200 dark:border-slate-700/70 text-right sm:text-left min-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          تمت المتابعة بواسطة: <strong className="text-indigo-600 dark:text-indigo-400">{ev.authorName}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono-numbers mt-0.5">
                          بتاريخ: {new Date(ev.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'visits' && (
            <div className="space-y-3">
              {leadVisits.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">لم تسجل معاينات لهذا العميل بعد</div>
              ) : (
                leadVisits.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">معاينة فرع {v.branchName}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1"><strong className="text-slate-800 dark:text-slate-200">السبب:</strong> {v.reason}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5"><strong className="text-slate-800 dark:text-slate-200">النتيجة:</strong> {v.outcome}</p>
                    </div>
                    <div className="text-[11px] bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-right sm:text-left shrink-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100">تمت الزيارة بواسطة: {v.receivedByAgentName || 'الموظف'}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono-numbers mt-0.5">{v.date} الساعة {v.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-3">
              {leadInvoices.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">لم يتم تسجيل فواتير مشتريات لهذا العميل بعد</div>
              ) : (
                leadInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">{inv.invoiceNumber} ({inv.date})</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono-numbers text-sm font-extrabold">
                        {inv.totalAmount.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {inv.items.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                          {item.categoryName}: <strong className="font-mono-numbers">{item.amount.toLocaleString()} ج.م</strong>
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>الفرع: {inv.branchName} · الموظف: {inv.agentName}</span>
                      {inv.brokerName && <span className="text-amber-600 font-semibold">🤝 وسيط: {inv.brokerName}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Customer Rating Simulation Modal */}
      <CustomerRatingModal
        lead={lead}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />
    </div>
  );
};
