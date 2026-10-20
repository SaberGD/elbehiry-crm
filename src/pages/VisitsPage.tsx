import { BrokerSearch } from "../components/common/BrokerSearch";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpLeft, CheckCircle2, ChevronDown, Handshake, MessageSquare, PlusCircle, ShoppingBag, UserRound, Users, CalendarClock, SlidersHorizontal } from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { canCreateCustomer, canSeeBranch } from "../lib/access";
import { hasPermission } from "../lib/permissions";
import { departmentNames, sourceNames } from "../lib/presentation";
import { FilterBar, inDateRange } from "../components/common/FilterBar";
import { NameWithTitle } from "../components/common/NameWithTitle";
import { InterestPicker, interestNames } from "../components/common/InterestPicker";
import { PurchaseCategorySelector } from "../components/common/PurchaseCategorySelector";
import { VoiceNoteField } from "../components/common/VoiceNoteField";
import type { Department, InvoiceLineItem, Lead, LeadSource, Visit, VisitorType } from "../types/crm";

interface Props {
  onOpenLead: (leadId: string) => void;
}

const typeLabels: Record<VisitorType, string> = { client: "عميل", broker: "وسيط", both: "عميل ومعاه وسيط" };
const typeChoices: { id: VisitorType; title: string; hint: string; Icon: typeof UserRound }[] = [
  { id: "client", title: "عميل", hint: "جه لنفسه", Icon: UserRound },
  { id: "broker", title: "وسيط", hint: "مقاول أو مهندس جه لوحده", Icon: Handshake },
  { id: "both", title: "عميل ومعاه وسيط", hint: "الوسيط هو اللي جابه", Icon: Users },
];
const outcomes = ["تم الشراء", "لسه", "استفسار فقط"] as const;

