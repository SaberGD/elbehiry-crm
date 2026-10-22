export type SessionEventType = "sign_in" | "sign_out" | "app_open";

export interface SessionEvent {
  id: string;
  uid: string;
  name: string;
  role: string;
  branchId?: string;
  type: SessionEventType;
  at: number;
  device: string;
}

export interface Presence {
  uid: string;
  name: string;
  role: string;
  branchId?: string;
  online: boolean;
  lastSeen: number;
  since: number;
  device: string;
}

/** A heartbeat older than this means the tab was closed without saying goodbye. */
export const ONLINE_WINDOW_MS = 150_000;
export const HEARTBEAT_MS = 60_000;

export interface Who {
  uid: string;
  name: string;
  role: string;
  branchId?: string;
}

export const isOnline = (p: Pick<Presence, "online" | "lastSeen">, now = Date.now()) =>
  p.online && now - p.lastSeen <= ONLINE_WINDOW_MS;

export function deviceLabel(ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent): string {
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "جهاز";
  const br = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "متصفح";
  return `${br} · ${os}`;
}
