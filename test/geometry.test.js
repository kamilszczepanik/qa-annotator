import test from "node:test";
import assert from "node:assert/strict";

import { isRectOffscreen, offscreenAreaNumbers } from "../src/lib/geometry.js";

const viewport = { width: 1200, height: 800 };

const rect = (overrides) => ({
  x: 100,
  y: 100,
  width: 200,
  height: 80,
  ...overrides,
});

test("a rect fully inside the viewport is on screen", () => {
  assert.equal(isRectOffscreen({ rect: rect({}), viewport }), false);
});

test("a rect scrolled entirely above the viewport is off screen", () => {
  assert.equal(isRectOffscreen({ rect: rect({ y: -80 }), viewport }), true);
});

test("a rect entirely below the viewport is off screen", () => {
  assert.equal(isRectOffscreen({ rect: rect({ y: 800 }), viewport }), true);
});

test("a rect entirely left or right of the viewport is off screen", () => {
  assert.equal(isRectOffscreen({ rect: rect({ x: -200 }), viewport }), true);
  assert.equal(isRectOffscreen({ rect: rect({ x: 1200 }), viewport }), true);
});

test("a rect straddling the top edge is still on screen", () => {
  assert.equal(isRectOffscreen({ rect: rect({ y: -79 }), viewport }), false);
  assert.equal(isRectOffscreen({ rect: rect({ y: 799 }), viewport }), false);
});

test("offscreen area numbers are 1-based and empty when everything is visible", () => {
  assert.deepEqual(
    offscreenAreaNumbers({
      rects: [rect({}), rect({ y: -80 }), rect({}), rect({ x: 1200 })],
      viewport,
    }),
    [2, 4],
  );
  assert.deepEqual(
    offscreenAreaNumbers({ rects: [rect({}), rect({ y: 700 })], viewport }),
    [],
  );
});
