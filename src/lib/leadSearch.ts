import type { Lead } from "../types/crm";

/**
 * Customer search that runs in the database instead of the browser.
 *
 * Firestore cannot do "contains", so each customer carries `searchKeys`: the beginnings of every word
 * of the name and the beginnings and endings of the phone numbers. A search picks one key, asks the
 * database for the customers that have it (an indexed lookup), and checks any further words here.
 */

/** Bump when the way keys are built changes: every customer is then re-indexed once. */
export const SEARCH_INDEX_VERSION = 1;

const MIN_NAME_CHARS = 2;
const MIN_PHONE_DIGITS = 4;
const MAX_KEY_CHARS = 12;
const MAX_WORDS = 8;

const arabicDigits = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/** Same spelling for the same person: no diacritics, one form of alef, ya and ta marbuta, lower case. */
export function normalizeText(text: string): string {
  return arabicDigits(text || "")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Digits only, with the country code dropped so +20 100 123 4567 and 0100 123 4567 are the same number. */
export function phoneDigits(phone: string): string {
  const d = arabicDigits(phone || "").replace(/\D/g, "");
  if (d.startsWith("0020")) return "0" + d.slice(4);
  if (d.startsWith("20") && d.length >= 12) return "0" + d.slice(2);
  // A mobile number written without its leading zero.
  if (d.length === 10 && d.startsWith("1")) return "0" + d;
  return d;
}

const prefixes = (word: string, from: number, to: number) => {
  const out: string[] = [];
  for (let n = from; n <= Math.min(word.length, to); n++) out.push(word.slice(0, n));
  return out;
};

function phoneKeys(phone: string | undefined): string[] {
  const d = phoneDigits(phone || "");
  if (d.length < MIN_PHONE_DIGITS) return [];
  const keys: string[] = [];
  // Typed from the start (0100…) or from the end (…4567).
  for (let n = MIN_PHONE_DIGITS; n <= Math.min(d.length, 11); n++) keys.push("p:" + d.slice(0, n));
  const tail = d.slice(-10);
  for (let n = MIN_PHONE_DIGITS; n <= tail.length; n++) keys.push("s:" + tail.slice(-n));
  return keys;
}

/** Everything a customer can be found by. Stored on the customer as `searchKeys`. */
export function leadSearchKeys(lead: Pick<Lead, "name" | "phone" | "whatsappPhone" | "courseOfInterest">): string[] {
  const keys = new Set<string>();
  const words = normalizeText(`${lead.name || ""} ${lead.courseOfInterest || ""}`).split(" ").filter(Boolean).slice(0, MAX_WORDS);
  for (const w of words) for (const p of prefixes(w, MIN_NAME_CHARS, MAX_KEY_CHARS)) keys.add("n:" + p);
  for (const k of phoneKeys(lead.phone)) keys.add(k);
  for (const k of phoneKeys(lead.whatsappPhone)) keys.add(k);
  return [...keys];
}

/** A typed number that starts like a phone number (01…, 02…) is read from its start; any other is read from its end. */
const isPhonePrefix = (digits: string) => /^0[1-9]/.test(digits);

export interface ParsedSearch {
  /** The one key the database is asked for. */
  key: string;
  /** The rest of what was typed, checked on the rows that come back. */
  words: string[];
  digits: string[];
}

/** Turns what was typed into one indexed lookup plus the leftover checks; null when it is too short to search. */
export function parseSearch(input: string): ParsedSearch | null {
  const text = normalizeText(input);
  if (!text) return null;
  const parts = text.split(" ").filter(Boolean);
  // A short run of digits is more likely part of a name ("branch 2") than a phone number.
  const isNumber = (p: string) => /^\d+$/.test(p) && p.length >= MIN_PHONE_DIGITS;
  const numbers = parts.filter(isNumber);
  const words = parts.filter((p) => !isNumber(p));
  const usableNumbers = numbers;
  const usableWords = words.filter((w) => w.length >= MIN_NAME_CHARS);

  let key: string | null = null;
  let used: string | null = null;
  if (usableNumbers.length) {
    // The longest number is the most specific; a number starting with 0 is read from the start, otherwise from the end.
    used = usableNumbers.reduce((a, b) => (b.length > a.length ? b : a));
    const d = phoneDigits(used);
    key = isPhonePrefix(d) ? "p:" + d.slice(0, 11) : "s:" + d.slice(-10);
  } else if (usableWords.length) {
    // The longest word is the most specific; of equal ones the later (a family name says more than a first name).
    used = usableWords.reduce((a, b) => (b.length >= a.length ? b : a));
    key = "n:" + used.slice(0, MAX_KEY_CHARS);
  }
  if (!key) return null;
  // A word longer than a key can hold is looked up by its beginning and checked in full on the rows.
  const longWord = used !== null && words.includes(used) && used.length > MAX_KEY_CHARS;
  return {
    key,
    words: words.filter((w) => w !== used || longWord),
    digits: numbers.filter((n) => n !== used),
  };
}

/** The checks a database row still has to pass after the indexed lookup (words typed besides the key). */
export function matchesSearch(lead: Pick<Lead, "name" | "phone" | "whatsappPhone" | "courseOfInterest">, s: ParsedSearch): boolean {
  const nameWords = normalizeText(`${lead.name || ""} ${lead.courseOfInterest || ""}`).split(" ");
  const phones = [phoneDigits(lead.phone), phoneDigits(lead.whatsappPhone || "")];
  return (
    s.words.every((w) => nameWords.some((n) => n.startsWith(w))) &&
    s.digits.every((d) => nameWords.some((n) => n.startsWith(d)) || phones.some((p) => (isPhonePrefix(d) ? p.startsWith(d) : p.endsWith(d))))
  );
}

/** True when the stored keys are what they would be for the customer as it is now. */
export function keysAreCurrent(lead: Pick<Lead, "name" | "phone" | "whatsappPhone" | "courseOfInterest"> & { searchKeys?: string[] }): boolean {
  const want = leadSearchKeys(lead);
  const have = lead.searchKeys || [];
  return want.length === have.length && want.every((k) => have.includes(k));
}

/** Whether a customer has the key a search asked the database for (for queries that could not ask it). */
export function matchesKey(lead: Pick<Lead, "name" | "phone" | "whatsappPhone" | "courseOfInterest">, key: string): boolean {
  const kind = key.slice(0, 2);
  const value = key.slice(2);
  if (kind === "n:") return normalizeText(`${lead.name || ""} ${lead.courseOfInterest || ""}`).split(" ").some((w) => w.startsWith(value));
  const phones = [phoneDigits(lead.phone), phoneDigits(lead.whatsappPhone || "")];
  return kind === "p:" ? phones.some((p) => p.startsWith(value)) : phones.some((p) => p.slice(-10).endsWith(value));
}
