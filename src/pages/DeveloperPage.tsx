import { useEffect, useMemo, useState } from "react";
import { Calculator, Code2, RefreshCw, Server } from "lucide-react";
import { auth } from "../lib/firebase";
import { adminStatus } from "../lib/adminClient";
import { useCRM } from "../context/CRMContext";

interface Bucket { calls: number; in: number; out: number; think: number; audio: number }
interface Usage { days: number; byMode: Record<string, Bucket>; byDay: Record<string, Bucket>; activeUsers: number }

const PRICE_KEY = "almasar_crm_v1_dev_prices";
// Approximate public list prices per 1M tokens (USD). Editable: they change by model and over time.
const DEFAULT_PRICES = { textIn: 0.3, audioIn: 1.0, out: 2.5, egp: 50 };
const MODE_LABELS: Record<string, string> = {
  agent: "زكي (الشات بالأدوات)",
  weekly: "الملخص الأسبوعي",
  transcribe: "تحويل الصوت لنص",
  refine: "تحسين النص",
  unknown: "غير مصنّف",
};
const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const money = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function useNumber(key: string, initial: number) {
  const [v, setV] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(`almasar_crm_v1_dev_${key}`);
      return raw !== null && Number.isFinite(Number(raw)) ? Number(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`almasar_crm_v1_dev_${key}`, String(v));
    } catch {
      /* ignore */
    }
  }, [key, v]);
  return [v, setV] as const;
}

function Num({ label, value, onChange, step = 1, hint }: { label: string; value: number; onChange: (n: number) => void; step?: number; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" min="0" step={step} dir="ltr" value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
      {hint && <small className="table-secondary">{hint}</small>}
    </label>
  );
}

