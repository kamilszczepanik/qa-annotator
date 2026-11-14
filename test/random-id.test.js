import test from "node:test";
import assert from "node:assert/strict";

import { randomId } from "../src/lib/random-id.js";

test("a random id is 32 hex characters", () => {
  assert.match(randomId(), /^[0-9a-f]{32}$/);
});

test("two random ids differ", () => {
  assert.notEqual(randomId(), randomId());
});
