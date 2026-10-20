import { useEffect, useRef, useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { aiStatus, runZaki, type ChatTurn } from "../../lib/aiClient";
import { runTool, toolLabels, type ToolData } from "../../lib/zakiTools";
import { zakiGuide, zakiTools } from "../../lib/zakiGuide";
import { today } from "../../lib/presentation";
import { VoiceNoteField } from "../common/VoiceNoteField";

const suggestions = [
  "ملخص الأسبوع",
  "مين العملاء اللي لازم أتابعهم النهارده؟",
  "مين أقوى عملاء البستان؟",
  "أكتر سبب بيخلي العملاء ما يشتروش؟",
  "أضعف فرع مين وليه؟",
];

function Rich({ text }: { text: string }) {
  const inline = (t: string) =>
    t.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
    );
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`l${out.length}`}>
          {list.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*[-•*]\s+(.*)$/);
    if (m) list.push(m[1]);
    else {
      flush();
      if (line.trim()) out.push(<p key={`p${out.length}`}>{inline(line)}</p>);
    }
  }
  flush();
  return <>{out}</>;
}

/** Zaki: a floating assistant that answers questions about the data the user can see. */
export function ZakiChat() {
  const { currentUser, leads, bookings, followUps, visits, notBoughtRecords, brokers, users, branches } = useCRM();
  // Always the latest data: the ref is refreshed on every render, and Firestore keeps the state live.
  const dataRef = useRef<ToolData | null>(null);
  dataRef.current = { today: today(), leads, bookings, followUps, visits, notBoughtRecords, brokers, users, branches };
  const [steps, setSteps] = useState<string[]>([]);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const titles = new Set(["م", "م.", "eng", "eng.", "dr", "dr.", "د", "د.", "أ", "أ.", "المهندس", "الدكتور", "الحاج", "الأستاذ"]);
  const first = currentUser.name.split(" ").find((w) => !titles.has(w.toLowerCase())) ?? currentUser.name;

  useEffect(() => {
    aiStatus().then((s) => setAvailable(s === "server"));
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy, open]);

  if (!available) return null;

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const history = turns;
    setTurns((t) => [...t, { role: "user", text: q }]);
    setBusy(true);
    setSteps([]);
    try {
      const { answer, used } = await runZaki({
        question: q,
        history,
        tools: zakiTools,
        guide: zakiGuide,
        today: today(),
        viewer: currentUser.name,
        execute: (name, args) => runTool(name, args, dataRef.current!),
        onStep: (name) => setSteps((s) => [...s, toolLabels[name] ?? name]),
      });
      setTurns((t) => [...t, { role: "assistant", text: answer, used: [...new Set(used.map((u) => toolLabels[u] ?? u))] }]);
    } catch (e) {
      const code = e instanceof Error ? e.message.slice(0, 160) : "";
      setTurns((t) => [
        ...t,
        { role: "assistant", text: `حصلت مشكلة وأنا بجهّز الرد. جرّب تسألني تاني بعد شوية.${code ? `\n(${code})` : ""}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button className="zaki-fab" onClick={() => setOpen(true)} aria-label="افتح زكي، المساعد الذكي">
          <span className="zaki-avatar">ز</span>
          <span className="zaki-fab-label">زكي</span>
        </button>
      )}
      {open && (
        <div className="zaki-panel" role="dialog" aria-label="زكي، المساعد الذكي">
          <div className="zaki-head">
            <span className="zaki-avatar">ز</span>
            <div>
              <strong>زكي</strong>
              <small>مساعد البحيري · بيجاوب من بيانات نظامك</small>
            </div>
            <button className="icon-button" onClick={() => setOpen(false)} aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>
          <div className="zaki-body">
            <div className="zaki-msg bot">
              <p>
                أهلًا {first}! أنا زكي. اسألني عن العملاء والوسطاء والمتابعات والمبيعات، بالكتابة أو بالصوت، وأنا أرد من بيانات النظام اللي
                بتشوفها.
              </p>
            </div>
            {turns.length === 0 && (
              <div className="zaki-chips">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`zaki-msg ${t.role === "user" ? "me" : "bot"}`}>
                {t.role === "user" ? <p>{t.text}</p> : <Rich text={t.text} />}
                {t.used && t.used.length > 0 && <small className="zaki-used">بص على: {t.used.join("، ")}</small>}
              </div>
            ))}
            {busy && (
              <div className="zaki-msg bot">
                <p>
                  <Loader2 size={14} className="spin" /> {steps.length ? `${steps[steps.length - 1]}…` : "زكي بيفكّر…"}
                </p>
              </div>
            )}
            <div ref={end} />
          </div>
          <div className="zaki-foot">
            <VoiceNoteField
              value={input}
              onChange={setInput}
              rows={1}
              hideImprove
              placeholder="اكتب سؤالك أو اضغط تكلّم…"
              onSubmit={() => send(input)}
            />
            <button className="btn-primary zaki-send" onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="إرسال">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
