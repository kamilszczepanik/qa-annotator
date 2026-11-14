import test from "node:test";
import assert from "node:assert/strict";

import { editedAreas } from "../src/lib/issue-edit.js";
import {
  acceptsPanelPort,
  isPanelCommand,
  PANEL_PAGE_PATH,
  PANEL_PORT_NAME,
} from "../src/lib/panel-protocol.js";
import { isMacPlatform, shortcutLabels } from "../src/lib/shortcut-labels.js";

const EXTENSION_ID = "qa-annotator-id";

const panelPort = ({
  name = PANEL_PORT_NAME,
  id = EXTENSION_ID,
  tab,
  url = `chrome-extension://${EXTENSION_ID}/${PANEL_PAGE_PATH}`,
} = {}) => ({ name, sender: { id, tab, url } });

test("the content script accepts its own side panel", () => {
  assert.equal(
    acceptsPanelPort({ port: panelPort(), extensionId: EXTENSION_ID }),
    true,
  );
});

test("the content script refuses ports that are not the side panel", () => {
  [
    panelPort({ name: "other" }),
    panelPort({ id: "other-extension" }),
    panelPort({ tab: { id: 3 } }),
    panelPort({ url: `chrome-extension://${EXTENSION_ID}/src/other.html` }),
    panelPort({ url: "https://example.com/src/panel/panel.html" }),
  ].forEach((port) =>
    assert.equal(acceptsPanelPort({ port, extensionId: EXTENSION_ID }), false),
  );
  assert.equal(acceptsPanelPort({ port: panelPort(), extensionId: "" }), false);
});

test("panel commands carry the fields they need", () => {
  assert.equal(isPanelCommand({ type: "save", comment: "Too small" }), true);
  assert.equal(isPanelCommand({ type: "cancel" }), true);
  assert.equal(
    isPanelCommand({ type: "edit", id: "a1", comments: ["One", "Two"] }),
    true,
  );
  assert.equal(isPanelCommand({ type: "save" }), false);
  assert.equal(isPanelCommand({ type: "edit", id: "a1", comments: [1] }), false);
  assert.equal(isPanelCommand({ type: "delete", id: 4 }), false);
  assert.equal(isPanelCommand({ type: "toString" }), false);
  assert.equal(isPanelCommand(null), false);
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
