import { test } from "node:test";
import assert from "node:assert/strict";
import { compareKeys, hasMoreRows, planFilters, planStreams, restrictStreams, rowMatches, takeNext, valueAt, type Key, type StreamState } from "../src/lib/pagedMerge";

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

test("a date or number narrowing is added to every query of the scope", () => {
  const scope = [[["branchId", "==", "b1"], ["receivedByAgentId", "==", "u1"]]] as never;
  assert.deepEqual(restrictStreams(scope, [["receivedByAgentId", "==", "u1"], ["date", ">=", "2026-10-01"]]), [[["branchId", "==", "b1"], ["receivedByAgentId", "==", "u1"], ["date", ">=", "2026-10-01"]]]);
  assert.deepEqual(restrictStreams("all", [["response.rating", "<=", 2]]), [[["response.rating", "<=", 2]]]);
  assert.deepEqual(restrictStreams(scope, [["receivedByAgentId", "==", "u2"], ["date", ">=", "2026-10-01"]]), [], "someone else's visits are never in this person's scope");
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

test("equality filters all go to the database; a search or a range sends the others to the rows", () => {
  const eq = [["status", "==", "new"], ["branchId", "==", "b1"]] as never;
  assert.deepEqual(planFilters(eq, { searching: false, scopeFields: ["branchId"] }), { db: eq, client: [] });
  assert.deepEqual(planFilters(eq, { searching: true, scopeFields: ["branchId"] }), { db: [], client: eq });
  const ranged = [["visitorType", "==", "broker"], ["branchId", "==", "b1"], ["date", ">=", "2026-10-01"]] as never;
  const plan = planFilters(ranged, { searching: false, scopeFields: ["branchId", "receivedByAgentId"] });
  assert.deepEqual(plan.db, [["branchId", "==", "b1"], ["date", ">=", "2026-10-01"]]);
  assert.deepEqual(plan.client, [["visitorType", "==", "broker"]]);
});

test("a query that holds an array filter takes no more filters; they are checked on its rows", () => {
  const scope = [[["branchId", "==", "b1"], ["assignedAgentId", "==", "u1"]], [["branchId", "==", "b1"], ["delegatedTo", "array-contains", "u1"]]] as never;
  const planned = planStreams(scope, { db: [["status", "==", "new"]], client: [] } as never);
  assert.equal(planned.length, 2);
  assert.equal(planned[0].db, true);
  assert.deepEqual(planned[0].filters.at(-1), ["status", "==", "new"]);
  assert.equal(planned[1].db, false);
  assert.deepEqual(planned[1].filters, [["branchId", "==", "b1"], ["delegatedTo", "array-contains", "u1"]]);
  assert.deepEqual(planned[1].client, [["status", "==", "new"]]);
});

test("a filter the scope rules out leaves that query out", () => {
  const planned = planStreams([[["branchId", "==", "b1"]]] as never, { db: [["branchId", "==", "b2"]], client: [] } as never);
  assert.deepEqual(planned, []);
});

test("rows are checked against filters the way the database would", () => {
  const row = { status: "new", response: { rating: 2 }, tags: ["a"], date: "2026-10-05" };
  assert.equal(valueAt(row, "response.rating"), 2);
  assert.ok(rowMatches(row, [["status", "==", "new"], ["response.rating", "<=", 2], ["tags", "array-contains", "a"], ["date", ">=", "2026-10-01"], ["status", "in", ["new", "x"]]] as never));
  assert.ok(!rowMatches(row, [["date", "<=", "2026-10-01"]] as never));
  assert.ok(!rowMatches(row, [["missing", ">=", "a"]] as never), "a missing field is in no range");
});
