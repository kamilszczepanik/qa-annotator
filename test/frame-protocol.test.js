import test from "node:test";
import assert from "node:assert/strict";

import { editedAreas } from "../src/lib/issue-edit.js";
import {
  frameNonceOf,
  framePortName,
  isFrameCommand,
} from "../src/lib/frame-protocol.js";
import { isMacPlatform, shortcutLabels } from "../src/lib/shortcut-labels.js";

const EXTENSION_ID = "qa-annotator-id";
const NONCE = "n0nce";

const framePort = ({ name = framePortName(NONCE), id = EXTENSION_ID } = {}) => ({
  name,
  sender: { id },
});

test("the content script reads the nonce of its own frame's port", () => {
  assert.equal(
    frameNonceOf({ port: framePort(), extensionId: EXTENSION_ID }),
    NONCE,
  );
});

test("the content script ignores ports that are not its frames", () => {
  [
    framePort({ name: "qa-annotator-frame:" }),
    framePort({ name: "other:n0nce" }),
    framePort({ name: null }),
    framePort({ id: "other-extension" }),
    null,
  ].forEach((port) =>
    assert.equal(frameNonceOf({ port, extensionId: EXTENSION_ID }), null),
  );
  assert.equal(frameNonceOf({ port: framePort(), extensionId: "" }), null);
});

test("frame commands carry the fields they need", () => {
  assert.equal(isFrameCommand({ type: "save", comment: "Too small" }), true);
  assert.equal(isFrameCommand({ type: "cancel" }), true);
  assert.equal(isFrameCommand({ type: "size", height: 212 }), true);
  assert.equal(
    isFrameCommand({ type: "edit", id: "a1", comments: ["One", "Two"] }),
    true,
  );
  assert.equal(isFrameCommand({ type: "save" }), false);
  assert.equal(isFrameCommand({ type: "size", height: -1 }), false);
  assert.equal(isFrameCommand({ type: "size", height: Infinity }), false);
  assert.equal(isFrameCommand({ type: "edit", id: "a1", comments: [1] }), false);
  assert.equal(isFrameCommand({ type: "delete", id: 4 }), false);
  assert.equal(isFrameCommand({ type: "toString" }), false);
  assert.equal(isFrameCommand(null), false);
});

test("an edit keeps every area and trims its comment", () => {
  const areas = [
    { kind: "element", comment: "Old", selector: "#a" },
    { kind: "region", comment: "Old too", selector: null },
  ];
  assert.deepEqual(editedAreas({ areas, comments: [" New ", "Newer"] }), [
    { kind: "element", comment: "New", selector: "#a" },
    { kind: "region", comment: "Newer", selector: null },
  ]);
});

test("an edit that empties an area or drops one is refused", () => {
  const areas = [{ comment: "One" }, { comment: "Two" }];
  assert.equal(editedAreas({ areas, comments: ["One", "  "] }), null);
  assert.equal(editedAreas({ areas, comments: ["One"] }), null);
  assert.equal(editedAreas({ areas: undefined, comments: ["One"] }), null);
});

test("shortcut labels follow the platform", () => {
  assert.equal(isMacPlatform("macOS"), true);
  assert.equal(isMacPlatform("MacIntel"), true);
  assert.equal(isMacPlatform("Windows"), false);
  assert.equal(shortcutLabels("macOS").save, "⌘↵");
  assert.equal(shortcutLabels("Linux x86_64").finish, "Ctrl+Shift+Enter");
});
