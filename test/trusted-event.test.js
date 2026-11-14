import test from "node:test";
import assert from "node:assert/strict";

import { whenTrusted } from "../src/lib/trusted-event.js";

test("a trusted event reaches the handler", () => {
  const seen = [];
  whenTrusted((event) => seen.push(event))({ isTrusted: true, key: "Enter" });
  assert.deepEqual(seen, [{ isTrusted: true, key: "Enter" }]);
});

test("a synthetic or missing event is ignored", () => {
  const seen = [];
  const handler = whenTrusted((event) => seen.push(event));
  handler({ isTrusted: false });
  handler({});
  handler(undefined);
  assert.deepEqual(seen, []);
});
