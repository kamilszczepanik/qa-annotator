import test from "node:test";
import assert from "node:assert/strict";

import { pickLabel } from "../src/lib/pick-label.js";

const element = (overrides) => ({
  kind: "element",
  tagName: "BUTTON",
  id: "",
  classList: [],
  ...overrides,
});

test("an element is named by its tag and id", () => {
  assert.equal(pickLabel(element({ id: "save", classList: ["btn"] })), "button#save");
});

test("an element without an id is named by its first usable class", () => {
  assert.equal(
    pickLabel(element({ classList: ["md:px-2", "btn-primary"] })),
    "button.btn-primary",
  );
});

test("an element with no usable id or class is named by its tag", () => {
  assert.equal(pickLabel(element({ id: "1st" })), "button");
});

test("a dragged area is named by its size", () => {
  assert.equal(
    pickLabel({ kind: "region", rect: { width: 320.4, height: 119.6 } }),
    "Area 320 × 120 px",
  );
});

test("a long or invisible-character name is cleaned and capped", () => {
  const label = pickLabel(element({ id: `a​${"x".repeat(80)}` }));
  assert.ok(!label.includes("​"));
  assert.ok(label.length <= 49);
});
