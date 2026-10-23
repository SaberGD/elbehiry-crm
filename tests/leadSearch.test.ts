import { test } from "node:test";
import assert from "node:assert/strict";
import { keysAreCurrent, leadSearchKeys, matchesKey, matchesSearch, normalizeText, parseSearch, phoneDigits, visitParty, visitSearchKeys } from "../src/lib/leadSearch";

const lead = { name: "أحمد عبد الرحمن", phone: "+20 100 123 4567", whatsappPhone: "01223334445", courseOfInterest: "فيلا" };

test("spelling variants normalise to one form", () => {
  assert.equal(normalizeText("أَحْمَد"), "احمد");
  assert.equal(normalizeText("مصطفى"), normalizeText("مصطفي"));
  assert.equal(normalizeText("فاطمة"), normalizeText("فاطمه"));
  assert.equal(normalizeText("٠١٠٠"), "0100");
});

test("phone numbers are compared without country code or punctuation", () => {
  assert.equal(phoneDigits("+20 100 123 4567"), "01001234567");
  assert.equal(phoneDigits("0020 100 123 4567"), "01001234567");
  assert.equal(phoneDigits("1001234567"), "01001234567");
});

test("every beginning of a name word and both ends of a phone are keys", () => {
  const keys = leadSearchKeys(lead);
  for (const k of ["n:اح", "n:احمد", "n:عبد", "n:الرحمن", "n:فيلا", "p:0100", "p:01001234567", "s:4567", "s:1001234567", "p:0122", "s:4445"]) assert.ok(keys.includes(k), k);
  assert.ok(!keys.includes("n:ا"), "one letter is too short to search by");
});

test("a typed search becomes one indexed key", () => {
  assert.deepEqual(parseSearch("احمد"), { key: "n:احمد", words: [], digits: [] });
  assert.equal(parseSearch("0100123")?.key, "p:0100123");
  assert.equal(parseSearch("4567")?.key, "s:4567");
  assert.equal(parseSearch("ا"), null, "too short");
  assert.equal(parseSearch("1"), null, "one digit");
  assert.equal(parseSearch("12")?.key, "n:12", "a short number is read as part of a name");
  assert.equal(parseSearch("0007")?.key, "s:0007", "a number that cannot start a phone is read from its end");
  assert.equal(parseSearch("01001")?.key, "p:01001");
  assert.equal(parseSearch("   "), null);
});

test("a search with several parts looks up the most specific and checks the rest", () => {
  const s = parseSearch("احمد الرحمن")!;
  assert.equal(s.key, "n:الرحمن");
  assert.deepEqual(s.words, ["احمد"]);
  assert.ok(matchesSearch(lead, s));
  assert.ok(!matchesSearch({ ...lead, name: "محمود الرحمن" }, s));
  const withPhone = parseSearch("احمد 4567")!;
  assert.equal(withPhone.key, "s:4567");
  assert.ok(matchesSearch(lead, withPhone));
  assert.ok(!matchesSearch({ ...lead, name: "سعيد", courseOfInterest: "" }, withPhone));
});

test("a short number typed with a name must be in the name or the phone", () => {
  const s = parseSearch("كثير 07")!;
  assert.equal(s.key, "n:كثير");
  assert.ok(matchesSearch({ name: "عميل كثير 07", phone: "01200000007" }, s));
  assert.ok(!matchesSearch({ name: "عميل كثير 17", phone: "01200000017" }, s));
});

test("a word longer than a key is checked in full", () => {
  const s = parseSearch("عبدالرحمنمحمدعلي")!;
  assert.equal(s.key.length, "n:".length + 12);
  assert.deepEqual(s.words, ["عبدالرحمنمحمدعلي"]);
  assert.ok(!matchesSearch({ ...lead, name: "عبدالرحمنمحمدسعيد" }, s));
});

test("every key a search can produce is one the customer was given", () => {
  const keys = new Set(leadSearchKeys(lead));
  for (const q of ["احمد", "الرحمن", "0100", "01001", "4567", "123 4567", "فيلا", "1223334445", "عبد"]) {
    const s = parseSearch(q);
    assert.ok(s && keys.has(s.key), `${q} -> ${s?.key}`);
  }
});

test("keys are recognised as current only for the customer as it is", () => {
  assert.ok(keysAreCurrent({ ...lead, searchKeys: leadSearchKeys(lead) }));
  assert.ok(!keysAreCurrent({ ...lead }));
  assert.ok(!keysAreCurrent({ ...lead, name: "سعيد", searchKeys: leadSearchKeys(lead) }));
});

test("a visit is found by its visitor, its broker and its phones", () => {
  const visit = { visitorName: "سمير علي", brokerName: "المهندس هاني", phone: "01012345678", whatsappPhone: "" };
  const keys = visitSearchKeys(visit);
  for (const k of ["n:سمير", "n:علي", "n:هاني", "p:0101", "s:5678"]) assert.ok(keys.includes(k), k);
  assert.ok(matchesSearch(visitParty(visit), parseSearch("هاني 5678")!));
  const wrong = parseSearch("هاني 9999")!;
  assert.ok(!matchesKey(visitParty(visit), wrong.key), "the key itself is what the database checks");
  assert.ok(keysAreCurrent({ ...visitParty(visit), searchKeys: keys }));
});
