import { useAllData } from "../lib/useAllData";
import { useAllLeads } from "../lib/useAllLeads";
import { useDebounced } from "../lib/useDebounced";
import { usePagedList } from "../lib/usePagedList";
import { findLeadsByPhone, searchLeads } from "../lib/leadQueries";
import { visitParty } from "../lib/leadSearch";
import { profileOf, scopesFor } from "../lib/scopes";
import type { ScopeFilter } from "../lib/useFirestoreSync";
import { PageGuide } from "../components/common/PageGuide";
import { BrokerSearch } from "../components/common/BrokerSearch";
import { CustomerSearch } from "../components/common/CustomerSearch";
import { PostVisitReview, type VisitReviewTarget } from "../components/common/PostVisitReview";
import { CustomerRatingModal } from "../components/common/CustomerRatingModal";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpLeft, CheckCircle2, ChevronDown, Handshake, MessageSquare, PlusCircle, ShoppingBag, UserRound, Users, CalendarClock, SlidersHorizontal } from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { branchAgents, canCreateCustomer, canSeeBranch, defaultAgent } from "../lib/access";
import { hasPermission } from "../lib/permissions";
import { departmentNames, sourceNames } from "../lib/presentation";
import { FilterBar, inDateRange } from "../components/common/FilterBar";
import { NameWithTitle } from "../components/common/NameWithTitle";
import { InterestPicker, interestNames } from "../components/common/InterestPicker";
import { purchaseFromItems } from "../lib/purchases";
import { OutcomeSection, emptyOutcome, outcomeError, outcomeLabel, type OutcomeState } from "../components/common/OutcomeSection";
import { VoiceNoteField } from "../components/common/VoiceNoteField";
import { addToDate } from "../lib/postSale";
import { reasonLabel } from "../lib/notBought";
import type { Department, Lead, LeadSource, Visit, VisitorType } from "../types/crm";

interface Props {
  onOpenLead: (leadId: string) => void;
}

const typeLabels: Record<VisitorType, string> = { client: "عميل", broker: "وسيط", both: "عميل ومعاه وسيط" };
const typeChoices: { id: VisitorType; title: string; hint: string; Icon: typeof UserRound }[] = [
  { id: "client", title: "عميل", hint: "جه لنفسه", Icon: UserRound },
  { id: "broker", title: "وسيط", hint: "مقاول أو مهندس جه لوحده", Icon: Handshake },
  { id: "both", title: "عميل ومعاه وسيط", hint: "الوسيط هو اللي جابه", Icon: Users },
];

