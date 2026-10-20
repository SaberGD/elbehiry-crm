import type { Lead, ReviewNote, ReviewRequest } from "../types/crm";
import { greetingName } from "./names";

export const REVIEW_REMINDER_HOURS = 48;
const HOUR = 3_600_000;

/** 24 random lowercase letters/digits: this is the secret in the customer's link. */
export function newReviewToken(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(random(24), (b) => alphabet[b % alphabet.length]).join("");
}

export function reviewLink(token: string, origin = typeof location !== "undefined" ? location.origin : ""): string {
  return `${origin}/review/?t=${token}`;
}

/** Egyptian mobile numbers to the international form wa.me needs. */
export function whatsappNumber(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("20")) return d;
  if (d.startsWith("0")) return `20${d.slice(1)}`;
  return d;
}

export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(text)}`;
}

const firstName = greetingName;

export function requestMessage(lead: Pick<Lead, "name">, subjectLabel: string, link: string): string {
  return `أهلًا ${firstName(lead.name)} 🌷\nشكرًا إنك زرتنا (${subjectLabel}) في البحيري للدهانات والديكور.\nرأيك يهمنا جدًا، ممكن تقيّم تجربتك في دقيقة واحدة؟ ولو عندك أي ملاحظة أو شكوى اكتبها لنا وهنتابعها فورًا:\n${link}`;
}

export function reminderMessage(lead: Pick<Lead, "name">, link: string): string {
  return `أهلًا ${firstName(lead.name)}، تذكير لطيف 🌷 لو فاضي دقيقة ممكن تقيّم تجربتك معانا؟ رأيك بيفرق معانا:\n${link}`;
}

/** Where a request stands for the salesperson who sent it. */
export type ReviewPhase = "waiting" | "reminder_due" | "reminder_sent" | "expired" | "answered" | "cancelled";

export function reviewPhase(r: ReviewRequest, now = Date.now()): ReviewPhase {
  if (r.status === "answered") return "answered";
  if (r.status === "cancelled") return "cancelled";
  if (r.reminderSentAt) {
    return now - new Date(r.reminderSentAt).getTime() >= REVIEW_REMINDER_HOURS * HOUR ? "expired" : "reminder_sent";
  }
  return now - new Date(r.sentAt).getTime() >= REVIEW_REMINDER_HOURS * HOUR ? "reminder_due" : "waiting";
}

/** Complaint = the customer said so, or rated low; the AI can also flag one hidden in a comment. */
export function isComplaint(r: ReviewRequest): boolean {
  if (r.status !== "answered") return false;
  return !!r.isComplaint || (r.response?.rating ?? 5) <= 2 || r.ai?.kind === "complaint";
}

export type ComplaintState = "open" | "followed_up" | "resolved";

export function complaintState(r: ReviewRequest, notes: ReviewNote[]): ComplaintState {
  const mine = notes.filter((n) => n.requestId === r.id).sort((a, b) => a.at.localeCompare(b.at));
  if (!mine.length) return "open";
  return mine[mine.length - 1].kind === "resolved" ? "resolved" : "followed_up";
}

export const complaintStateLabel: Record<ComplaintState, string> = {
  open: "جديدة",
  followed_up: "تحت المتابعة",
  resolved: "اتحلّت",
};

export function averageRating(list: ReviewRequest[]): number | null {
  const rated = list.filter((r) => r.status === "answered" && r.response).map((r) => r.response!.rating);
  return rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
}
