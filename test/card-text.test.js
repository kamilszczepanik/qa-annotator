import test from "node:test";
import assert from "node:assert/strict";

import {
  cardHint,
  cardTitle,
  commentPlaceholder,
} from "../src/lib/card-text.js";

const current = (number) => ({ id: "p", number, label: "button" });

test("a single pick is a new issue asking what is wrong here", () => {
  const draft = { areas: [], current: current(1) };
  assert.equal(cardTitle(draft), "New issue");
  assert.equal(commentPlaceholder(draft.current), "What is wrong here?");
  assert.equal(cardHint(draft), "");
});

test("the second area of an issue is named by its number", () => {
  const draft = { areas: [{ comment: "Move this" }], current: current(2) };
  assert.equal(cardTitle(draft), "Area 2 of this issue");
  assert.equal(commentPlaceholder(draft.current), "What is wrong in area 2?");
});

test("banked areas without a pick ask for the next area", () => {
  const draft = { areas: [{ comment: "Move this" }], current: null };
  assert.equal(cardTitle(draft), "Issue with 1 area");
  assert.equal(
    cardHint(draft),
    "Click or drag area 2 on the page, or save the issue with 1 area.",
  );
  assert.equal(
    cardTitle({ areas: [{}, {}], current: null }),
    "Issue with 2 areas",
  );
});

test("no draft reads as a new issue", () => {
  assert.equal(cardTitle(null), "New issue");
  assert.equal(cardHint(null), "");
});
