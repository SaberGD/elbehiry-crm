import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Activity } from "lucide-react";
import { db } from "../../lib/firebase";
import { roleNames } from "../../lib/presentation";
import { isOnline, type Presence, type SessionEvent, type SessionEventType } from "../../lib/sessionLog";

const TYPE_LABEL: Record<SessionEventType, string> = { sign_in: "دخول", sign_out: "خروج", app_open: "فتح التطبيق" };
const TYPE_STYLE: Record<SessionEventType, string> = {
  sign_in: "bg-emerald-50 text-emerald-700",
  sign_out: "bg-rose-50 text-rose-700",
  app_open: "bg-sky-50 text-sky-700",
};
const stamp = (t: number) => new Date(t).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const roleName = (r: string) => (roleNames as Record<string, string>)[r] ?? r;

/** Developer only: who is online right now, and a log of every sign-in, sign-out and app open. */
export function SessionLogPanel() {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [filter, setFilter] = useState<"all" | SessionEventType>("all");
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    const fail = () => setError("تعذر قراءة السجل. تأكد من نشر آخر قواعد Firestore.");
    const offE = onSnapshot(
      query(collection(db, "sessionEvents"), orderBy("at", "desc"), limit(200)),
      (s) => {
        setEvents(s.docs.map((d) => ({ ...(d.data() as SessionEvent), id: d.id })));
        setError("");
      },
      fail
    );
    const offP = onSnapshot(collection(db, "presence"), (s) => setPresence(s.docs.map((d) => d.data() as Presence)), fail);
    const t = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => {
      offE();
      offP();
      window.clearInterval(t);
    };
  }, []);

  const online = useMemo(() => presence.filter((p) => isOnline(p, now)).sort((a, b) => a.name.localeCompare(b.name, "ar")), [presence, now]);
  const shown = filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
        <Activity size={16} className="text-emerald-600" /> سجل الدخول والمتصلين الآن
      </h3>
      {error && <p className="mb-2 text-xs font-bold text-rose-600">{error}</p>}

      <div className="mb-4">
        <p className="mb-2 text-xs font-bold text-slate-500">متصل الآن ({online.length})</p>
        {online.length === 0 ? (
          <p className="text-xs text-slate-400">لا أحد متصل حالياً.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {online.map((p) => (
              <li key={p.uid} className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="font-black text-slate-900">{p.name}</span>
                <span className="text-slate-500">{roleName(p.role)}</span>
                <span className="text-slate-400">· {p.device} · من {stamp(p.since)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {(["all", "sign_in", "sign_out", "app_open"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1 text-xs font-bold ${filter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {f === "all" ? "الكل" : TYPE_LABEL[f]}
          </button>
        ))}
      </div>
      <div className="max-h-96 overflow-auto rounded-xl border border-slate-100">
        <table className="w-full text-right text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="p-2">الوقت</th>
              <th className="p-2">الاسم</th>
              <th className="p-2">الدور</th>
              <th className="p-2">الحدث</th>
              <th className="p-2">الجهاز</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap p-2 text-slate-500">{stamp(e.at)}</td>
                <td className="p-2 font-bold text-slate-900">{e.name}</td>
                <td className="p-2 text-slate-600">{roleName(e.role)}</td>
                <td className="p-2">
                  <span className={`rounded-md px-2 py-0.5 font-bold ${TYPE_STYLE[e.type]}`}>{TYPE_LABEL[e.type]}</span>
                </td>
                <td className="p-2 text-slate-400">{e.device}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  لا توجد أحداث بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">يظهر آخر 200 حدث. «متصل» = آخر نبضة خلال دقيقتين ونصف.</p>
    </section>
  );
}
