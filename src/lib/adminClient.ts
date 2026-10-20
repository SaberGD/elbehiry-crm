import { auth } from "./firebase";

const ENDPOINT = "/api/admin.php";

export async function adminStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${ENDPOINT}?ping=1`, { cache: "no-store" });
    return !!(await res.json())?.configured;
  } catch {
    return false;
  }
}

/** Asks the server to set a fresh RANDOM password for a staff member (it also forces a change at next sign-in). */
export async function resetStaffPassword(userId: string): Promise<{ password: string; loginId: string | null }> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ action: "reset_password", userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data?.error as string | undefined;
    const msg: Record<string, string> = {
      not_configured: "إعادة التعيين لسه مش متفعّلة على السيرفر (محتاجة مفتاح Firebase Admin).",
      no_login: "الموظف ده ملوش حساب دخول لسه.",
      forbidden: "مش مسموح لك تعيد تعيين كلمة مرور الشخص ده.",
      rate_limited: "محاولات كتير، جرّب بعد شوية.",
      unauthorized: "سجّل الدخول من جديد وحاول تاني.",
    };
    throw new Error(`${(code && msg[code]) || "تعذر إعادة التعيين، حاول تاني."}${data?.detail ? ` (${data.detail})` : ""}`);
  }
  return { password: data.password, loginId: data.loginId ?? null };
}
