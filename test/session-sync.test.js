import test from "node:test";
import assert from "node:assert/strict";

import {
  getSession,
  isOwnWrite,
  replaceSession,
} from "../src/content/session-store.js";

const storedSession = (annotations) => ({
  sessionId: "qa-2026-11-16-1030",
  startedAt: "2026-11-16T10:30:00.000Z",
  startedAtLabel: "2026-11-16 10:30",
  annotations,
  writer: "another-tab",
});

const issue = (id, index) => ({
  id,
  index,
  pageUrl: "https://example.com/",
  areas: [{ kind: "element", comment: `Issue ${index}`, rect: { x: 0, y: 0 } }],
});

test("another tab's write replaces the session this tab shows", () => {
  replaceSession(storedSession([issue("a", 1), issue("b", 2)]));
  assert.deepEqual(
    getSession().annotations.map(({ id }) => id),
    ["a", "b"],
  );
  assert.equal(getSession().sessionId, "qa-2026-11-16-1030");
});

test("a session finished in another tab empties this tab too", () => {
  replaceSession(storedSession([issue("a", 1)]));
  replaceSession(undefined);
  assert.equal(getSession().sessionId, null);
  assert.deepEqual(getSession().annotations, []);
});

test("unreadable stored issues are dropped", () => {
  replaceSession(storedSession([issue("a", 1), "junk", { id: "c" }]));
  assert.deepEqual(
    getSession().annotations.map(({ id }) => id),
    ["a"],
  );
});

test("only this tab's own writes are recognised as its own", () => {
  assert.equal(isOwnWrite(storedSession([])), false);
  assert.equal(isOwnWrite(undefined), false);
});
