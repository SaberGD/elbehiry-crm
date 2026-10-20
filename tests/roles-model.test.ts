import test from "node:test";
import assert from "node:assert/strict";
import type { User } from "../src/types/crm";
import { assignableRoles, branchAgents, defaultAgent } from "../src/lib/access";
import { positionNames } from "../src/lib/permissions";

const u = (id: string, role: User["role"], over: Partial<User> = {}) => ({ id, name: id, role, active: true, ...over }) as User;
const owner = u("o", "general_manager");
const gsm = u("g", "regional_manager");
const bm1 = u("bm1", "branch_manager", { branchId: "b1" });
const bm2 = u("bm2", "branch_manager", { branchId: "b2" });
const all = [owner, gsm, bm1, bm2, u("dev", "admin")];

test("role names follow the business: owner, general sales manager, branch sales manager", () => {
  assert.equal(positionNames.general_manager, "صاحب البيزنس");
  assert.equal(positionNames.regional_manager, "مدير المبيعات العام");
  assert.equal(positionNames.branch_manager, "مدير مبيعات الفرع");
});

test("who creates whom: developer anyone, owner the two sales managers, general sales manager the branch managers", () => {
  const withManage = (x: User) => ({ ...x, permissions: ["staff.manage", "staff.view", "branches.view"] }) as User;
  assert.deepEqual(assignableRoles(u("dev", "admin")), ["admin", "general_manager", "regional_manager", "branch_manager"]);
  assert.deepEqual(assignableRoles(owner), ["regional_manager", "branch_manager"]);
  assert.deepEqual(assignableRoles(withManage(gsm)), ["branch_manager"]);
});

test("a customer goes to the branch sales manager by default; the general sales manager can be picked anywhere", () => {
  assert.deepEqual(branchAgents(all, "b1").map((x) => x.id).sort(), ["bm1", "g"]);
  // the owner registering in branch 2 does not own the customer: the branch's sales manager does
  assert.equal(defaultAgent(all, owner, "b2"), "bm2");
  // a branch sales manager registering in their own branch owns it
  assert.equal(defaultAgent(all, bm1, "b1"), "bm1");
  // the general sales manager registering a customer sells it themselves
  assert.equal(defaultAgent(all, gsm, "b2"), "g");
  // one who oversees only some branches is not offered elsewhere
  const limited = u("g2", "regional_manager", { supervisedBranchIds: ["b1"] });
  assert.deepEqual(branchAgents([limited, bm2], "b2").map((x) => x.id), ["bm2"]);
});
