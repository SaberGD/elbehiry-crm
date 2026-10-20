import test from "node:test";
import assert from "node:assert/strict";
import { branchQuota, defaultLicense } from "../src/lib/license";

test("the plan allows two real branches; sample and stopped branches do not count", () => {
  assert.equal(defaultLicense.maxBranches, 2);
  const none = branchQuota([]);
  assert.deepEqual(none, { max: 2, used: 0, left: 2, full: false });
  const sample = Array.from({ length: 30 }, () => ({ active: true, isDemo: true }));
  assert.equal(branchQuota(sample).used, 0);
  const one = branchQuota([{ active: true }, { active: false }]);
  assert.deepEqual([one.used, one.left, one.full], [1, 1, false]);
  assert.equal(branchQuota([{ active: true }, { active: true }]).full, true);
  assert.equal(branchQuota([{ active: true }, { active: true }], { maxBranches: 5 }).left, 3);
});
