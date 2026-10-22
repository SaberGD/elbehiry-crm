import { test } from "node:test";
import assert from "node:assert/strict";
import { compareKeys, hasMoreRows, restrictStreams, takeNext, type Key, type StreamState } from "../src/lib/pagedMerge";

test("no scope means nothing to read, the whole scope is one query", () => {
  assert.deepEqual(restrictStreams("none", []), []);
  assert.deepEqual(restrictStreams("all", []), [[]]);
  assert.deepEqual(restrictStreams("all", [["status", "==", "new"], ["branchId", "==", "b1"]]), [[["status", "==", "new"], ["branchId", "==", "b1"]]]);
});

test("a filter narrows every query of the scope", () => {
  const scope = [[["branchId", "==", "b1"], ["assignedAgentId", "==", "u1"]], [["branchId", "==", "b1"], ["delegatedTo", "array-contains", "u1"]]] as never;
  const out = restrictStreams(scope, [["status", "==", "new"]]);
  assert.equal(out.length, 2);
  assert.ok(out.every((s) => s.some(([f, , v]) => f === "status" && v === "new")));
});

test("a filter that contradicts the scope removes the query", () => {
  assert.deepEqual(restrictStreams([[["branchId", "==", "b1"]]] as never, [["branchId", "==", "b2"]]), []);
  assert.deepEqual(restrictStreams([[["branchId", "==", "b1"]]] as never, [["branchId", "==", "b1"]]), [[["branchId", "==", "b1"]]]);
});

test("choosing one branch out of several narrows the list of branches", () => {
  const out = restrictStreams([[["branchId", "in", ["b1", "b2"]]]] as never, [["branchId", "==", "b2"]]);
  assert.deepEqual(out, [[["branchId", "==", "b2"]]]);
  assert.deepEqual(restrictStreams([[["branchId", "in", ["b1", "b2"]]]] as never, [["branchId", "==", "b9"]]), []);
});

test("order is newest first, then by id", () => {
  const keys: Key[] = [{ v: "2026-01-01", id: "a" }, { v: "2026-03-01", id: "a" }, { v: "2026-03-01", id: "b" }];
  assert.deepEqual([...keys].sort(compareKeys).map((k) => k.v + k.id), ["2026-03-01b", "2026-03-01a", "2026-01-01a"]);
});

type Row = { id: string; at: string };
const keyOf = (r: Row): Key => ({ v: r.at, id: r.id });
const stream = (rows: Row[], done: boolean): StreamState<Row> => ({
  buffer: [...rows],
  cursor: rows.length ? keyOf(rows[rows.length - 1]) : null,
  done,
});
const row = (id: string, at: string): Row => ({ id, at });

test("two queries merge into one newest-first list", () => {
  const a = stream([row("a1", "05"), row("a2", "03"), row("a3", "01")], true);
  const b = stream([row("b1", "04"), row("b2", "02")], true);
  const out = takeNext([a, b], 10, keyOf, (r) => r.id, new Set());
  assert.deepEqual(out.map((r) => r.id), ["a1", "b1", "a2", "b2", "a3"]);
});

test("a row is held back while a query that is not finished could still hold something newer", () => {
  // Stream b has only been read down to "04"; anything older than that is unread, so a "03" row cannot be shown yet.
  const a = stream([row("a1", "05"), row("a2", "03")], true);
  const b = stream([row("b1", "06"), row("b2", "04")], false);
  const out = takeNext([a, b], 10, keyOf, (r) => r.id, new Set());
  assert.deepEqual(out.map((r) => r.id), ["b1", "a1", "b2"]);
  assert.ok(hasMoreRows([a, b]));
  assert.deepEqual(a.buffer.map((r) => r.id), ["a2"]);
});

test("a customer present in two queries is shown once", () => {
  const a = stream([row("x", "05"), row("a2", "03")], true);
  const b = stream([row("x", "05"), row("b2", "02")], true);
  const out = takeNext([a, b], 10, keyOf, (r) => r.id, new Set());
  assert.deepEqual(out.map((r) => r.id), ["x", "a2", "b2"]);
});

test("only a page is taken and the rest waits", () => {
  const a = stream([row("1", "09"), row("2", "08"), row("3", "07")], true);
  const seen = new Set<string>();
  assert.deepEqual(takeNext([a], 2, keyOf, (r) => r.id, seen).map((r) => r.id), ["1", "2"]);
  assert.deepEqual(takeNext([a], 2, keyOf, (r) => r.id, seen).map((r) => r.id), ["3"]);
  assert.ok(!hasMoreRows([a]));
});
