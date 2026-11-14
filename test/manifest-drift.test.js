import test from "node:test";
import assert from "node:assert/strict";

import { isExtensionAlive } from "../src/lib/extension-context.js";
import {
  exposesManifest,
  manifestDrifted,
} from "../src/lib/manifest-drift.js";

const manifest = (overrides = {}) => ({
  manifest_version: 3,
  name: "QA Annotator",
  version: "0.1.0",
  permissions: ["activeTab", "scripting"],
  web_accessible_resources: [
    { resources: ["manifest.json", "src/content/*.js"], matches: ["<all_urls>"] },
  ],
  ...overrides,
});

test("the same manifest on disk and in Chrome is not drift", () => {
  assert.equal(
    manifestDrifted({ onDisk: manifest(), loaded: manifest() }),
    false,
  );
});

test("key order does not count as drift", () => {
  const loaded = manifest();
  const onDisk = Object.fromEntries(Object.entries(manifest()).reverse());
  assert.equal(manifestDrifted({ onDisk, loaded }), false);
});

test("keys Chrome adds to the loaded manifest are not drift", () => {
  assert.equal(
    manifestDrifted({
      onDisk: manifest(),
      loaded: manifest({ key: "abc", current_locale: "en" }),
    }),
    false,
  );
});

test("a permission added on disk is drift", () => {
  assert.equal(
    manifestDrifted({
      onDisk: manifest({ permissions: ["activeTab", "scripting", "sidePanel"] }),
      loaded: manifest(),
    }),
    true,
  );
});

test("a key removed on disk is drift", () => {
  const loaded = manifest({ content_scripts: [{ js: ["shield.js"] }] });
  assert.equal(manifestDrifted({ onDisk: manifest(), loaded }), true);
});

test("a missing manifest is never reported as drift", () => {
  assert.equal(manifestDrifted({ onDisk: null, loaded: manifest() }), false);
});

test("a loaded manifest that hides manifest.json predates the drift check", () => {
  assert.equal(exposesManifest(manifest()), true);
  assert.equal(
    exposesManifest(
      manifest({
        web_accessible_resources: [{ resources: ["src/content/*.js"] }],
      }),
    ),
    false,
  );
  assert.equal(exposesManifest({}), false);
});

test("a content script whose extension was reloaded is orphaned", () => {
  assert.equal(isExtensionAlive({ runtime: { id: "abc" } }), true);
  assert.equal(isExtensionAlive({ runtime: {} }), false);
  assert.equal(isExtensionAlive(undefined), false);
});
