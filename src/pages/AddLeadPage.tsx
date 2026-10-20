import {
  canCreateCustomer,
  canAssignCustomers,
  canManageCatalog,
  canContactCustomer,
  canScheduleFollowUp,
} from "../lib/access";
import { NameWithTitle } from "../components/common/NameWithTitle";
import { hasPermission } from "../lib/permissions";
import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Plus,
  CheckCircle2,
  MessageCircle,
  UserRound,
  FileText,
  SlidersHorizontal,
  ArrowUpLeft,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import {
  departmentNames,
  sourceNames,
  canSeeBranch,
  isManagement,
  phoneNumber,
  today,
  formatMoney,
} from "../lib/presentation";
import type {
  Lead,
  Department,
  LeadSource,
  InvoiceLineItem,
  PurchaseInvoice,
} from "../types/crm";
import type { LeadQuickAction } from "../components/common/LeadDetailsModal";

interface Props {
  onSuccessNavigate: (leadId?: string) => void;
  onOpenExistingLead: (lead: Lead, action?: LeadQuickAction) => void;
}
export function AddLeadPage({ onSuccessNavigate, onOpenExistingLead }: Props) {
  const {
    effectiveUser,
    branches,
    users,
    brokers,
    purchaseCategories,
    addLead,
    addBroker,
    addPurchaseInvoice,
    findDuplicateLeadsByPhone,
  } = useCRM();
  const availableBranches = branches.filter(
    (b) => b.active && canSeeBranch(effectiveUser, b.id, branches),
  );
  const initialBranch =
    effectiveUser.branchId || availableBranches[0]?.id || "";
  const [branchId, setBranchId] = useState(initialBranch);
  const agents = users.filter(
    (u) =>
      u.active &&
      u.branchId === branchId &&
      ["sales_agent", "team_leader", "branch_manager"].includes(u.role),
  );
  const [agentId, setAgentId] = useState(
    effectiveUser.role === "sales_agent"
      ? effectiveUser.id
      : agents.find((u) => u.role === "sales_agent")?.id || effectiveUser.id,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<Department>("decor");
  const [source, setSource] = useState<LeadSource>("walk_in");
  const [sameWhatsapp, setSameWhatsapp] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [brokerMode, setBrokerMode] = useState<"none" | "existing" | "new">(
    "none",
  );
  const [brokerId, setBrokerId] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerPhone, setBrokerPhone] = useState("");
  const [makeInvoice, setMakeInvoice] = useState(false);
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      categoryId: purchaseCategories.find((c) => c.active)?.id || "",
      categoryName: purchaseCategories.find((c) => c.active)?.name || "",
      amount: 0,
    },
  ]);
  const [invoiceStatus, setInvoiceStatus] =
    useState<PurchaseInvoice["status"]>("recorded");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Lead | null>(null);
  const duplicates =
    phone.replace(/\D/g, "").length >= 10
      ? findDuplicateLeadsByPhone(phone)
      : [];
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const selectedAgent = users.find((u) => u.id === agentId);
  const changeBranch = (id: string) => {
    setBranchId(id);
    const candidate = users.find(
      (u) => u.active && u.branchId === id && u.role === "sales_agent",
    );
    setAgentId(candidate?.id || effectiveUser.id);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateCustomer(effectiveUser)) return;
    setError("");
    if (!name.trim() || !/^\+?[\d\s()-]{10,18}$/.test(phone.trim())) {
      setError("اكتب اسم العميل ورقم هاتف صحيح من 10 إلى 15 رقم.");
      return;
    }
    if (duplicates.length) {
      setError("الرقم مسجل بالفعل. افتح ملف العميل الموجود لتكمل التعامل.");
      return;
    }
    if (!sameWhatsapp && !/^\+?[\d\s()-]{10,18}$/.test(whatsapp.trim())) {
      setError("راجع رقم الواتساب، أو اختَر استخدام رقم الهاتف نفسه.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("راجع صيغة البريد الإلكتروني أو سيبه فاضي.");
      return;
    }
    if (!branchId || !agentId) {
      setError("حدد الفرع والموظف المسؤول قبل الحفظ.");
      return;
    }
    if (brokerMode === "existing" && !brokerId) {
      setError("اختَر الوسيط، أو اختَر بدون وسيط.");
      return;
    }
    if (
      brokerMode === "new" &&
      (!brokerName.trim() || !/^\+?[\d\s()-]{10,18}$/.test(brokerPhone.trim()))
    ) {
      setError("بيانات الوسيط تحتاج اسم ورقم هاتف صحيح.");
      return;
    }
    if (
      makeInvoice &&
      (!items.length ||
        items.some(
          (i) => !i.categoryId || i.amount <= 0 || !Number.isFinite(i.amount),
        ))
    ) {
      setError("كل بند في الفاتورة يحتاج تصنيفًا ومبلغًا أكبر من صفر.");
      return;
    }
    let linkedBroker =
      brokerMode === "existing"
        ? brokers.find((b) => b.id === brokerId)
        : undefined;
    if (brokerMode === "new" && canManageCatalog(effectiveUser))
      linkedBroker = addBroker({
        name: brokerName.trim(),
        phone: brokerPhone.trim(),
        type: "individual",
        active: true,
        notes: "",
      });
    const lead = addLead({
      name: name.trim(),
      phone: phone.trim(),
      whatsappPhone: sameWhatsapp ? phone.trim() : whatsapp.trim(),
      isSameWhatsApp: sameWhatsapp,
      email: email.trim() || undefined,
      source: linkedBroker ? "referral" : source,
      customerCategory: "individual",
      companyNameRelationship: linkedBroker
        ? `الوسيط المرتبط: ${linkedBroker.name}`
        : undefined,
      brokerId: linkedBroker?.id,
      brokerName: linkedBroker?.name,
      branchId,
      assignedAgentId: agentId,
      status: "new",
      classification: "B",
      department,
      departmentName: departmentNames[department],
      notes: notes.trim(),
    });
    if (makeInvoice && hasPermission(effectiveUser, "invoices.manage"))
      addPurchaseInvoice({
        date: today(),
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        branchId,
        branchName: lead.branchName,
        agentId,
        agentName: selectedAgent?.name,
        brokerId: linkedBroker?.id,
        brokerName: linkedBroker?.name,
        items,
        totalAmount: total,
        status: invoiceStatus,
        notes: "فاتورة مرتبطة بتسجيل العميل",
      });
    setCreated(lead);
  };
  if (created)
    return (
      <div className="form-page">
        <section className="panel success-card" role="status">
          <CheckCircle2 size={39} strokeWidth={1.4} />
          <span className="eyebrow">بداية علاقة جديدة</span>
          <h1>اتضاف {created.name}.</h1>
          <p>الخطوة الجاية: تواصل مع العميل أو حدد أول متابعة.</p>
          <div className="success-actions">
            {canScheduleFollowUp(effectiveUser, created) && (
              <button
                className="btn-primary"
                onClick={() => onOpenExistingLead(created, "followup")}
              >
                <Plus size={16} />
                تحديد متابعة
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => onOpenExistingLead(created)}
            >
              فتح ملف العميل
              <ArrowUpLeft size={16} />
            </button>
            {canContactCustomer(effectiveUser, created, []) && (
              <a
                className="btn-secondary"
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/${phoneNumber(created.whatsappPhone || created.phone)}?text=${encodeURIComponent(`أهلاً أ/ ${created.name}، معاك فريق البحيري للدهانات والديكور. يسعدنا نساعدك في طلبك.`)}`}
              >
                <MessageCircle size={16} />
                رسالة ترحيب
              </a>
            )}
          </div>
          <p className="quiet-note">
            البيانات محفوظة على هذا الجهاز. لم يتم تأكيد المزامنة مع باقي
            الأجهزة.
          </p>
          <button className="btn-text" onClick={() => onSuccessNavigate()}>
            العودة للعملاء
            <ArrowRight size={15} />
          </button>
        </section>
      </div>
    );
  if (!canCreateCustomer(effectiveUser)) return null;
  return (
    <div className="form-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">العملاء / تسجيل جديد</span>
          <h1>نبدأ بالأساسيات.</h1>
          <p>الاسم ورقم الهاتف مطلوبان. التفاصيل الإضافية تقدر تكملها بعدين.</p>
        </div>
        <button className="btn-text" onClick={() => onSuccessNavigate()}>
          <ArrowRight size={15} />
          رجوع
        </button>
      </div>
      {availableBranches.length === 0 && (
        <p className="notice warning" role="alert">
          لسه مفيش أي فرع مسجّل. أضف الفرع الأول من «إدارة المؤسسة ← الهيكل الإداري»، وأضف موظفين من «الموظفون»، وبعدها سجّل عملاءك.
        </p>
      )}
      <form className="panel" onSubmit={submit} noValidate>
        <section className="form-section">
          <div className="section-title">
            <span className="section-number">01</span>
            <div>
              <h2>بيانات العميل</h2>
              <p>عشان نعرفه ونقدر نتواصل معاه.</p>
            </div>
          </div>
          <div className="field-grid">
            <NameWithTitle value={name} onChange={setName} required />
            <label className="field">
              <span>
                رقم الهاتف <em>مطلوب</em>
              </span>
              <input
                name="customerPhone"
                autoComplete="tel"
                dir="ltr"
                type="tel"
                required
                inputMode="tel"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            {!!duplicates.length && (
              <div className="notice warning full-width" role="status">
                الرقم ده موجود عندنا باسم {duplicates[0].name}.
                <button
                  type="button"
                  onClick={() => onOpenExistingLead(duplicates[0])}
                >
                  فتح الملف الموجود
                  <ArrowUpLeft size={13} />
                </button>
              </div>
            )}
            <label className="field">
              <span>مهتم بإيه؟</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
              >
                {Object.entries(departmentNames).map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>عرفنا منين؟</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
              >
                {Object.entries(sourceNames).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <details className="optional-section">
          <summary>
            <UserRound size={18} />
            <span>الفرع والموظف المسؤول</span>
            <ChevronDown size={16} />
          </summary>
          <div className="optional-content">
            <p className="quiet-note" style={{ padding: "0 0 18px" }}>
              محدد تلقائيًا:{" "}
              {branches.find((b) => b.id === branchId)?.name || "لم يُحدد"} ·{" "}
              {selectedAgent?.name || "لم يُحدد"}
            </p>
            <div className="field-grid">
              <label className="field">
                <span>الفرع</span>
                <select
                  aria-label="فرع العميل"
                  value={branchId}
                  onChange={(e) => changeBranch(e.target.value)}
                >
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>الموظف المسؤول</span>
                <select
                  aria-label="الموظف المسؤول"
                  value={agentId}
                  disabled={!canAssignCustomers(effectiveUser)}
                  onChange={(e) => setAgentId(e.target.value)}
                >
                  {[
                    ...agents,
                    ...(agents.some((u) => u.id === effectiveUser.id)
                      ? []
                      : [effectiveUser]),
                  ].map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </details>
        <details className="optional-section">
          <summary>
            <SlidersHorizontal size={18} />
            <span>
              تفاصيل إضافية <em className="optional-tag">اختياري</em>
            </span>
            <ChevronDown size={16} />
          </summary>
          <div className="optional-content">
            <div className="field-grid">
              <label className="checkbox-line full-width">
                <input
                  type="checkbox"
                  checked={sameWhatsapp}
                  onChange={(e) => setSameWhatsapp(e.target.checked)}
                />
                رقم الواتساب هو نفس رقم الهاتف
              </label>
              {!sameWhatsapp && (
                <label className="field">
                  <span>رقم الواتساب</span>
                  <input
                    type="tel"
                    dir="ltr"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </label>
              )}
              <label className="field">
                <span>
                  البريد الإلكتروني <em>اختياري</em>
                </span>
                <input
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="field full-width">
                <span>
                  ملاحظات <em>اختياري</em>
                </span>
                <textarea
                  rows={3}
                  placeholder="تفاصيل تساعد زميلك يكمل من مكانك…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>
          </div>
        </details>
        <details className="optional-section">
          <summary>
            <UserRound size={18} />
            <span>
              ربط وسيط أو جهة ترشيح <em className="optional-tag">اختياري</em>
            </span>
            <ChevronDown size={16} />
          </summary>
          <div className="optional-content">
            <label className="field">
              <span>جهة الترشيح</span>
              <select
                value={brokerMode}
                onChange={(e) =>
                  setBrokerMode(e.target.value as typeof brokerMode)
                }
              >
                <option value="none">بدون وسيط</option>
                <option value="existing">وسيط مسجل عندنا</option>
                {canManageCatalog(effectiveUser) && (
                  <option value="new">إضافة وسيط جديد</option>
                )}
              </select>
            </label>
            {brokerMode === "existing" && (
              <label className="field" style={{ marginTop: 18 }}>
                <span>اختَر الوسيط</span>
                <select
                  value={brokerId}
                  onChange={(e) => setBrokerId(e.target.value)}
                >
                  <option value="">اختَر من القائمة</option>
                  {brokers
                    .filter((b) => b.active)
                    .map((b) => (
                      <option value={b.id} key={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {brokerMode === "new" && (
              <div className="field-grid" style={{ marginTop: 18 }}>
                <label className="field">
                  <span>
                    اسم الوسيط <em>مطلوب عند الإضافة</em>
                  </span>
                  <input
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>
                    رقم هاتف الوسيط <em>مطلوب عند الإضافة</em>
                  </span>
                  <input
                    type="tel"
                    dir="ltr"
                    value={brokerPhone}
                    onChange={(e) => setBrokerPhone(e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        </details>
        <details className="optional-section">
          <summary>
            <FileText size={18} />
            <span>
              إضافة فاتورة <em className="optional-tag">اختياري</em>
            </span>
            <ChevronDown size={16} />
          </summary>
          <div className="optional-content">
            <label className="checkbox-line">
              <input
                type="checkbox"
                disabled={!hasPermission(effectiveUser, "invoices.manage")}
                checked={makeInvoice}
                onChange={(e) => setMakeInvoice(e.target.checked)}
              />
              العميل عنده مشتريات وعايز أسجلها دلوقتي
            </label>
            {makeInvoice && (
              <div style={{ marginTop: 20 }}>
                {items.map((item, index) => (
                  <div
                    className="field-grid"
                    style={{ marginBottom: 15 }}
                    key={index}
                  >
                    <label className="field">
                      <span>التصنيف</span>
                      <select
                        value={item.categoryId}
                        onChange={(e) =>
                          setItems(
                            items.map((v, i) =>
                              i === index
                                ? {
                                    ...v,
                                    categoryId: e.target.value,
                                    categoryName:
                                      purchaseCategories.find(
                                        (c) => c.id === e.target.value,
                                      )?.name || "",
                                  }
                                : v,
                            ),
                          )
                        }
                      >
                        {purchaseCategories
                          .filter((c) => c.active)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>المبلغ بالجنيه</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.amount || ""}
                        onChange={(e) =>
                          setItems(
                            items.map((v, i) =>
                              i === index
                                ? { ...v, amount: Number(e.target.value) }
                                : v,
                            ),
                          )
                        }
                      />
                    </label>
                    {items.length > 1 && (
                      <button
                        className="btn-text"
                        type="button"
                        onClick={() =>
                          setItems(items.filter((_, i) => i !== index))
                        }
                      >
                        حذف البند
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-text"
                  onClick={() =>
                    setItems([
                      ...items,
                      {
                        categoryId:
                          purchaseCategories.find((c) => c.active)?.id || "",
                        categoryName:
                          purchaseCategories.find((c) => c.active)?.name || "",
                        amount: 0,
                      },
                    ])
                  }
                >
                  <Plus size={15} />
                  بند آخر
                </button>
                <p className="table-secondary">
                  إجمالي المشتريات: <strong>{formatMoney(total)} ج.م</strong>
                </p>
              </div>
            )}
          </div>
        </details>
        {error && (
          <div
            className="notice warning"
            style={{ margin: "0 20px 20px" }}
            role="alert"
          >
            {error}
          </div>
        )}
        <div className="form-actions">
          <p>
            هنفتح لك الخطوة التالية بعد التسجيل. التفاصيل الاختيارية مش هتعطّل
            حفظ العميل.
          </p>
          <div>
            <button
              className="btn-text"
              type="button"
              onClick={() => onSuccessNavigate()}
            >
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} />
              حفظ العميل
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
