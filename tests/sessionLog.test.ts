import test from "node:test";
import assert from "node:assert/strict";
import { deviceLabel, isOnline, ONLINE_WINDOW_MS } from "../src/lib/sessionPresence";

test("online only while the heartbeat is fresh", () => {
  const now = 1_000_000;
  assert.equal(isOnline({ online: true, lastSeen: now - 1000 }, now), true);
  assert.equal(isOnline({ online: true, lastSeen: now - ONLINE_WINDOW_MS - 1 }, now), false);
  assert.equal(isOnline({ online: false, lastSeen: now }, now), false);
});

test("device label", () => {
  assert.equal(deviceLabel("Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537"), "Chrome · Android");
  assert.equal(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604"), "Safari · iOS");
});