/** Developer-only tools: real AI token usage, a what-if cost calculator, and service health. */
export function DeveloperPage() {
  const { currentUser } = useCRM();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminOk, setAdminOk] = useState<boolean | null>(null);
  const [aiOk, setAiOk] = useState<boolean | null>(null);

  const [pTextIn, setPTextIn] = useNumber("p_text_in", DEFAULT_PRICES.textIn);
  const [pAudioIn, setPAudioIn] = useNumber("p_audio_in", DEFAULT_PRICES.audioIn);
  const [pOut, setPOut] = useNumber("p_out", DEFAULT_PRICES.out);
  const [egp, setEgp] = useNumber("egp", DEFAULT_PRICES.egp);

  const cost = (b: Bucket) => ((Math.max(b.in - b.audio, 0) * pTextIn + b.audio * pAudioIn + (b.out + b.think) * pOut) / 1_000_000);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai.php?usage=1", { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setUsage(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل الاستهلاك");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    adminStatus().then(setAdminOk);
    fetch("/api/ai.php?ping=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAiOk(!!d?.configured))
      .catch(() => setAiOk(false));
  }, []);

  const total = useMemo(() => {
    const t: Bucket = { calls: 0, in: 0, out: 0, think: 0, audio: 0 };
    for (const b of Object.values(usage?.byMode ?? {})) for (const k of Object.keys(t) as (keyof Bucket)[]) t[k] += b[k];
    return t;
  }, [usage]);
  const days = Object.entries(usage?.byDay ?? {}).slice(-14);
  const maxDay = Math.max(1, ...days.map(([, b]) => b.in + b.out));
  const agent = usage?.byMode?.agent;

  // What-if calculator (defaults come from measured usage when available)
  const [users, setUsers] = useNumber("c_users", 10);
  const [qPerDay, setQPerDay] = useNumber("c_q", 8);
  const [steps, setSteps] = useNumber("c_steps", 2.5);
  const [inTok, setInTok] = useNumber("c_in", agent ? Math.round(agent.in / agent.calls) : 3500);
  const [outTok, setOutTok] = useNumber("c_out", agent ? Math.round(agent.out / agent.calls) : 350);
  const [voice, setVoice] = useNumber("c_voice", 3);
  const [voiceSec, setVoiceSec] = useNumber("c_voice_sec", 20);
  const [weekly, setWeekly] = useNumber("c_weekly", 2);
  const [days_, setDays] = useNumber("c_days", 26);

  const calc = useMemo(() => {
    const agentCalls = users * qPerDay * steps * days_;
    const agentCost = (agentCalls * (inTok * pTextIn + outTok * pOut)) / 1_000_000;
    const voiceClips = users * voice * days_;
    const audioTok = voiceSec * 32; // ~32 tokens per second of audio
    const voiceCost = (voiceClips * (audioTok * pAudioIn + 120 * pTextIn + 80 * pOut)) / 1_000_000;
    const weeklyRuns = Math.max(1, Math.round(users / 5)) * weekly * 4.3;
    const weeklyCost = (weeklyRuns * (9000 * pTextIn + 700 * pOut)) / 1_000_000;
    const usd = agentCost + voiceCost + weeklyCost;
    return { agentCalls, agentCost, voiceClips, voiceCost, weeklyRuns, weeklyCost, usd, perUser: users ? usd / users : 0 };
  }, [users, qPerDay, steps, days_, inTok, outTok, voice, voiceSec, weekly, pTextIn, pAudioIn, pOut]);

  const Dot = ({ ok }: { ok: boolean | null }) => (
    <i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 99, marginInlineEnd: 8, background: ok === null ? "#999" : ok ? "#15803d" : "#c8232b" }} />
  );

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">للمطورين فقط</span>
          <h1>قسم المطورين</h1>
          <p>أدوات تقنية لا تظهر لغيرك: استهلاك الذكاء الاصطناعي، حاسبة تكلفة تقريبية، وحالة الخدمات. أهلًا {currentUser.name}.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              <Server size={18} style={{ display: "inline", marginInlineEnd: 6 }} />
              حالة الخدمات
            </h2>
          </div>
        </div>
        <p style={{ margin: "0 6px 8px" }}>
          <Dot ok={aiOk} /> الذكاء الاصطناعي (<code>api/ai.php</code>): {aiOk === null ? "جاري الفحص…" : aiOk ? "شغّال" : "مش مفعّل (مفتاح Gemini ناقص)"}
        </p>
        <p style={{ margin: "0 6px 8px" }}>
          <Dot ok={adminOk} /> إعادة تعيين كلمات المرور (<code>api/admin.php</code>): {adminOk === null ? "جاري الفحص…" : adminOk ? "شغّال" : "مش مفعّل (ملف Firebase Admin ناقص)"}
        </p>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <h2>
              <Code2 size={18} style={{ display: "inline", marginInlineEnd: 6 }} />
              استهلاك الذكاء الاصطناعي الفعلي (آخر 30 يوم)
            </h2>
            <p>الأرقام من سجل السيرفر (عدد التوكنز فقط، من غير أي محتوى). التكلفة تقريبية حسب الأسعار تحت.</p>
          </div>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> تحديث
          </button>
        </div>
        {error && <p className="notice warning">تعذر التحميل: {error}</p>}
        {usage && Object.keys(usage.byMode).length === 0 && <p className="quiet-note">لسه مفيش استخدام مسجّل. هيبدأ يظهر بعد أول استخدام لزكي أو الصوت.</p>}
        {usage && Object.keys(usage.byMode).length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الخدمة</th>
                  <th>الطلبات</th>
                  <th>توكنز الإدخال</th>
                  <th>منها صوت</th>
                  <th>توكنز الإخراج</th>
                  <th>تكلفة تقريبية</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(usage.byMode).map(([mode, b]) => (
                  <tr key={mode}>
                    <td>{MODE_LABELS[mode] ?? mode}</td>
                    <td>{fmt(b.calls)}</td>
                    <td>{fmt(b.in)}</td>
                    <td>{fmt(b.audio)}</td>
                    <td>{fmt(b.out + b.think)}</td>
                    <td>
                      ${money(cost(b), 3)} · {money(cost(b) * egp)} ج.م
                    </td>
                  </tr>
                ))}
                <tr>
                  <td><strong>الإجمالي</strong></td>
                  <td><strong>{fmt(total.calls)}</strong></td>
                  <td><strong>{fmt(total.in)}</strong></td>
                  <td><strong>{fmt(total.audio)}</strong></td>
                  <td><strong>{fmt(total.out + total.think)}</strong></td>
                  <td><strong>${money(cost(total), 3)} · {money(cost(total) * egp)} ج.م</strong></td>
                </tr>
              </tbody>
            </table>
            <p className="table-secondary" style={{ margin: 10 }}>
              مستخدمون نشطون: {usage.activeUsers} · متوسط طلب زكي: {agent ? `${fmt(agent.in / agent.calls)} توكن إدخال / ${fmt(agent.out / agent.calls)} إخراج` : "—"}
            </p>
            {days.length > 0 && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90, margin: "6px 10px 14px" }} aria-label="الاستهلاك اليومي">
                {days.map(([d, b]) => (
                  <div key={d} title={`${d}: ${fmt(b.in + b.out)} توكن، ${b.calls} طلب`} style={{ flex: 1, textAlign: "center", fontSize: 10 }}>
                    <div style={{ height: `${Math.max(4, ((b.in + b.out) / maxDay) * 70)}px`, background: "#c8232b", borderRadius: 4, opacity: 0.85 }} />
                    {d.slice(5)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <details style={{ margin: "6px 10px 12px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>الأسعار المستخدمة في الحساب (قابلة للتعديل)</summary>
          <div className="field-grid" style={{ marginTop: 10 }}>
            <Num label="إدخال نصي ($ لكل مليون توكن)" value={pTextIn} onChange={setPTextIn} step={0.05} />
            <Num label="إدخال صوتي ($ لكل مليون)" value={pAudioIn} onChange={setPAudioIn} step={0.05} />
            <Num label="إخراج ($ لكل مليون)" value={pOut} onChange={setPOut} step={0.05} />
            <Num label="سعر الدولار بالجنيه" value={egp} onChange={setEgp} />
          </div>
          <p className="table-secondary">الأسعار تقريبية وتتغير حسب النموذج. راجع صفحة أسعار Gemini الرسمية وعدّلها هنا.</p>
        </details>
      </section>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <h2>
              <Calculator size={18} style={{ display: "inline", marginInlineEnd: 6 }} />
              حاسبة تكلفة تقريبية (ماذا لو؟)
            </h2>
            <p>غيّر الأرقام وشوف التكلفة الشهرية المتوقعة. القيم الافتراضية للتوكنز من استخدامك الفعلي لو متاح.</p>
          </div>
        </div>
        <div className="field-grid" style={{ padding: "0 6px" }}>
          <Num label="عدد المستخدمين" value={users} onChange={setUsers} />
          <Num label="أسئلة زكي لكل مستخدم في اليوم" value={qPerDay} onChange={setQPerDay} />
          <Num label="متوسط خطوات الأدوات لكل سؤال" value={steps} onChange={setSteps} step={0.5} hint="كل خطوة = طلب للنموذج" />
          <Num label="توكنز الإدخال لكل طلب" value={inTok} onChange={setInTok} step={100} />
          <Num label="توكنز الإخراج لكل طلب" value={outTok} onChange={setOutTok} step={50} />
          <Num label="ملاحظات صوتية لكل مستخدم في اليوم" value={voice} onChange={setVoice} />
          <Num label="متوسط مدة الملاحظة (ثانية)" value={voiceSec} onChange={setVoiceSec} />
          <Num label="ملخصات أسبوعية لكل مدير في الأسبوع" value={weekly} onChange={setWeekly} />
          <Num label="أيام العمل في الشهر" value={days_} onChange={setDays} />
        </div>
        <div className="metric-grid" style={{ margin: "14px 6px 8px" }}>
          <div className="metric">
            <span className="metric-top">التكلفة الشهرية المتوقعة</span>
            <strong className="metric-value">${money(calc.usd)}</strong>
            <span className="metric-note">≈ {money(calc.usd * egp, 0)} ج.م</span>
          </div>
          <div className="metric">
            <span className="metric-top">لكل مستخدم في الشهر</span>
            <strong className="metric-value">${money(calc.perUser, 3)}</strong>
            <span className="metric-note">≈ {money(calc.perUser * egp)} ج.م</span>
          </div>
          <div className="metric">
            <span className="metric-top">تفصيل</span>
            <span className="metric-note" style={{ display: "block", lineHeight: 1.9 }}>
              زكي: ${money(calc.agentCost)} ({fmt(calc.agentCalls)} طلب)
              <br />
              الصوت: ${money(calc.voiceCost)} ({fmt(calc.voiceClips)} ملاحظة)
              <br />
              الملخص الأسبوعي: ${money(calc.weeklyCost)} ({fmt(calc.weeklyRuns)} ملخص)
            </span>
          </div>
        </div>
        <p className="table-secondary" style={{ margin: "0 10px 12px" }}>
          تقدير فقط: الصوت ≈ 32 توكن لكل ثانية، والملخص الأسبوعي ≈ 9,000 إدخال / 700 إخراج. التكلفة الفعلية تظهر في لوحة Google AI Studio.
        </p>
      </section>
    </div>
  );
}
