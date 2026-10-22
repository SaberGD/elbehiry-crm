import { test } from "node:test";
import assert from "node:assert/strict";
import { changedFields } from "../src/lib/rowDiff";

test("only the fields that changed are written", () => {
  const stored = { id: "a", name: "أحمد", status: "new", tags: ["x"], extra: { k: 1 } };
  const edited = { ...stored, status: "contacted", tags: ["x", "y"] };
  assert.deepEqual(changedFields(stored, edited), { set: { status: "contacted", tags: ["x", "y"] }, remove: [] });
});

test("an unchanged row writes nothing", () => {
  const row = { id: "a", n: 1, o: { a: [1, 2] } };
  assert.deepEqual(changedFields(row, { ...row, o: { a: [1, 2] } }), { set: {}, remove: [] });
});

test("a field set to undefined is removed, one never stored is ignored", () => {
  assert.deepEqual(changedFields({ id: "a", note: "x", gone: 1 }, { id: "a", note: undefined, gone: 1, never: undefined }), { set: {}, remove: ["note"] });
});

test("a new field is added", () => {
  assert.deepEqual(changedFields({ id: "a" }, { id: "a", searchKeys: ["n:اح"] }), { set: { searchKeys: ["n:اح"] }, remove: [] });
});
