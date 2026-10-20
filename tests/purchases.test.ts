import test from "node:test";
import assert from "node:assert/strict";
import { bookingSplit, splitTotals } from "../src/lib/purchases";
import type { Booking } from "../src/types/crm";

const base = {
  id: "b",
  leadId: "l",
  leadName: "n",
  leadPhone: "0",
  branchId: "br",
  agentId: "a",
  courseId: "c",
  courseName: "c",
  bookingDate: "2026-10-20",
  bookingStatus: "confirmed",
  source: "walk_in",
  notes: "",
  createdAt: "",
} as const;

test("a purchase can be split across any subset of departments", () => {
  const b = {
    ...base,
    department: "garden",
    amount: 1_000_000,
    departmentAmounts: { garden: 500_000, decor: 250_000, general: 250_000 },
  } as Booking;
  assert.deepEqual(bookingSplit(b), {
    construction: 0,
    decor: 250_000,
    garden: 500_000,
    general: 250_000,
  });
});

test("older single-department records fall back to department and amount", () => {
  const b = { ...base, department: "decor", amount: 40_000 } as Booking;
  assert.equal(bookingSplit(b).decor, 40_000);
  assert.equal(bookingSplit(b).garden, 0);
});

test("department totals add up across purchases", () => {
  const a = {
    ...base,
    department: "decor",
    amount: 30,
    departmentAmounts: { decor: 10, garden: 20 },
  } as Booking;
  const c = { ...base, department: "garden", amount: 5 } as Booking;
  const t = splitTotals([a, c]);
  assert.equal(t.decor, 10);
  assert.equal(t.garden, 25);
});
