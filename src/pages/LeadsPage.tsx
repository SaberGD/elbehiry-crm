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
import type { ScopeFilter } from "../lib/useFirestoreSync";
import {
  statusNames,
  sourceNames,
  isManagement,
  phoneNumber,
  today,
} from "../lib/presentation";

interface Props {
  onOpenLead: (id: string) => void;
  onNavigateAddLead: () => void;
}
/** What was typed, once the typing pauses (the database is asked then, not on every key). */
function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function LeadsPage({ onOpenLead, onNavigateAddLead }: Props) {
  const { effectiveUser, leads, branches, users, followUps, reassignLead, requestAllLeads } = useCRM();
  const [typed, setTyped] = useState("");
  const query = useDebounced(typed, 300);
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
          ["الاسم", "الهاتف", "الحالة", "الفرع", "الموظف المسؤول"],
          ...all.map((l) => [
            l.name,
            l.phone,
            statusNames[l.status],
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
      link.download = "عملاء-البحيري.csv";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  const move = () => {
    if (!targetAgent) return;
    selected.forEach((id) => reassignLead(id, targetAgent));
    setNotice(`تم تعيين مسؤول جديد لـ ${selected.length} عميل على هذا الجهاز.`);
    setSelected([]);
    setTargetAgent("");
  };
  const nextDate = (date?: string) =>
    date?.slice(0, 10) === today()
      ? "اليوم"
      : date?.slice(0, 10) || "بدون موعد";
  const pill = (lead: (typeof leads)[number]) => (
    <span
      className={`status-pill ${lead.status === "booked" ? "is-success" : lead.status === "new" ? "is-new" : lead.status === "needs_followup" ? "is-warning" : ""}`}
    >
      {statusNames[lead.status]}
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
          <span className="eyebrow">علاقات تستمر</span>
          <h1>{effectiveUser.role === "sales_agent" ? "عملاؤك" : "العملاء"}</h1>
          <p>ملفات العملاء داخل نطاقك، وحالة كل عميل والمسؤول عنه.</p>
        </div>
        {canCreateCustomer(effectiveUser) && (
          <button className="btn-primary" onClick={onNavigateAddLead}>
            <Plus size={17} />
            عميل جديد
          </button>
        )}
      </div>
      <PageGuide id="customers" />
      <section className="panel">
        <FilterBar
          search={{ value: typed, onChange: setTyped, placeholder: "اسم العميل أو رقم الهاتف…" }}
          selects={[
            { id: "status", label: "حالة العميل", value: status, onChange: setStatus, allLabel: "كل الحالات", primary: true, options: Object.entries(statusNames).map(([id, label]) => ({ value: id, label })) },
            { id: "branch", label: "الفرع", value: branch, onChange: setBranch, allLabel: "كل الفروع المتاحة", options: isManagement(effectiveUser) ? branches.map((b) => ({ value: b.id, label: b.name })) : [] },
            { id: "agent", label: "الموظف المسؤول", value: agent, onChange: setAgent, allLabel: "كل الموظفين المتاحين", options: isManagement(effectiveUser) ? users.filter((u) => u.active && ["sales_agent", "team_leader", "branch_manager", "regional_manager"].includes(u.role)).map((u) => ({ value: u.id, label: u.name })) : [] },
            { id: "source", label: "مصدر العميل", value: source, onChange: setSource, allLabel: "كل المصادر", options: Object.entries(sourceNames).map(([id, label]) => ({ value: id, label })) },
          ]}
          count={{ shown: total ?? rows.length, noun: "عميل" }}
          onReset={clear}
          actions={
            <button className="btn-secondary" onClick={exportCsv} disabled={!rows.length || exporting} aria-label="تصدير العملاء CSV">
              <Download size={16} />
              <span className="desktop-only">{exporting ? "جاري التصدير…" : "تصدير"}</span>
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
            <span>تم تحديد {selected.length} عميل</span>
            <select
              aria-label="المسؤول الجديد"
              value={targetAgent}
              onChange={(e) => setTargetAgent(e.target.value)}
            >
              <option value="">اختَر المسؤول الجديد</option>
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
              تعيين المسؤول
            </button>
            <button className="btn-text" onClick={() => setSelected([])}>
              إلغاء التحديد
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
              {hasFilters ? "مفيش عميل مطابق للبحث" : "لسه مفيش عملاء في نطاقك"}
            </h3>
            <p>
              {hasFilters
                ? "جرّب رقم الهاتف أو قلّل الفلاتر."
                : "العملاء المسجلون داخل نطاقك سيظهرون هنا."}
            </p>
            {hasFilters ||
              (canCreateCustomer(effectiveUser) && (
                <button
                  className="btn-secondary"
                  onClick={hasFilters ? clear : onNavigateAddLead}
                >
                  {hasFilters ? "عرض كل العملاء" : "إضافة عميل"}
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
                          aria-label="تحديد عملاء الصفحة"
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
                    <th>العميل</th>
                    <th>الحالة</th>
                    <th>الموظف المسؤول</th>
                    <th>المتابعة القادمة</th>
                    <th>
                      <span className="sr-only">الملف</span>
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
                            aria-label={`تحديد ${l.name}`}
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
                          {sourceNames[l.source]}
                        </span>
                      </td>
                      <td>{pill(l)}</td>
                      <td>
                        {l.assignedAgentName || "لم يُحدد"}
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
                          فتح الملف
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
                    <span>{l.assignedAgentName || "بدون مسؤول"}</span>
                    <span>المتابعة: {nextDate(l.nextFollowUpDate)}</span>
                  </div>
                  <div className="customer-card-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => onOpenLead(l.id)}
                    >
                      الملف
                      <ArrowUpLeft size={14} />
                    </button>
                    {canContactCustomer(effectiveUser, l, followUps) && (
                      <a
                        className="btn-secondary"
                        href={`tel:${phoneNumber(l.phone)}`}
                      >
                        <Phone size={14} />
                        اتصال
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
                        واتساب
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
              معروض {rows.length}
              {total !== null ? ` من ${total}` : ""} عميل
            </span>
            <button className="btn-secondary" onClick={loadMore} disabled={!legacy && list.loadingMore}>
              {!legacy && list.loadingMore ? "جاري التحميل…" : "عرض المزيد"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
