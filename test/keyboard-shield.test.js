import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

import { OVERLAY_HOST_ID } from "../src/content/overlay-host.js";

const SHIELD_SOURCE = await readFile(
  new URL("../src/content/keyboard-shield.js", import.meta.url),
  "utf8",
);

const loadShield = ({ closedRootFocus = null } = {}) => {
  const listeners = [];
  const window = {
    addEventListener: (type, listener, capture) =>
      listeners.push({ type, listener, capture }),
  };
  const chrome = {
    dom: {
      openOrClosedShadowRoot: (host) =>
        host.id === OVERLAY_HOST_ID ? { activeElement: closedRootFocus } : null,
    },
  };
  vm.runInNewContext(SHIELD_SOURCE, { window, chrome });
  return listeners;
};

const textarea = { tagName: "TEXTAREA", isContentEditable: false };
const overlayHost = { tagName: "DIV", id: OVERLAY_HOST_ID };
const pageInput = { tagName: "INPUT", isContentEditable: false };
const pageBody = { tagName: "BODY", id: "" };

const dispatch = ({ listeners, type = "keydown", path, ...keys }) => {
  let stopped = false;
  const event = {
    type,
    key: "c",
    metaKey: false,
    ctrlKey: false,
    ...keys,
    composedPath: () => path,
    stopImmediatePropagation: () => {
      stopped = true;
    },
  };
  listeners
    .filter((entry) => entry.type === type)
    .forEach((entry) => entry.listener(event));
  return stopped;
};

const overlayPath = [textarea, overlayHost, pageBody];

test("the shield listens to every keyboard event in the capture phase", () => {
  const listeners = loadShield();
  assert.deepEqual(
    listeners.map(({ type, capture }) => [type, capture]),
    [
      ["keydown", true],
      ["keypress", true],
      ["keyup", true],
    ],
  );
});

test("a plain letter typed in the overlay never reaches the page", () => {
  const listeners = loadShield();
  ["keydown", "keypress", "keyup"].forEach((type) =>
    assert.equal(dispatch({ listeners, type, path: overlayPath }), true),
  );
  assert.equal(
    dispatch({ listeners, key: "C", shiftKey: true, path: overlayPath }),
    true,
  );
});

test("the overlay shortcuts pass through to the overlay handlers", () => {
  const listeners = loadShield();
  [
    { key: "Enter" },
    { key: "Escape" },
    { key: "Tab" },
    { key: "Enter", metaKey: true },
    { key: "Enter", metaKey: true, altKey: true },
    { key: "Enter", ctrlKey: true, shiftKey: true },
    { key: "c", metaKey: true },
  ].forEach((keys) =>
    assert.equal(dispatch({ listeners, path: overlayPath, ...keys }), false),
  );
});

test("keys typed outside the overlay are left to the page", () => {
  const listeners = loadShield();
  assert.equal(dispatch({ listeners, path: [pageInput, pageBody] }), false);
  assert.equal(dispatch({ listeners, path: [overlayHost, pageBody] }), false);
});

test("the shield recognises the host id the overlay actually uses", () => {
  const listeners = loadShield();
  const renamedHost = { tagName: "DIV", id: `${OVERLAY_HOST_ID}-other` };
  assert.equal(
    dispatch({ listeners, path: [textarea, renamedHost, pageBody] }),
    false,
  );
  assert.equal(dispatch({ listeners, path: overlayPath }), true);
});

test("a letter typed in the closed overlay root never reaches the page", () => {
  const listeners = loadShield({ closedRootFocus: textarea });
  assert.equal(dispatch({ listeners, path: [overlayHost, pageBody] }), true);
  assert.equal(
    dispatch({ listeners, key: "Enter", path: [overlayHost, pageBody] }),
    false,
  );
});

test("a key on a closed overlay button is left to the page", () => {
  const button = { tagName: "BUTTON", isContentEditable: false };
  const listeners = loadShield({ closedRootFocus: button });
  assert.equal(dispatch({ listeners, path: [overlayHost, pageBody] }), false);
});