export function VisitsPage({ onOpenLead }: Props) {
  const { effectiveUser, visits, branches, users, leads, brokers, addVisit, addBroker, addPurchaseInvoice, updateLead } = useCRM();
  const [mode, setMode] = useState<"list" | "form">("list");
  const [notice, setNotice] = useState("");

  // ---------- list filters ----------
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const [fBranch, setFBranch] = useState("all");
  const [fAgent, setFAgent] = useState("all");
  const [fOutcome, setFOutcome] = useState("all");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const resetFilters = () => {
    setQ("");
    setFType("all");
    setFBranch("all");
    setFAgent("all");
    setFOutcome("all");
    setFFrom("");
    setFTo("");
  };
  const uniq = (l: string[]) => [...new Set(l.filter(Boolean))];
  const rows = visits.filter((v) => {
    const t = q.trim().toLowerCase();
    return (
      (!t || [v.visitorName, v.phone, v.reason, v.outcome, v.brokerName].some((x) => (x || "").toLowerCase().includes(t))) &&
      (fType === "all" || (v.visitorType || "client") === fType) &&
      (fBranch === "all" || v.branchId === fBranch) &&
      (fAgent === "all" || v.receivedByAgentId === fAgent) &&
      (fOutcome === "all" || v.outcome === fOutcome) &&
      inDateRange(v.date, fFrom, fTo)
    );
  });

  // ---------- the form ----------
  const availableBranches = branches.filter((b) => b.active && canSeeBranch(effectiveUser, b.id, branches));
  const [type, setType] = useState<VisitorType>("client");
  const [clientMode, setClientMode] = useState<"existing" | "new">("new");
  const [clientSearch, setClientSearch] = useState("");
  const [pickedLead, setPickedLead] = useState<Lead | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<Department[]>(["decor"]);
  const [brokerMode, setBrokerMode] = useState<"existing" | "new">("existing");
  const [brokerId, setBrokerId] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerPhone, setBrokerPhone] = useState("");
  const [branchId, setBranchId] = useState(effectiveUser.branchId || availableBranches[0]?.id || "");
  const agents = users.filter((u) => u.active && u.branchId === branchId && ["sales_agent", "team_leader", "branch_manager"].includes(u.role));
  const [agentId, setAgentId] = useState(effectiveUser.id);
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState<string>("");
  const [source, setSource] = useState<LeadSource>("walk_in");
  const [notes, setNotes] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bought, setBought] = useState(false);
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [followUp, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState("");

  const hasClient = type !== "broker";
  const hasBroker = type !== "client";
  const validAgent = agents.some((u) => u.id === agentId) ? agentId : agents.find((u) => u.id === effectiveUser.id)?.id || agents[0]?.id || effectiveUser.id;
  const matches = useMemo(() => {
    const t = clientSearch.trim().toLowerCase();
    if (!t) return [];
    return leads.filter((l) => l.name.toLowerCase().includes(t) || l.phone.includes(t)).slice(0, 6);
  }, [clientSearch, leads]);
  const typedPhone = phone.replace(/\D/g, "");
  const duplicate = hasClient && clientMode === "new" && typedPhone.length >= 10 ? leads.find((l) => l.phone.replace(/\D/g, "") === typedPhone) : undefined;
  const activeBrokers = brokers.filter((b) => b.active);
  const pickedBroker = brokers.find((b) => b.id === brokerId);
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const openForm = () => {
    setType("client");
    setClientMode("new");
    setClientSearch("");
    setPickedLead(null);
    setName("");
    setPhone("");
    setInterests(["decor"]);
    setBrokerMode(activeBrokers.length ? "existing" : "new");
    setBrokerId("");
    setBrokerName("");
    setBrokerPhone("");
    setBranchId(effectiveUser.branchId || availableBranches[0]?.id || "");
    setAgentId(effectiveUser.id);
    setReason("");
    setOutcome("");
    setSource("walk_in");
    setNotes("");
    setWhatsapp("");
    setBought(false);
    setItems([]);
    setFollowUp(false);
    setFollowUpDate("");
    setError("");
    setNotice("");
    setMode("form");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateCustomer(effectiveUser)) return;
    setError("");
    const clientName = pickedLead ? pickedLead.name : name.trim();
    const clientPhone = pickedLead ? pickedLead.phone : phone.trim();
    if (hasClient && (!clientName || !/^\+?[\d\s()-]{10,18}$/.test(clientPhone))) return setError("اكتب اسم العميل ورقم هاتف صحيح، أو اختار عميل مسجّل.");
    if (hasBroker && brokerMode === "existing" && !pickedBroker) return setError("اكتب اسم الوسيط واختاره من النتايج، أو أضفه كوسيط جديد.");
    if (hasBroker && brokerMode === "new" && (!brokerName.trim() || !/^\+?[\d\s()-]{10,18}$/.test(brokerPhone.trim()))) return setError("اكتب اسم الوسيط ورقم هاتفه.");
    if (bought && hasClient && (!items.length || items.some((i) => !(i.amount > 0)))) return setError("حدد القسم اللي اشترى منه ومبلغه، أو شيل علامة «اشترى».");
    if (followUp && hasClient && !followUpDate) return setError("حدد تاريخ المتابعة.");
    if (!agents.some((u) => u.id === validAgent) && validAgent !== effectiveUser.id) return setError("اختار موظف نشط من نفس الفرع.");

    // The broker: pick the existing one or register the new one.
    const broker = hasBroker ? (brokerMode === "existing" ? pickedBroker : addBroker({ name: brokerName.trim(), phone: brokerPhone.trim(), type: "individual", active: true, notes: "", branchIds: [branchId] })) : undefined;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const bits = [notes.trim()];
    const finalOutcome = bought ? "تم الشراء" : outcome || "لسه";
    try {
      const visit = addVisit({
        visitorType: type,
        brokerId: broker?.id,
        brokerName: broker?.name,
        interests: hasClient && !pickedLead ? interests : undefined,
        visitorName: hasClient ? clientName : broker!.name,
        phone: hasClient ? clientPhone : broker!.phone,
        whatsappPhone: hasClient ? whatsapp.trim() || clientPhone : broker!.phone,
        date,
        time: now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        branchId,
        receivedByAgentId: validAgent,
        source,
        department: interests[0],
        reason: reason.trim() || "زيارة للفرع",
        outcome: finalOutcome,
        notes: bits.filter(Boolean).join(" | "),
        hasPreviousRecord: false,
        linkedLeadId: pickedLead?.id,
        requiresFollowUp: hasClient && followUp,
        followUpAgentId: validAgent,
        followUpDate: hasClient && followUp ? followUpDate : undefined,
      });
      // A customer who came with a broker belongs to that broker; the purchase is credited to them.
      if (hasClient && broker && visit.linkedLeadId) {
        const lead = leads.find((l) => l.id === visit.linkedLeadId);
        // A brand-new customer already got the broker when the visit created them.
        if (lead && !lead.brokerId) updateLead(visit.linkedLeadId, { brokerId: broker.id, brokerName: broker.name });
      }
      if (hasClient && bought && total > 0 && visit.linkedLeadId && hasPermission(effectiveUser, "invoices.manage")) {
        addPurchaseInvoice({
          date,
          leadId: visit.linkedLeadId,
          leadName: clientName,
          leadPhone: clientPhone,
          branchId,
          branchName: branches.find((b) => b.id === branchId)?.name,
          agentId: validAgent,
          agentName: users.find((u) => u.id === validAgent)?.name,
          brokerId: broker?.id,
          brokerName: broker?.name,
          items,
          totalAmount: total,
          status: "recorded",
          notes: `مشتريات زيارة الفرع بتاريخ ${date}`,
        });
      }
      setNotice(`اتسجلت الزيارة${hasClient ? ` وملف ${clientName} موجود في العملاء` : ""}.`);
      setMode("list");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تسجيل الزيارة.");
    }
  };

  // ---------- list ----------
  if (mode === "list")
    return (
      <div>
        <div className="page-heading">
          <div>
            <span className="eyebrow">اللي بيزور الفروع</span>
            <h1>الزيارات</h1>
            <p>سجّل مين جه الفرع: عميل، أو وسيط، أو عميل ومعاه وسيط. أي عميل بيتسجل هنا بيظهر لوحده في العملاء.</p>
          </div>
          {canCreateCustomer(effectiveUser) && (
            <button className="btn-primary" onClick={openForm}>
              <PlusCircle size={16} />
              تسجيل زيارة
            </button>
          )}
        </div>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        <section className="panel">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "ابحث باسم الزائر أو الوسيط أو الهاتف…" }}
            selects={[
              { id: "type", label: "نوع الزائر", value: fType, onChange: setFType, allLabel: "كل الزوار", primary: true, options: (Object.keys(typeLabels) as VisitorType[]).map((t) => ({ value: t, label: typeLabels[t] })) },
              { id: "branch", label: "الفرع", value: fBranch, onChange: setFBranch, allLabel: "كل الفروع", primary: true, options: uniq(visits.map((v) => v.branchId)).map((id) => ({ value: id, label: visits.find((v) => v.branchId === id)?.branchName || id })) },
              { id: "agent", label: "الموظف المستقبِل", value: fAgent, onChange: setFAgent, allLabel: "كل الموظفين", options: uniq(visits.map((v) => v.receivedByAgentId)).map((id) => ({ value: id, label: visits.find((v) => v.receivedByAgentId === id)?.receivedByAgentName || id })) },
              { id: "outcome", label: "نتيجة الزيارة", value: fOutcome, onChange: setFOutcome, allLabel: "كل النتائج", options: uniq(visits.map((v) => v.outcome)).map((o) => ({ value: o, label: o })) },
            ]}
            dates={{ from: fFrom, to: fTo, onFrom: setFFrom, onTo: setFTo, label: "تاريخ الزيارة" }}
            count={{ shown: rows.length, noun: "زيارة" }}
            onReset={resetFilters}
          />
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="data-table stack-table">
                <thead>
                  <tr>
                    <th>الزائر</th>
                    <th>التاريخ</th>
                    <th>الفرع</th>
                    <th>السبب والنتيجة</th>
                    <th>استقبله</th>
                    <th>الملف</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((v: Visit) => {
                    const t = v.visitorType || "client";
                    return (
                      <tr key={v.id}>
                        <td data-label="الزائر">
                          <strong>{v.visitorName}</strong>
                          <span className="table-secondary" dir="ltr" style={{ textAlign: "end" }}>
                            {v.phone || "—"}
                          </span>
                          <span className="status-pill" style={{ marginTop: 4 }}>
                            {typeLabels[t]}
                            {t === "both" && v.brokerName ? `: ${v.brokerName}` : ""}
                          </span>
                        </td>
                        <td data-label="التاريخ" style={{ whiteSpace: "nowrap" }}>
                          {v.date}
                          <span className="table-secondary">{v.time}</span>
                        </td>
                        <td data-label="الفرع">{v.branchName}</td>
                        <td data-label="السبب والنتيجة">
                          {v.reason}
                          <span className="table-secondary">{v.outcome}</span>
                        </td>
                        <td data-label="استقبله">{v.receivedByAgentName}</td>
                        <td data-label="الملف">
                          {v.linkedLeadId ? (
                            <button className="btn-text" onClick={() => onOpenLead(v.linkedLeadId!)}>
                              ملف العميل
                              <ArrowUpLeft size={13} />
                            </button>
                          ) : (
                            <span className="table-secondary">{t === "broker" ? "وسيط" : "—"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>مفيش زيارات تطابق البحث</h3>
              <p>سجّل أول زيارة بزر «تسجيل زيارة».</p>
            </div>
          )}
        </section>
      </div>
    );

  // ---------- form ----------
  return (
    <div className="form-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">الزيارات / تسجيل جديد</span>
          <h1>مين زار الفرع؟</h1>
          <p>اختار نوع الزائر وكمّل الأساسيات. الباقي اختياري تفتحه لو محتاجه.</p>
        </div>
        <button className="btn-text" onClick={() => setMode("list")}>
          <ArrowRight size={15} />
          رجوع
        </button>
      </div>
      <form className="panel" onSubmit={submit} noValidate>
        <section className="form-section">
          <div className="section-title">
            <span className="section-number">01</span>
            <div>
              <h2>الزائر</h2>
              <p>عميل، أو وسيط، أو عميل جاي معاه وسيط.</p>
            </div>
          </div>
          <div className="visitor-types" role="radiogroup" aria-label="نوع الزائر">
            {typeChoices.map(({ id, title, hint, Icon }) => (
              <button type="button" key={id} role="radio" aria-checked={type === id} className={type === id ? "on" : ""} onClick={() => setType(id)}>
                <Icon size={20} />
                <strong>{title}</strong>
                <small>{hint}</small>
              </button>
            ))}
          </div>

          {hasClient && (
            <div className="party-block">
              <h3>العميل</h3>
              <div className="tab-filter" role="group" aria-label="العميل">
                <button type="button" aria-pressed={clientMode === "new"} onClick={() => { setClientMode("new"); setPickedLead(null); }}>
                  عميل جديد
                </button>
                <button type="button" aria-pressed={clientMode === "existing"} onClick={() => setClientMode("existing")}>
                  عميل مسجّل
                </button>
              </div>
              {clientMode === "existing" ? (
                pickedLead ? (
                  <p className="notice" role="status">
                    <strong>{pickedLead.name}</strong> · <span dir="ltr">{pickedLead.phone}</span>
                    <button type="button" className="btn-text" onClick={() => setPickedLead(null)}>
                      تغيير
                    </button>
                  </p>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input className="review-input" placeholder="ابحث باسم العميل أو رقمه…" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                    {matches.length > 0 && (
                      <div className="picker-list">
                        {matches.map((l) => (
                          <button type="button" key={l.id} onClick={() => { setPickedLead(l); setClientSearch(""); if (l.branchId) setBranchId(l.branchId); }}>
                            <strong>{l.name}</strong>
                            <small dir="ltr">{l.phone}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="field-grid">
                  <NameWithTitle value={name} onChange={setName} required />
                  <label className="field">
                    <span>
                      رقم الهاتف <em>مطلوب</em>
                    </span>
                    <input dir="ltr" type="tel" inputMode="tel" placeholder="01xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </label>
                  {duplicate && (
                    <div className="notice warning full-width" role="status">
                      الرقم ده موجود عندنا باسم {duplicate.name}، والزيارة هتتسجل على ملفه.
                      <button type="button" onClick={() => { setPickedLead(duplicate); setClientMode("existing"); }}>
                        استخدم الملف الموجود
                      </button>
                    </div>
                  )}
                  <div className="full-width">
                    <InterestPicker value={interests} onChange={setInterests} />
                  </div>
                </div>
              )}
            </div>
          )}

          {hasBroker && (
            <div className="party-block">
              <h3>الوسيط</h3>
              {brokerMode === "existing" ? (
                <BrokerSearch
                  label="دوّر على الوسيط"
                  brokers={activeBrokers}
                  value={brokerId}
                  onChange={setBrokerId}
                  onCreate={(name) => {
                    setBrokerName(name);
                    setBrokerId("");
                    setBrokerMode("new");
                  }}
                />
              ) : (
                <div className="field-grid">
                  <NameWithTitle value={name} onChange={setName} required />
                  <label className="field">
                    <span>
                      رقم الهاتف <em>مطلوب</em>
                    </span>
                    <input dir="ltr" type="tel" inputMode="tel" placeholder="01xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </label>
                  {duplicate && (
                    <div className="notice warning full-width" role="status">
                      الرقم ده موجود عندنا باسم {duplicate.name}، والزيارة هتتسجل على ملفه.
                      <button type="button" onClick={() => { setPickedLead(duplicate); setClientMode("existing"); }}>
                        استخدم الملف الموجود
                      </button>
                    </div>
                  )}
                  <div className="full-width">
                    <InterestPicker value={interests} onChange={setInterests} />
                  </div>
                </div>
              )}
            </div>
          )}

          {hasBroker && (
            <div className="party-block">
              <h3>الوسيط</h3>
              <div className="tab-filter" role="group" aria-label="الوسيط">
                <button type="button" aria-pressed={brokerMode === "existing"} onClick={() => setBrokerMode("existing")} disabled={!activeBrokers.length}>
                  وسيط مسجّل
                </button>
                <button type="button" aria-pressed={brokerMode === "new"} onClick={() => setBrokerMode("new")}>
                  وسيط جديد
                </button>
              </div>
              {brokerMode === "existing" ? (
                <label className="field">
                  <span>اختار الوسيط</span>
                  <select value={brokerId} onChange={(e) => setBrokerId(e.target.value)}>
                    <option value="">اختار من القايمة</option>
                    {activeBrokers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} · {b.phone}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="field-grid">
                  <label className="field">
                    <span>
                      اسم الوسيط <em>مطلوب</em>
                    </span>
                    <input value={brokerName} onChange={(e) => setBrokerName(e.target.value)} />
                  </label>
                  <label className="field">
                    <span>
                      رقم الوسيط <em>مطلوب</em>
                    </span>
                    <input dir="ltr" type="tel" inputMode="tel" placeholder="01xxxxxxxxx" value={brokerPhone} onChange={(e) => setBrokerPhone(e.target.value)} />
                  </label>
                </div>
              )}
              {brokerMode === "new" && activeBrokers.length > 0 && (
                <button type="button" className="btn-text" onClick={() => setBrokerMode("existing")}>
                  ← دوّر في الوسطاء المسجلين بدل كده
                </button>
              )}
              {type === "both" && <p className="quiet-note">لو العميل اشترى، المبلغ بيتحسب على الوسيط لأنه هو اللي دخّله.</p>}
            </div>
          )}

          <label className="field" style={{ marginTop: 18 }}>
            <span>
              سبب الزيارة <em>اختياري</em>
            </span>
            <input placeholder="استفسار، معاينة، عرض سعر…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {!bought && (
            <div className="field">
              <span>
                نتيجة الزيارة <em>اختياري</em>
              </span>
              <div className="interest-chips" role="group" aria-label="نتيجة الزيارة">
                {outcomes
                  .filter((o) => o !== "تم الشراء")
                  .map((o) => (
                    <button type="button" key={o} aria-pressed={outcome === o} className={outcome === o ? "on" : ""} onClick={() => setOutcome(outcome === o ? "" : o)}>
                      {o}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </section>

        <details className="optional-section">
          <summary>
            <UserRound size={18} />
            <span>الفرع والموظف المستقبِل</span>
            <ChevronDown size={16} />
          </summary>
          <div className="optional-content">
            <p className="quiet-note" style={{ padding: "0 0 18px" }}>
              محدد تلقائيًا: {branches.find((b) => b.id === branchId)?.name || "لم يُحدد"} · {users.find((u) => u.id === validAgent)?.name || "لم يُحدد"}
            </p>
            <div className="field-grid">
              <label className="field">
                <span>الفرع</span>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>الموظف المستقبِل</span>
                <select value={validAgent} onChange={(e) => setAgentId(e.target.value)}>
                  {[...agents, ...(agents.some((u) => u.id === effectiveUser.id) ? [] : [effectiveUser])].map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </details>

        {hasClient && (
          <details className="optional-section" open={bought || undefined}>
            <summary>
              <ShoppingBag size={18} />
              <span>
                المشتريات <em className="optional-tag">اختياري</em>
              </span>
              <ChevronDown size={16} />
            </summary>
            <div className="optional-content">
              <label className="checkbox-line">
                <input type="checkbox" checked={bought} onChange={(e) => setBought(e.target.checked)} />
                العميل اشترى حاجة في الزيارة دي
              </label>
              {bought && <PurchaseCategorySelector items={items} onChange={setItems} title="مشتريات الزيارة" subtitle="دوس على القسم اللي اشترى منه وحدد دفع فيه كام بالجنيه" />}
            </div>
          </details>
        )}

        {hasClient && hasPermission(effectiveUser, "followups.create") && (
          <details className="optional-section" open={followUp || undefined}>
            <summary>
              <CalendarClock size={18} />
              <span>
                متابعة بعد الزيارة <em className="optional-tag">اختياري</em>
              </span>
              <ChevronDown size={16} />
            </summary>
            <div className="optional-content">
              <label className="checkbox-line">
                <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} />
                العميل ده محتاج متابعة
              </label>
              {followUp && (
                <label className="field" style={{ marginTop: 12 }}>
                  <span>ميعاد المتابعة</span>
                  <input type="date" value={followUpDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setFollowUpDate(e.target.value)} />
                </label>
              )}
            </div>
          </details>
        )}

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
              <label className="field">
                <span>عرفنا منين؟</span>
                <select value={source} onChange={(e) => setSource(e.target.value as LeadSource)}>
                  {Object.entries(sourceNames).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {hasClient && (
                <label className="field">
                  <span>رقم الواتساب (لو غير الهاتف)</span>
                  <input dir="ltr" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                </label>
              )}
              <div className="field full-width">
                <span>
                  ملاحظات <em>اختياري</em>
                </span>
                <VoiceNoteField value={notes} onChange={setNotes} rows={3} placeholder="اكتب أو سجّل صوت بكل اللي حصل في الزيارة…" />
              </div>
            </div>
          </div>
        </details>

        {error && (
          <div className="notice warning" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <p>العميل اللي بتسجله هنا بيتضاف لوحده في العملاء، والتفاصيل الاختيارية مش هتعطّل الحفظ.</p>
          <div>
            <button className="btn-text" type="button" onClick={() => setMode("list")}>
              إلغاء
            </button>
            <button className="btn-primary" type="submit">
              <CheckCircle2 size={16} />
              حفظ الزيارة
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
