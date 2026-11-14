import test from "node:test";
import assert from "node:assert/strict";

import {
  isAddAreaShortcut,
  isSaveShortcut,
} from "../src/content/comment-box.js";

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
