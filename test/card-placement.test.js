import test from "node:test";
import assert from "node:assert/strict";

import { placeCard } from "../src/lib/geometry.js";

const viewport = { width: 1440, height: 900 };
const size = { width: 440, height: 260 };

const place = (anchor, overrides = {}) =>
  placeCard({ anchor, size, viewport, gap: 12, margin: 12, ...overrides });

test("the card opens to the right of a small element, aligned with its top", () => {
  assert.deepEqual(place({ x: 200, y: 300, width: 120, height: 40 }), {
    side: "right",
    left: 332,
    top: 300,
  });
});

test("the card goes below an element too wide to sit beside", () => {
  assert.deepEqual(place({ x: 40, y: 80, width: 1360, height: 64 }), {
    side: "below",
    left: 40,
    top: 156,
  });
});

test("the card goes left of an element at the right edge", () => {
  assert.deepEqual(place({ x: 1100, y: 100, width: 300, height: 700 }), {
    side: "left",
    left: 648,
    top: 100,
  });
});

test("the card goes above a wide element at the bottom of the viewport", () => {
  assert.deepEqual(place({ x: 40, y: 700, width: 1360, height: 150 }), {
    side: "above",
    left: 40,
    top: 428,
  });
});

test("the card stays inside the viewport when the element fills it", () => {
  assert.deepEqual(place({ x: 0, y: 0, width: 1440, height: 900 }), {
    side: "inside",
    left: 988,
    top: 12,
  });
});

test("a card beside an element low on the page is pulled up into view", () => {
  const placed = place({ x: 200, y: 820, width: 100, height: 40 });
  assert.equal(placed.side, "right");
  assert.equal(placed.top, 900 - 12 - 260);
});

test("a card beside an element scrolled above the viewport stays in view", () => {
  const placed = place({ x: 200, y: -300, width: 100, height: 340 });
  assert.equal(placed.side, "right");
  assert.equal(placed.top, 12);
});

test("on a narrow viewport the card never starts left of the margin", () => {
  const placed = placeCard({
    anchor: { x: 0, y: 0, width: 390, height: 844 },
    size: { width: 366, height: 300 },
    viewport: { width: 390, height: 844 },
  });
  assert.equal(placed.left, 12);
  assert.equal(placed.top, 12);
});

test("the card skips a side that would cover another area of the issue", () => {
  const anchor = { x: 900, y: 260, width: 320, height: 38 };
  const areaOne = { x: 1148, y: 318, width: 72, height: 24 };
  assert.equal(place(anchor).side, "below");
  assert.deepEqual(place(anchor, { avoid: [areaOne] }), {
    side: "left",
    left: 448,
    top: 260,
  });
});

test("when every side covers an area the card still takes the first that fits", () => {
  const anchor = { x: 200, y: 300, width: 120, height: 40 };
  const everywhere = { x: 0, y: 0, width: 1440, height: 900 };
  assert.equal(place(anchor, { avoid: [everywhere] }).side, "right");
});
