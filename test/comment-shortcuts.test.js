import test from "node:test";
import assert from "node:assert/strict";

import {
  commentShortcutOf,
  isAddAreaShortcut,
  isFinishShortcut,
  isSaveShortcut,
} from "../src/lib/comment-shortcuts.js";

test("the save chord does not match a chord carrying Option", () => {
  assert.equal(
    isSaveShortcut({ key: "Enter", metaKey: true, altKey: true }),
    false,
  );
  assert.equal(isSaveShortcut({ key: "Enter", metaKey: true }), true);
});

test("the add area chord does not match a chord carrying Shift", () => {
  assert.equal(
    isAddAreaShortcut({
      key: "Enter",
      metaKey: true,
      altKey: true,
      shiftKey: true,
    }),
    false,
  );
  assert.equal(
    isAddAreaShortcut({ key: "Enter", metaKey: true, altKey: true }),
    true,
  );
});

test("the finish chord needs Shift and Cmd or Ctrl", () => {
  assert.equal(
    isFinishShortcut({ key: "Enter", metaKey: true, shiftKey: true }),
    true,
  );
  assert.equal(
    isFinishShortcut({ key: "Enter", ctrlKey: true, shiftKey: true }),
    true,
  );
  assert.equal(isFinishShortcut({ key: "Enter", shiftKey: true }), false);
});

test("the comment field names every overlay shortcut", () => {
  assert.equal(commentShortcutOf({ key: "Enter", metaKey: true }), "save");
  assert.equal(commentShortcutOf({ key: "Enter", ctrlKey: true }), "save");
  assert.equal(
    commentShortcutOf({ key: "Enter", metaKey: true, altKey: true }),
    "addArea",
  );
  assert.equal(
    commentShortcutOf({ key: "Enter", metaKey: true, shiftKey: true }),
    "finish",
  );
  assert.equal(commentShortcutOf({ key: "Escape" }), "cancel");
});

test("typing in the comment field is not a shortcut", () => {
  [
    { key: "t" },
    { key: "o" },
    { key: "i" },
    { key: "Enter" },
    { key: "Enter", shiftKey: true },
    { key: "Tab" },
    { key: "c", metaKey: true },
  ].forEach((keys) => assert.equal(commentShortcutOf(keys), null));
});
