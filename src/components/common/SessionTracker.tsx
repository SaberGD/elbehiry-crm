import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { HEARTBEAT_MS, logSessionEvent, writePresence } from "../../lib/sessionLog";

const SIGNED_IN_FLAG = "sessionlog_signed_in";

/** Records that a signed-in person opened the app and keeps their "online" heartbeat fresh. Renders nothing. */
export function SessionTracker() {
  const { profile, status } = useAuth();
  const uid = profile?.uid;
  const name = profile?.name;
  const role = profile?.role;
  const branchId = profile?.branchId;

  useEffect(() => {
    if (status !== "ready" || !uid || !name || !role) return;
    const who = { uid, name, role, branchId };
    const since = Date.now();
    let fresh = false;
    try {
      // Signing in just now already wrote a "sign_in" row; only later visits count as "opened the app".
      fresh = sessionStorage.getItem(SIGNED_IN_FLAG) === "1";
      if (!fresh) sessionStorage.setItem(SIGNED_IN_FLAG, "1");
    } catch {
      /* ignore */
    }
    if (!fresh) void logSessionEvent(who, "app_open");
    void writePresence(who, true, since);

    const beat = () => {
      if (document.visibilityState === "visible") void writePresence(who, true, since);
    };
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    const onLeave = () => void writePresence(who, false, since);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [status, uid, name, role, branchId]);

  return null;
}
