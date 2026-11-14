import test from "node:test";
import assert from "node:assert/strict";

import {
  bankArea,
  draftAreaCount,
  endDraft,
  hasWarnedOffscreen,
  markOffscreenWarned,
} from "../src/content/draft-issue.js";

globalThis.window = { location: { href: "http://localhost:3000/dashboard" } };

const elementPick = () => ({ kind: "element", element: {} });

test("banking two element picks counts both", () => {
  bankArea({ pick: elementPick(), comment: "Move this button" });
  assert.equal(draftAreaCount(), 1);
  bankArea({ pick: elementPick(), comment: "Drop it here" });
  assert.equal(draftAreaCount(), 2);
  endDraft();
});

test("ending a draft reports whether anything was banked", () => {
  bankArea({ pick: elementPick(), comment: "Move this button" });
  assert.equal(endDraft(), true);
  assert.equal(endDraft(), false);
  assert.equal(draftAreaCount(), 0);
});

test("ending a draft clears the off screen warning", () => {
  bankArea({ pick: elementPick(), comment: "Move this button" });
  markOffscreenWarned();
  assert.equal(hasWarnedOffscreen(), true);
  endDraft();
  assert.equal(hasWarnedOffscreen(), false);
});
