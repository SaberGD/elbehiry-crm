import { auth } from "./firebase";

const ENDPOINT = "/api/ai.php";

export type AiStatus = "unknown" | "server" | "none";
let cached: AiStatus = "unknown";

async function authHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** Whether the server-side speech/AI helper (api/ai.php) is configured. */
export async function aiStatus(): Promise<AiStatus> {
  if (cached !== "unknown") return cached;
  try {
    const res = await fetch(`${ENDPOINT}?ping=1`, { cache: "no-store" });
    const data = await res.json();
    cached = data?.configured ? "server" : "none";
  } catch {
    cached = "none";
  }
  return cached;
}

async function call(init: RequestInit): Promise<any> {
  const res = await fetch(ENDPOINT, {
    ...init,
    headers: { ...(init.headers || {}), ...(await authHeader()) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

/** Egyptian-Arabic speech to text. */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("mode", "transcribe");
  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
  form.append("audio", blob, `note.${ext}`);
  const data = await call({ method: "POST", body: form });
  return String(data.text || "").trim();
}

/** Cleans up a note without adding information, and suggests a not-bought reason if clear. */
export async function refineText(
  text: string,
  reasons: { id: string; label: string }[] = [],
): Promise<{ text: string; reasonId: string | null }> {
  const data = await call({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "refine", text, reasons }),
  });
  return { text: String(data.text || text), reasonId: data.reasonId || null };
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/** Zaki, the manager's assistant: answers from the (role-scoped) system snapshot. */
export async function askZaki(question: string, history: ChatTurn[], snapshot: unknown): Promise<string> {
  const data = await call({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "chat", question, history, snapshot }),
  });
  return String(data.answer || "").trim();
}

export interface WeeklyReport {
  headline: string;
  improved: { title: string; detail: string }[];
  dropped: { title: string; why: string }[];
  next_week: { action: string; reason: string }[];
}

export async function weeklySummary(snapshot: unknown): Promise<WeeklyReport> {
  return call({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "weekly", snapshot }),
  });
}
