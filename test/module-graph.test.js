import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";

const CONTENT_DIRECTORY = new URL("../src/content/", import.meta.url);
const MODULES_WITH_SIDE_EFFECTS = new Set(["boot.js"]);

test("every content module resolves its imports", async () => {
  const modules = readdirSync(CONTENT_DIRECTORY).filter(
    (name) => name.endsWith(".js") && !MODULES_WITH_SIDE_EFFECTS.has(name),
  );
  assert.ok(modules.length > 0);
  for (const name of modules) {
    await assert.doesNotReject(
      import(new URL(name, CONTENT_DIRECTORY)),
      `${name} failed to load`,
    );
  }
});