export function VisitsPage({ onOpenLead }: Props) {
  const { effectiveUser, visits, branches, users, leads, brokers, addVisit, addBroker, addBooking, addNotBoughtRecord, updateLead, injectLeads, injectVisits, searchIndexReady, visitSearchReady } = useCRM();
  // Customers and visits are asked of the database (a page of visits, a handful of matching customers). Until their
  // search keys are built, the screen works on the full lists as it used to.
  const [lookupFailed, setLookupFailed] = useState(false);
  const serverLookup = searchIndexReady && !lookupFailed;
  useAllLeads(!serverLookup);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [notice, setNotice] = useState("");
  // Offered right after saving a visit of a customer: optional, one tap.
  const [reviewFor, setReviewFor] = useState<{ leadId: string; label: string } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [justSaved, setJustSaved] = useState<VisitReviewTarget | null>(null);

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
  const typedQuery = useDebounced(q, 300);
  const listFilters = useMemo<ScopeFilter[]>(
    () => [
      // A visit with no type written down is a customer's, so that filter is checked on the rows (see `keep` below).
      ...(fType !== "all" && fType !== "client" ? [["visitorType", "==", fType] as ScopeFilter] : []),
      ...(fBranch !== "all" ? [["branchId", "==", fBranch] as ScopeFilter] : []),
      ...(fAgent !== "all" ? [["receivedByAgentId", "==", fAgent] as ScopeFilter] : []),
      ...(fOutcome !== "all" ? [["outcome", "==", fOutcome] as ScopeFilter] : []),
      ...(fFrom ? [["date", ">=", fFrom] as ScopeFilter] : []),
      ...(fTo ? [["date", "<=", fTo] as ScopeFilter] : []),
    ],
    [fType, fBranch, fAgent, fOutcome, fFrom, fTo],
  );
  const visitScope = useMemo(
    () => scopesFor(profileOf(effectiveUser)).visits,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveUser.id, effectiveUser.role, effectiveUser.branchId, JSON.stringify(effectiveUser.supervisedBranchIds ?? [])],
  );
  const list = usePagedList<Visit>({
    collection: "visits",
    scope: visitScope,
    filters: listFilters,
    text: typedQuery,
    orderField: "date",
    pageSize: 20,
    searchReady: visitSearchReady,
    toParty: visitParty,
    keep: fType === "client" ? (v) => (v.visitorType || "client") === "client" : undefined,
    listKey: fType,
    scopeFields: ["branchId", "receivedByAgentId"],
    inject: injectVisits,
  });
  const legacy = list.needsFullList;
  useAllData(["visits"], legacy);
  const [shown, setShown] = useState(20);
  useEffect(() => setShown(20), [typedQuery, fType, fBranch, fAgent, fOutcome, fFrom, fTo]);
  const legacyRows = useMemo(() => {
    if (!legacy) return [];
    const t = typedQuery.trim().toLowerCase();
    return visits
      .filter(
        (v) =>
          (!t || [v.visitorName, v.phone, v.reason, v.outcome, v.brokerName].some((x) => (x || "").toLowerCase().includes(t))) &&
          (fType === "all" || (v.visitorType || "client") === fType) &&
          (fBranch === "all" || v.branchId === fBranch) &&
          (fAgent === "all" || v.receivedByAgentId === fAgent) &&
          (fOutcome === "all" || v.outcome === fOutcome) &&
          inDateRange(v.date, fFrom, fTo),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [legacy, visits, typedQuery, fType, fBranch, fAgent, fOutcome, fFrom, fTo]);
  const rows: Visit[] = legacy ? legacyRows.slice(0, shown) : list.rows;
  const rowsTotal = legacy ? legacyRows.length : list.total;
  const hasMoreRows = legacy ? legacyRows.length > shown : list.hasMore;

  // ---------- the form ----------
  const availableBranches = branches.filter((b) => b.active && canSeeBranch(effectiveUser, b.id, branches));
  const [type, setType] = useState<VisitorType>("client");
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [pickedLead, setPickedLead] = useState<Lead | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interests, setInterests] = useState<Department[]>(["decor"]);
  const [brokerMode, setBrokerMode] = useState<"existing" | "new">("existing");
  const [brokerId, setBrokerId] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerPhone, setBrokerPhone] = useState("");
  const [branchId, setBranchId] = useState(effectiveUser.branchId || availableBranches[0]?.id || "");
  const agents = branchAgents(users, branchId);
  const [agentId, setAgentId] = useState(effectiveUser.id);
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState<OutcomeState>(emptyOutcome);
  const [source, setSource] = useState<LeadSource>("walk_in");
  const [notes, setNotes] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [error, setError] = useState("");

  const hasClient = type !== "broker";
  const hasBroker = type !== "client";
  const validAgent = agents.some((u) => u.id === agentId) ? agentId : defaultAgent(users, effectiveUser, branchId);
  const typedPhone = phone.replace(/\D/g, "");
  const checkPhone = hasClient && clientMode === "new" && typedPhone.length >= 10;
  const [foundByPhone, setFoundByPhone] = useState<Lead | undefined>();
  useEffect(() => {
    if (!checkPhone || !serverLookup) return setFoundByPhone(undefined);
    let current = true;
    const timer = setTimeout(() => {
      findLeadsByPhone(scopesFor(profileOf(effectiveUser)).leads, phone)
        .then((rows) => {
          if (!current) return;
          injectLeads(rows);
          setFoundByPhone(rows[0]);
        })
        .catch(() => current && (setFoundByPhone(undefined), setLookupFailed(true)));
    }, 350);
    return () => {
      current = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, checkPhone, serverLookup, effectiveUser.id]);
  const duplicate = !checkPhone ? undefined : serverLookup ? foundByPhone : leads.find((l) => l.phone.replace(/\D/g, "") === typedPhone);
  const activeBrokers = brokers.filter((b) => b.active);
  const pickedBroker = brokers.find((b) => b.id === brokerId);
  const total = outcome.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const openForm = () => {
    setType("client");
    setClientMode("existing");
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
    setOutcome(emptyOutcome);
    setSource("walk_in");
    setNotes("");
    setWhatsapp("");
    setFollowUp(false);
    setFollowUpDate("");
    setError("");
    setNotice("");
    setJustSaved(null);
    setMode("form");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateCustomer(effectiveUser)) return;
    setError("");
    const clientName = pickedLead ? pickedLead.name : name.trim();
    const clientPhone = pickedLead ? pickedLead.phone : phone.trim();
    if (hasClient && (!clientName || !/^\+?[\d\s()-]{10,18}$/.test(clientPhone))) return setError("اكتب اسم العميل ورقم هاتف صحيح، أو اختار عميل مسجّل.");
    if (hasBroker && brokerMode === "existing" && !pickedBroker) return setError("اكتب اسم الوسيط واختاره من النتايج، أو أضفه كوسيط جديد.");
    if (hasBroker && brokerMode === "new" && (!brokerName.trim() || !/^\+?[\d\s()-]{10,18}$/.test(brokerPhone.trim()))) return setError("اكتب اسم الوسيط ورقم هاتفه.");
    const outErr = hasClient ? outcomeError(outcome, true) : "";
    if (outErr) return setError(outErr);
    if (hasClient && outcome.result === "bought" && !hasPermission(effectiveUser, "bookings.create")) return setError("حسابك مش مسموحله يسجل مشتريات. اختار «لسه» أو «استفسار فقط».");
    if (followUp && hasClient && !followUpDate) return setError("حدد تاريخ المتابعة.");
    if (!agents.some((u) => u.id === validAgent) && validAgent !== effectiveUser.id) return setError("اختار موظف نشط من نفس الفرع.");

    // A number that is already a customer's of this branch is the same customer: the visit goes on their file. The check
    // on screen may still be waiting for the typing to pause, so it is made once more here.
    let linkTo = pickedLead?.id;
    if (hasClient && !pickedLead && clientMode === "new") {
      const known = duplicate ?? (serverLookup ? (await findLeadsByPhone(scopesFor(profileOf(effectiveUser)).leads, clientPhone).catch(() => []))[0] : undefined);
      if (known && known.branchId === branchId) {
        injectLeads([known]);
        if (!duplicate) {
          // Found only now: show it, and the next save goes on its file.
          setFoundByPhone(known);
          return setError(`الرقم ده موجود عندنا باسم ${known.name}، والزيارة هتتسجل على ملفه. اضغط حفظ تاني.`);
        }
        linkTo = known.id;
      }
    }

    // The broker: pick the existing one or register the new one.
    const broker = hasBroker ? (brokerMode === "existing" ? pickedBroker : addBroker({ name: brokerName.trim(), phone: brokerPhone.trim(), type: "individual", active: true, notes: "", branchIds: [branchId] })) : undefined;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const bits = [notes.trim()];
    const bought = hasClient && outcome.result === "bought";
    const finalOutcome = hasClient && outcome.result ? outcomeLabel[outcome.result] : "زيارة وسيط";
    // A purchase schedules its own post-sale follow-ups; only a follow-up the salesperson chose is added here.
    const followUpOn = hasClient && followUp;
    const followUpOnDate = followUpDate;
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
        linkedLeadId: linkTo,
        requiresFollowUp: followUpOn && hasPermission(effectiveUser, "followups.create"),
        followUpAgentId: validAgent,
        followUpDate: followUpOn ? followUpOnDate : undefined,
      });
      // A customer who came with a broker belongs to that broker; the purchase is credited to them.
      if (hasClient && broker && visit.linkedLeadId) {
        const lead = leads.find((l) => l.id === visit.linkedLeadId);
        // A brand-new customer already got the broker when the visit created them.
        if (lead && !lead.brokerId) updateLead(visit.linkedLeadId, { brokerId: broker.id, brokerName: broker.name });
      }
      // The result belongs to this visit: a purchase becomes the customer's purchase, "not yet" keeps its reason.
      if (hasClient && visit.linkedLeadId) {
        const leadId = visit.linkedLeadId;
        const branchName = branches.find((b) => b.id === branchId)?.name;
        if (bought && hasPermission(effectiveUser, "bookings.create")) {
          const purchase = purchaseFromItems(outcome.items);
          addBooking({
            leadId,
            leadName: clientName,
            leadPhone: clientPhone,
            branchId,
            branchName,
            agentId: validAgent,
            ...purchase,
            bookingDate: date,
            bookingStatus: "confirmed",
            source,
            notes: "",
            visitId: visit.id,
          });
        } else if (outcome.result === "not_yet") {
          addNotBoughtRecord({
            leadId,
            leadName: clientName,
            branchId,
            agentId: validAgent,
            visitId: visit.id,
            reasons: outcome.reasons,
            otherText: outcome.reasons.includes("other") ? outcome.otherText.trim() : undefined,
            note: outcome.note.trim() || undefined,
          });
        }
      }
      setNotice(`اتسجلت الزيارة${hasClient ? ` وملف ${clientName} موجود في العملاء` : ""}.`);
      setReviewFor(null);
      setJustSaved(
        (hasClient && visit.linkedLeadId) || broker
          ? {
              visitId: visit.id,
              label: `زيارة ${branches.find((b) => b.id === branchId)?.name || "الفرع"} يوم ${date}`,
              client: hasClient && visit.linkedLeadId ? { leadId: visit.linkedLeadId, name: clientName, phone: clientPhone } : undefined,
              broker: broker ? { brokerId: broker.id } : undefined,
            }
          : null,
      );
      setMode("list");
      list.refresh();
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
        <PageGuide id="visits" />
        {notice && (
          <div className="notice" role="status">
            {notice}
            {justSaved && <PostVisitReview target={justSaved} />}
          </div>
        )}
        <CustomerRatingModal
          lead={leads.find((l) => l.id === reviewFor?.leadId) ?? null}
          isOpen={reviewOpen}
          onClose={() => {
            setReviewOpen(false);
            setReviewFor(null);
          }}
          subject={reviewFor ? { kind: "visit", label: reviewFor.label } : undefined}
        />
        <section className="panel">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "ابحث باسم الزائر أو الوسيط أو الهاتف…" }}
            selects={[
              { id: "type", label: "نوع الزائر", value: fType, onChange: setFType, allLabel: "كل الزوار", primary: true, options: (Object.keys(typeLabels) as VisitorType[]).map((t) => ({ value: t, label: typeLabels[t] })) },
              { id: "branch", label: "الفرع", value: fBranch, onChange: setFBranch, allLabel: "كل الفروع", primary: true, options: branches.filter((b) => canSeeBranch(effectiveUser, b.id, branches)).map((b) => ({ value: b.id, label: b.name })) },
              { id: "agent", label: "الموظف المستقبِل", value: fAgent, onChange: setFAgent, allLabel: "كل الموظفين", options: users.filter((u) => u.active).map((u) => ({ value: u.id, label: u.name })) },
              { id: "outcome", label: "نتيجة الزيارة", value: fOutcome, onChange: setFOutcome, allLabel: "كل النتائج", options: [...Object.values(outcomeLabel), "زيارة وسيط"].map((o) => ({ value: o, label: o })) },
            ]}
            dates={{ from: fFrom, to: fTo, onFrom: setFFrom, onTo: setFTo, label: "تاريخ الزيارة" }}
            count={{ shown: rowsTotal ?? rows.length, noun: "زيارة" }}
            onReset={resetFilters}
          />
          {list.error && !legacy && (
            <div className="notice" role="alert">
              {list.error} <button className="btn-text" onClick={list.refresh}>إعادة المحاولة</button>
            </div>
          )}
          {list.searchTooShort && !legacy && <div className="quiet-note" role="status">اكتب حرفين من الاسم أو 4 أرقام من الهاتف عشان يشتغل البحث.</div>}
          {!legacy && list.loading && !rows.length ? (
            <div className="quiet-note" role="status" style={{ padding: 30 }}>جاري تحميل الزيارات…</div>
          ) : rows.length ? (
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
                          ) : null}
                          {v.linkedLeadId && t !== "broker" ? (
                            <button
                              className="btn-text"
                              onClick={() => {
                                setReviewFor({ leadId: v.linkedLeadId!, label: `زيارة ${v.branchName || "الفرع"} يوم ${v.date}` });
                                setReviewOpen(true);
                              }}
                            >
                              <MessageCircle size={13} />
                              تقييم
                            </button>
                          ) : null}
                          {!v.linkedLeadId ? (
                            <span className="table-secondary">{t === "broker" ? "وسيط" : "—"}</span>
                          ) : null}
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
          {hasMoreRows && (
            <div className="filter-count">
              <span>
                معروض {rows.length}
                {rowsTotal !== null ? ` من ${rowsTotal}` : ""} زيارة
              </span>
              <button className="btn-secondary" onClick={legacy ? () => setShown((n) => n + 20) : list.loadMore} disabled={!legacy && list.loadingMore}>
                {!legacy && list.loadingMore ? "جاري التحميل…" : "عرض المزيد"}
              </button>
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
      <PageGuide id="visits" />
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
              {clientMode === "existing" ? (
                <CustomerSearch
                  {...(serverLookup
                    ? {
                        lookup: async (typed: string) => {
                          try {
                            const rows = await searchLeads(scopesFor(profileOf(effectiveUser)).leads, typed, 8);
                            injectLeads(rows);
                            return rows;
                          } catch {
                            setLookupFailed(true);
                            return [];
                          }
                        },
                      }
                    : { leads })}
                  value={pickedLead}
                  onChange={(l) => {
                    setPickedLead(l);
                    if (l?.branchId) setBranchId(l.branchId);
                  }}
                  onCreate={(typed) => {
                    // What was typed becomes the start of the new customer: digits are the phone, otherwise the name.
                    if (typed.replace(/\D/g, "").length >= 7) setPhone(typed);
                    else setName(typed);
                    setPickedLead(null);
                    setClientMode("new");
                  }}
                />
              ) : (
                <div className="field-grid">
                  <NameWithTitle value={name} onChange={setName} required />
                  <label className="field">
                    <span>
                      رقم الهاتف <em>مطلوب</em>
                    </span>
                    <input dir="ltr" type="tel" inputMode="tel" autoComplete="off" placeholder="01xxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                  {leads.length > 0 && (
                    <button type="button" className="btn-text full-width" onClick={() => setClientMode("existing")}>
                      ← دوّر في العملاء المسجلين بدل كده
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {hasBroker && (
            <div className="party-block">
              <h3>الوسيط</h3>
              {brokerMode === "existing" ? (
                <BrokerSearch
                  label="دوّر على الوسيط (يمكن يكون مسجّل قبل كده)"
                  brokers={activeBrokers}
                  value={brokerId}
                  onChange={setBrokerId}
                  onCreate={(typed) => {
                    if (typed.replace(/\D/g, "").length >= 7) setBrokerPhone(typed);
                    else setBrokerName(typed);
                    setBrokerId("");
                    setBrokerMode("new");
                  }}
                />
              ) : (
                <div className="field-grid">
                  <label className="field">
                    <span>
                      اسم الوسيط <em>مطلوب</em>
                    </span>
                    <input autoComplete="off" value={brokerName} onChange={(e) => setBrokerName(e.target.value)} />
                  </label>
                  <label className="field">
                    <span>
                      رقم الوسيط <em>مطلوب</em>
                    </span>
                    <input dir="ltr" type="tel" inputMode="tel" autoComplete="off" placeholder="01xxxxxxxxx" value={brokerPhone} onChange={(e) => setBrokerPhone(e.target.value)} />
                  </label>
                  {activeBrokers.length > 0 && (
                    <button type="button" className="btn-text full-width" onClick={() => setBrokerMode("existing")}>
                      ← دوّر في الوسطاء المسجلين بدل كده
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <label className="field" style={{ marginTop: 18 }}>
            <span>
              سبب الزيارة <em>اختياري</em>
            </span>
            <input placeholder="استفسار، معاينة، عرض سعر…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </section>

        {hasClient && (
          <section className="form-section">
            <div className="section-title">
              <span className="section-number">02</span>
              <div>
                <h2>نتيجة الزيارة</h2>
                <p>اشترى ولا لسه؟ سجلها دلوقتي عشان تتربط بالزيارة دي.</p>
              </div>
            </div>
            <OutcomeSection
              value={outcome}
              onChange={setOutcome}
              required
              boughtHint={type === "both" ? "المبلغ بيتحسب على الوسيط لأنه هو اللي دخّله." : undefined}
            />
          </section>
        )}

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
                  {agents.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </details>

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
              {outcome.result === "bought" && !followUp && (
                <p className="quiet-note">لأنه اشترى، هتتجدول متابعة تلقائي بعد 3 أيام (رأيه في الخدمة والتقييم). علّم هنا لو عايز ميعاد تاني.</p>
              )}
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
