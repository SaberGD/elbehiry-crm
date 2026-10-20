import { departmentNames } from "../lib/presentation";
import { FilterBar, inDateRange } from "../components/common/FilterBar";
import { NameWithTitle } from "../components/common/NameWithTitle";
import { hasPermission } from "../lib/permissions";
import { canCreateCustomer } from "../lib/access";
import React, { useState, useMemo, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import { useLanguage } from "../context/LanguageContext";
import { Visit, LeadSource, Department, InvoiceLineItem } from "../types/crm";
import { PurchaseCategorySelector } from "../components/common/PurchaseCategorySelector";
import {
  Compass,
  Search,
  PlusCircle,
  Calendar,
  User,
  Phone,
  MessageSquare,
  Star,
  Building,
  Paintbrush,
  Trees,
  Layers,
  Send,
} from "lucide-react";

interface VisitsPageProps {
  onOpenLead: (leadId: string) => void;
}

export const VisitsPage: React.FC<VisitsPageProps> = ({ onOpenLead }) => {
  const {
    effectiveUser,
    visits,
    branches,
    users,
    leads,
    addVisit,
    addPurchaseInvoice,
  } = useCRM();
  const { t } = useLanguage();

  const [showForm, setShowForm] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [isSameWhatsApp, setIsSameWhatsApp] = useState(true);
  const [branchId, setBranchId] = useState(
    effectiveUser.branchId || branches[0]?.id || "",
  );
  const [receivedByAgentId, setReceivedByAgentId] = useState(effectiveUser.id);

  // Sync default branch to current logged-in employee branch
  useEffect(() => {
    if (effectiveUser.branchId) {
      setBranchId(effectiveUser.branchId);
    }
  }, [effectiveUser.branchId]);
  const [source, setSource] = useState<LeadSource>("walk_in");
  const [department, setDepartment] = useState<Department>("decor");
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState("");
  const [locationRating, setLocationRating] = useState<number>(0);
  const [treatmentRating, setTreatmentRating] = useState<number>(0);
  const [priceRating, setPriceRating] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [visitorPurchaseItems, setVisitorPurchaseItems] = useState<
    InvoiceLineItem[]
  >([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [fBranch, setFBranch] = useState("all");
  const [fAgent, setFAgent] = useState("all");
  const [fDept, setFDept] = useState("all");
  const [fOutcome, setFOutcome] = useState("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const resetFilters = () => {
    setSearchQuery("");
    setFBranch("all");
    setFAgent("all");
    setFDept("all");
    setFOutcome("all");
    setFFrom("");
    setFTo("");
  };

  // Search existing customers for pre-filling visitor
  const matchingCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return [];
    const q = customerSearchTerm.toLowerCase();
    return leads
      .filter((l) => l.name.toLowerCase().includes(q) || l.phone.includes(q))
      .slice(0, 5);
  }, [customerSearchTerm, leads]);

  const selectExistingCustomer = (l: any) => {
    setVisitorName(l.name);
    setPhone(l.phone);
    if (l.branchId) setBranchId(l.branchId);
    if (l.assignedAgentId) setReceivedByAgentId(l.assignedAgentId);
    setCustomerSearchTerm("");
  };

  const deptLabels: Record<Department, string> = {
    construction: "🏗️ قسم الإنشائي والمقاولات",
    decor: "🎨 قسم الديكورات والدهانات",
    garden: "🌿 قسم البستان واللاندسكيب",
    general: "📦 قسم المتنوع والخدمات",
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (isSameWhatsApp) {
      setWhatsappPhone(val);
    }
  };

  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateCustomer(effectiveUser)) return;
    if (
      !users.some(
        (u) =>
          u.id === receivedByAgentId && u.active && u.branchId === branchId,
      )
    ) {
      alert("اختَر موظفًا نشطًا من نفس الفرع.");
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Append purchase summary to visit notes if any exists
    const validItems = visitorPurchaseItems.filter((i) => i.amount > 0);
    const totalPurchase = validItems.reduce(
      (s, i) => s + (Number(i.amount) || 0),
      0,
    );
    const purchaseNoteStr =
      validItems.length > 0
        ? ` | المشتريات بالفرع: ${validItems.map((i) => `${i.categoryName}: ${i.amount} ج.م`).join("، ")} (الإجمالي: ${totalPurchase} ج.م)`
        : "";

    const createdVisit = addVisit({
      visitorName,
      phone,
      whatsappPhone: whatsappPhone || phone,
      date: todayStr,
      time: timeStr,
      branchId,
      receivedByAgentId,
      source,
      department,
      locationRating: locationRating || undefined,
      treatmentRating: treatmentRating || undefined,
      priceRating: priceRating || undefined,
      reason,
      outcome,
      notes: (notes || "") + purchaseNoteStr,
      hasPreviousRecord: false,
      requiresFollowUp,
      followUpAgentId: receivedByAgentId,
      followUpDate: requiresFollowUp ? followUpDate : undefined,
    });

    // If visitor made purchases, generate invoice automatically
    if (validItems.length > 0 && totalPurchase > 0) {
      const branchObj = branches.find((b) => b.id === branchId);
      const agentObj = users.find((u) => u.id === receivedByAgentId);
      addPurchaseInvoice({
        date: todayStr,
        leadId: createdVisit.linkedLeadId!,
        leadName: visitorName,
        leadPhone: phone,
        branchId,
        branchName: branchObj?.name || "الفرع الرئيسي",
        agentId: receivedByAgentId,
        agentName: agentObj?.name || effectiveUser.name,
        items: validItems,
        totalAmount: totalPurchase,
        status: "draft",
        notes: `فاتورة مبيعات زائر بالفرع بتاريخ ${todayStr}`,
      });
    }

    // Reset Form
    setVisitorName("");
    setPhone("");
    setWhatsappPhone("");
    setReason("");
    setOutcome("");
    setNotes("");
    setRequiresFollowUp(false);
    setFollowUpDate("");
    setVisitorPurchaseItems([]);
    setShowForm(false);
  };

  const renderStarRating = (value: number, onChange: (val: number) => void) => (
    <div className="flex items-center gap-1 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-1 rounded transition-colors cursor-pointer ${
            star <= value
              ? "text-amber-400"
              : "text-slate-300 dark:text-slate-700"
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1.5 font-mono-numbers">
        {value}/5
      </span>
    </div>
  );

  const filteredVisits = visits.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q || v.visitorName.toLowerCase().includes(q) || v.phone.includes(q) || v.reason.toLowerCase().includes(q) || (v.outcome || "").toLowerCase().includes(q);
    return (
      matchesSearch &&
      (fBranch === "all" || v.branchId === fBranch) &&
      (fAgent === "all" || v.receivedByAgentId === fAgent) &&
      (fDept === "all" || v.department === fDept) &&
      (fOutcome === "all" || v.outcome === fOutcome) &&
      inDateRange(v.date, fFrom, fTo)
    );
  });
  const uniq = <T,>(list: T[]) => [...new Set(list)];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>تسجيل الزيارات والاستفسارات بمقرات الفروع</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تسجيل وتوثيق كل شخص يزور الفرع أو يستفسر عن الخدمات حتى لو لم يقم
            بالحجز المباشر
          </p>
        </div>

        {canCreateCustomer(effectiveUser) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer min-h-[40px] justify-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? "إغلاق النموذج" : "تسجيل زيارة فرع جديدة"}</span>
          </button>
        )}
      </div>

      {/* New Visit Form */}
      {showForm && (
        <form
          onSubmit={handleAddVisit}
          className="glass-card p-5 sm:p-6 rounded-2xl shadow-md space-y-4 text-xs animate-in slide-in-from-top duration-150"
        >
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
            نموذج استقبال زائر بمقر الفرع
          </h3>

          {/* Existing Customer Search Auto-fill */}
          <div className="relative bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <span>البحث عن عميل سابق لملء بيانات الزائر تلقائياً:</span>
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
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {mc.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono-numbers">
                        {mc.phone}
                      </span>
                    </div>
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                      تعبئة بيانات الزائر
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <NameWithTitle value={visitorName} onChange={setVisitorName} label="اسم الزائر" required placeholder="أدخل اسم الشخص..." fieldName="visitorName" />

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                رقم الهاتف الرئيسي
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="01012345678"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers"
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                <input
                  type="checkbox"
                  checked={isSameWhatsApp}
                  onChange={(e) => {
                    setIsSameWhatsApp(e.target.checked);
                    if (e.target.checked) setWhatsappPhone(phone);
                  }}
                  className="w-3.5 h-3.5 text-emerald-600 rounded"
                />
                <span>نفس رقم الواتس؟</span>
              </label>
            </div>

            <div>
              <label className="block font-bold text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>رقم الواتس</span>
              </label>
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="01012345678"
                disabled={isSameWhatsApp}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 rounded-xl font-mono-numbers disabled:opacity-80"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                الفرع الذي تمت زيارته *
              </label>
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setReceivedByAgentId("");
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                الموظف المستقبل *
              </label>
              <select
                disabled={effectiveUser.role === "sales_agent"}
                value={receivedByAgentId}
                onChange={(e) => setReceivedByAgentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              >
                <option value="">اختر الموظف المسؤول</option>
                {users
                  .filter(
                    (u) =>
                      u.active &&
                      u.branchId === branchId &&
                      ["sales_agent", "branch_manager", "supervisor"].includes(
                        u.role,
                      ),
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.branchName || "عام"})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                القسم محل الاستفسار *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold"
              >
                <option value="decor">🎨 قسم الديكورات والدهانات</option>
                <option value="construction">🏗️ قسم الإنشائي والمقاولات</option>
                <option value="garden">🌿 قسم البستان واللاندسكيب</option>
                <option value="general">📦 قسم المتنوع والخدمات</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                مصدر الزيارة
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              >
                <option value="walk_in">حضور مباشر (Walk-in)</option>
                <option value="facebook">إعلان فيسبوك</option>
                <option value="referral">ترشيح عميل</option>
                <option value="google">بحث جوجل</option>
                <option value="phone_inquiry">استفسار سابق</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                سبب الزيارة بالتفصيل *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: حضر لمعاينة درجات الدهانات وطلب عرض سعر"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                نتيجة الزيارة *
              </label>
              <input
                type="text"
                required
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="مثال: أبدى اهتماماً كبيراً وطلب مهلة يوم للتأكيد"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              />
            </div>
          </div>

          {/* Purchase Categories & Prices for Visitor Purchases */}
          {hasPermission(effectiveUser, "invoices.manage") && (
            <PurchaseCategorySelector
              items={visitorPurchaseItems}
              onChange={setVisitorPurchaseItems}
              isOptional={true}
              title="مشتريات/تعاقدات الزائر بالفرع (اختياري)"
              subtitle="إذا قام الزائر بشراء منتجات/خدمات أثناء الزيارة، حدد التصنيفات والأسعار بالجنيه المصري (EGP)"
            />
          )}

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                disabled={!hasPermission(effectiveUser, "followups.create")}
                checked={requiresFollowUp}
                onChange={(e) => setRequiresFollowUp(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>تعتبر هذه الزيارة فرصة تحتاج إلى متابعة لاحقة؟</span>
            </label>

            {requiresFollowUp && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  موعد المتابعة:
                </span>
                <input
                  type="datetime-local"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
            >
              حفظ سجل الزيارة
            </button>
          </div>
        </form>
      )}

      {/* Search & Register Table */}
      <div className="glass-card rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <FilterBar
            search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "ابحث باسم الزائر أو الهاتف أو النتيجة…" }}
            selects={[
              { id: "branch", label: "الفرع", value: fBranch, onChange: setFBranch, allLabel: "كل الفروع", primary: true, options: uniq(visits.map((v) => v.branchId)).map((id) => ({ value: id, label: visits.find((v) => v.branchId === id)?.branchName || id })) },
              { id: "agent", label: "الموظف المستقبِل", value: fAgent, onChange: setFAgent, allLabel: "كل الموظفين", options: uniq(visits.map((v) => v.receivedByAgentId)).map((id) => ({ value: id, label: visits.find((v) => v.receivedByAgentId === id)?.receivedByAgentName || id })) },
              { id: "dept", label: "القسم", value: fDept, onChange: setFDept, allLabel: "كل الأقسام", options: uniq(visits.map((v) => v.department)).map((d) => ({ value: d, label: departmentNames[d] || d })) },
              { id: "outcome", label: "نتيجة الزيارة", value: fOutcome, onChange: setFOutcome, allLabel: "كل النتائج", options: uniq(visits.map((v) => v.outcome).filter(Boolean)).map((o) => ({ value: o, label: o })) },
            ]}
            dates={{ from: fFrom, to: fTo, onFrom: setFFrom, onTo: setFTo, label: "تاريخ الزيارة" }}
            count={{ shown: filteredVisits.length, noun: "زيارة" }}
            onReset={resetFilters}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right dir-ltr:text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">اسم الزائر</th>
                <th className="p-3.5">الهاتف</th>
                <th className="p-3.5">التاريخ والوقت</th>
                <th className="p-3.5">الفرع</th>
                <th className="p-3.5">الاستفسار والسبب</th>
                <th className="p-3.5">النتيجة</th>
                <th className="p-3.5">المستقبل</th>
                <th className="p-3.5 text-center">الإجراء</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs"
                  >
                    لا توجد زيارات مسجلة تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredVisits.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {v.visitorName}
                    </td>
                    <td className="p-3.5 font-mono-numbers text-slate-700 dark:text-slate-300">
                      {v.phone || "—"}
                    </td>
                    <td className="p-3.5 font-mono-numbers text-indigo-700 dark:text-indigo-400 font-semibold">
                      {v.date} {v.time}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {v.branchName}
                    </td>
                    <td className="p-3.5 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {v.reason}
                    </td>
                    <td className="p-3.5 text-emerald-700 dark:text-emerald-400 font-medium max-w-xs truncate">
                      {v.outcome}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {v.receivedByAgentName}
                    </td>
                    <td className="p-3.5 text-center">
                      {v.linkedLeadId ? (
                        <button
                          onClick={() => onOpenLead(v.linkedLeadId!)}
                          className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          سجل العميل
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          زائر عام
                        </span>
                      )}
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
