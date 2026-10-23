import { PageGuide } from "../components/common/PageGuide";
import {
  canCreateCustomer,
  canAssignCustomers,
  canContactCustomer,
  isSales,
} from "../lib/access";
import { useEffect, useMemo, useState } from "react";
import { FilterBar } from "../components/common/FilterBar";
import {
  Plus,
  Search,
  Download,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpLeft,
  Phone,
  MessageCircle,
  Users,
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { useLeadsList, LEADS_PAGE_SIZE } from "../lib/useLeadsList";
import { useDebounced } from "../lib/useDebounced";
import type { ScopeFilter } from "../lib/useFirestoreSync";
import { useLanguage } from "../context/LanguageContext";
import {
  isManagement,
  phoneNumber,
  today,
} from "../lib/presentation";

interface Props {
  onOpenLead: (id: string) => void;
  onNavigateAddLead: () => void;
}
export function LeadsPage({ onOpenLead, onNavigateAddLead }: Props) {
  const { effectiveUser, leads, branches, users, followUps, reassignLead, requestAllLeads } = useCRM();
  const [typed, setTyped] = useState("");
  const query = useDebounced(typed, 300);
  const { tr, labels } = useLanguage();
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [agent, setAgent] = useState("all");
  const [source, setSource] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [targetAgent, setTargetAgent] = useState("");
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [shown, setShown] = useState(LEADS_PAGE_SIZE);

  const filters = useMemo<ScopeFilter[]>(
    () => [
      ...(status !== "all" ? [["status", "==", status] as ScopeFilter] : []),
      ...(branch !== "all" ? [["branchId", "==", branch] as ScopeFilter] : []),
      ...(agent !== "all" ? [["assignedAgentId", "==", agent] as ScopeFilter] : []),
      ...(source !== "all" ? [["source", "==", source] as ScopeFilter] : []),
    ],
    [status, branch, agent, source],
  );

  // The database answers: a page at a time, filtered and searched there. Only when it cannot (the search index is
  // not built yet) does this page read every customer and filter them here, as it used to.
  const list = useLeadsList(effectiveUser, filters, query);
  const legacy = list.needsFullList;
  useEffect(() => (legacy ? requestAllLeads() : undefined), [legacy, requestAllLeads]);

  const live = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const legacyRows = useMemo(() => {
    if (!legacy) return [];
    const t = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (!t || [l.name, l.phone, l.whatsappPhone, l.courseOfInterest].some((v) => v?.toLowerCase().includes(t))) &&
        (status === "all" || l.status === status) &&
        (branch === "all" || l.branchId === branch) &&
        (agent === "all" || l.assignedAgentId === agent) &&
        (source === "all" || l.source === source),
    );
  }, [legacy, leads, query, status, branch, agent, source]);

  // What is on screen is the latest version of each customer (edits made here show at once); a customer that was
  // removed from the working set is no longer listed.
  const rows = legacy
    ? legacyRows.slice(0, shown)
    : list.rows.map((r) => live.get(r.id)).filter((l): l is NonNullable<typeof l> => !!l);
  const total = legacy ? legacyRows.length : list.total;
  const hasMore = legacy ? legacyRows.length > shown : list.hasMore;
  const loadMore = legacy ? () => setShown((n) => n + LEADS_PAGE_SIZE) : list.loadMore;
  const hasFilters = !!query || filters.length > 0;

  useEffect(() => {
    setSelected([]);
    setNotice("");
    setShown(LEADS_PAGE_SIZE);
  }, [query, status, branch, agent, source, effectiveUser.id]);
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  const exportCsv = async () => {
    setExporting(true);
    try {
      // Everything that matches, not only the pages on screen.
      const all = !legacy && list.hasMore ? await list.readAll() : rows;
      const cell = (value: string) =>
        '"' +
        (/^[=+@-]/.test(value) ? "'" : "") +
        value.replace(/"/g, '""') +
        '"';
      const text =
        "\uFEFF" +
        [
          [tr("الاسم", "Name"), tr("الهاتف", "Phone"), tr("الحالة", "Status"), tr("الفرع", "Branch"), tr("الموظف المسؤول", "Assigned employee")],
          ...all.map((l) => [
            l.name,
            l.phone,
            labels.status[l.status],
            l.branchName || "",
            l.assignedAgentName || "",
          ]),
        ]
          .map((r) => r.map(cell).join(","))
          .join("\r\n");
      const url = URL.createObjectURL(
        new Blob([text], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = tr("عملاء-البحيري.csv", "behery-customers.csv");
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  const move = () => {
    if (!targetAgent) return;
    selected.forEach((id) => reassignLead(id, targetAgent));
    setNotice(tr(`تم تعيين مسؤول جديد لـ ${selected.length} عميل على هذا الجهاز.`, `A new owner was assigned to ${selected.length} customers on this device.`));
    setSelected([]);
    setTargetAgent("");
  };
  const nextDate = (date?: string) =>
    date?.slice(0, 10) === today()
      ? tr("اليوم", "Today")
      : date?.slice(0, 10) || tr("بدون موعد", "No date");
  const pill = (lead: (typeof leads)[number]) => (
    <span
      className={`status-pill ${lead.status === "booked" ? "is-success" : lead.status === "new" ? "is-new" : lead.status === "needs_followup" ? "is-warning" : ""}`}
    >
      {labels.status[lead.status]}
    </span>
  );
  const clear = () => {
    setTyped("");
    setStatus("all");
    setBranch("all");
    setAgent("all");
    setSource("all");
  };
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{tr("علاقات تستمر", "Lasting relationships")}</span>
          <h1>{effectiveUser.role === "sales_agent" ? tr("عملاؤك", "Your customers") : tr("العملاء", "Customers")}</h1>
          <p>{tr("ملفات العملاء داخل نطاقك، وحالة كل عميل والمسؤول عنه.", "Customer files within your scope, each customer's status and owner.")}</p>
        </div>
        {canCreateCustomer(effectiveUser) && (
          <button className="btn-primary" onClick={onNavigateAddLead}>
            <Plus size={17} />
            {tr("عميل جديد", "New customer")}
          </button>
        )}
      </div>
      <PageGuide id="customers" />
      <section className="panel">
        <FilterBar
          search={{ value: typed, onChange: setTyped, placeholder: tr("اسم العميل أو رقم الهاتف…", "Customer name or phone…") }}
          selects={[
            { id: "status", label: tr("حالة العميل", "Customer status"), value: status, onChange: setStatus, allLabel: tr("كل الحالات", "All statuses"), primary: true, options: Object.entries(labels.status).map(([id, label]) => ({ value: id, label })) },
            { id: "branch", label: tr("الفرع", "Branch"), value: branch, onChange: setBranch, allLabel: tr("كل الفروع المتاحة", "All available branches"), options: isManagement(effectiveUser) ? branches.map((b) => ({ value: b.id, label: b.name })) : [] },
            { id: "agent", label: tr("الموظف المسؤول", "Assigned employee"), value: agent, onChange: setAgent, allLabel: tr("كل الموظفين المتاحين", "All available employees"), options: isManagement(effectiveUser) ? users.filter((u) => u.active && ["sales_agent", "team_leader", "branch_manager", "regional_manager"].includes(u.role)).map((u) => ({ value: u.id, label: u.name })) : [] },
            { id: "source", label: tr("مصدر العميل", "Customer source"), value: source, onChange: setSource, allLabel: tr("كل المصادر", "All sources"), options: Object.entries(labels.source).map(([id, label]) => ({ value: id, label })) },
          ]}
          count={{ shown: total ?? rows.length, noun: tr("عميل", "customers") }}
          onReset={clear}
          actions={
            <button className="btn-secondary" onClick={exportCsv} disabled={!rows.length || exporting} aria-label={tr("تصدير العملاء CSV", "Export customers CSV")}>
              <Download size={16} />
              <span className="desktop-only">{exporting ? tr("جاري التصدير…", "Exporting…") : tr("تصدير", "Export")}</span>
            </button>
          }
        />
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        {canAssignCustomers(effectiveUser) && !!selected.length && (
          <div className="selection-bar">
            <span>{tr(`تم تحديد ${selected.length} عميل`, `${selected.length} customers selected`)}</span>
            <select
              aria-label={tr(tr("المسؤول الجديد", "New owner"), "New owner")}
              value={targetAgent}
              onChange={(e) => setTargetAgent(e.target.value)}
            >
              <option value="">{tr("اختَر المسؤول الجديد", "Choose the new owner")}</option>
              {users
                .filter(
                  (u) =>
                    u.active &&
                    ["sales_agent", "team_leader"].includes(u.role) &&
                    rows
                      .filter((l) => selected.includes(l.id))
                      .every((l) => l.branchId === u.branchId),
                )
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <button
              className="btn-primary"
              disabled={!targetAgent}
              onClick={move}
            >
              {tr("تعيين المسؤول", "Assign owner")}
            </button>
            <button className="btn-text" onClick={() => setSelected([])}>
              {tr("إلغاء التحديد", "Clear selection")}
            </button>
          </div>
        )}
        {list.searchTooShort && !legacy && (
          <div className="quiet-note" role="status">اكتب حرفين من الاسم أو 4 أرقام من الهاتف عشان يشتغل البحث.</div>
        )}
        {list.error && !legacy && (
          <div className="notice" role="alert">
            {list.error} <button className="btn-text" onClick={list.refresh}>إعادة المحاولة</button>
          </div>
        )}
        {!legacy && list.loading && !rows.length ? (
          <div className="quiet-note" role="status" style={{ padding: 30 }}>جاري تحميل العملاء…</div>
        ) : !rows.length ? (
          <div className="empty-state">
            <Users size={30} strokeWidth={1.3} />
            <h3>
              {hasFilters ? tr("مفيش عميل مطابق للبحث", "No customer matches the search") : tr("لسه مفيش عملاء في نطاقك", "No customers in your scope yet")}
            </h3>
            <p>
              {hasFilters
                ? tr("جرّب رقم الهاتف أو قلّل الفلاتر.", "Try the phone number or reduce the filters.")
                : tr("العملاء المسجلون داخل نطاقك سيظهرون هنا.", "Registered customers in your scope will appear here.")}
            </p>
            {hasFilters ||
              (canCreateCustomer(effectiveUser) && (
                <button
                  className="btn-secondary"
                  onClick={hasFilters ? clear : onNavigateAddLead}
                >
                  {hasFilters ? tr("عرض كل العملاء", "Show all customers") : tr("إضافة عميل", "Add customer")}
                </button>
              ))}
          </div>
        ) : (
          <>
            <div className="directory-table">
              <table className="data-table">
                <thead>
                  <tr>
                    {canAssignCustomers(effectiveUser) && (
                      <th style={{ width: 35 }}>
                        <input
                          aria-label={tr(tr("تحديد عملاء الصفحة", "Select this page's customers"), "Select this page's customers")}
                          type="checkbox"
                          checked={
                            rows.length > 0 &&
                            rows.every((l) => selected.includes(l.id))
                          }
                          onChange={() =>
                            setSelected(
                              rows.every((l) => selected.includes(l.id))
                                ? []
                                : rows.map((l) => l.id),
                            )
                          }
                        />
                      </th>
                    )}
                    <th>{tr("العميل", "Customer")}</th>
                    <th>{tr("الحالة", "Status")}</th>
                    <th>{tr("الموظف المسؤول", "Assigned employee")}</th>
                    <th>{tr("المتابعة القادمة", "Next follow-up")}</th>
                    <th>
                      <span className="sr-only">{tr("الملف", "File")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id}>
                      {canAssignCustomers(effectiveUser) && (
                        <td>
                          <input
                            type="checkbox"
                            aria-label={tr(`تحديد ${l.name}`, `Select ${l.name}`)}
                            checked={selected.includes(l.id)}
                            onChange={() => toggle(l.id)}
                          />
                        </td>
                      )}
                      <td>
                        <button
                          className="customer-name"
                          onClick={() => onOpenLead(l.id)}
                        >
                          {l.name}
                        </button>
                        <span className="table-secondary">
                          <span dir="ltr">{l.phone}</span> ·{" "}
                          {labels.source[l.source]}
                        </span>
                      </td>
                      <td>{pill(l)}</td>
                      <td>
                        {l.assignedAgentName || tr("لم يُحدد", "Not set")}
                        <span className="table-secondary">{l.branchName}</span>
                      </td>
                      <td>
                        <span
                          className={
                            l.nextFollowUpDate?.slice(0, 10) === today()
                              ? "status-pill is-warning"
                              : ""
                          }
                        >
                          {nextDate(l.nextFollowUpDate)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-link"
                          onClick={() => onOpenLead(l.id)}
                        >
                          {tr("فتح الملف", "Open file")}
                          <ArrowUpLeft size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="customer-cards">
              {rows.map((l) => (
                <article className="customer-card" key={l.id}>
                  <div className="customer-card-heading">
                    <div>
                      <button onClick={() => onOpenLead(l.id)}>
                        <h2>{l.name}</h2>
                      </button>
                      <p dir="ltr">{l.phone}</p>
                    </div>
                    {pill(l)}
                  </div>
                  <div className="customer-card-meta">
                    <span>{l.assignedAgentName || tr("بدون مسؤول", "No owner")}</span>
                    <span>{tr("المتابعة:", "Follow-up:")} {nextDate(l.nextFollowUpDate)}</span>
                  </div>
                  <div className="customer-card-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => onOpenLead(l.id)}
                    >
                      {tr("الملف", "File")}
                      <ArrowUpLeft size={14} />
                    </button>
                    {canContactCustomer(effectiveUser, l, followUps) && (
                      <a
                        className="btn-secondary"
                        href={`tel:${phoneNumber(l.phone)}`}
                      >
                        <Phone size={14} />
                        {tr("اتصال", "Call")}
                      </a>
                    )}
                    {canContactCustomer(effectiveUser, l, followUps) && (
                      <a
                        className="btn-secondary"
                        href={`https://wa.me/${phoneNumber(l.whatsappPhone || l.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle size={14} />
                        {tr("واتساب", "WhatsApp")}
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {hasMore && (
          <div className="filter-count">
            <span>
              {tr("معروض", "Showing")} {rows.length}
              {total !== null ? ` ${tr("من", "of")} ${total}` : ""} {tr("عميل", "customers")}
            </span>
            <button className="btn-secondary" onClick={loadMore} disabled={!legacy && list.loadingMore}>
              {!legacy && list.loadingMore ? tr("جاري التحميل…", "Loading…") : tr("عرض المزيد", "Show more")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
