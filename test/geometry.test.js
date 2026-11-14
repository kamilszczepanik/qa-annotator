import test from "node:test";
import assert from "node:assert/strict";

import {
  cropBox,
  isRectOffscreen,
  offscreenAreaNumbers,
} from "../src/lib/geometry.js";

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

test("a thumbnail crop pads the area and scales it to device pixels", () => {
  assert.deepEqual(
    cropBox({
      rect: rect({}),
      padding: 20,
      scale: 2,
      imageWidth: 2400,
      imageHeight: 1600,
    }),
    { x: 160, y: 160, width: 480, height: 240 },
  );
});

test("a thumbnail crop slides back inside the screenshot", () => {
  assert.deepEqual(
    cropBox({
      rect: rect({ x: -50, y: 760, width: 100, height: 100 }),
      padding: 20,
      scale: 1,
      imageWidth: 1200,
      imageHeight: 800,
    }),
    { x: 0, y: 660, width: 140, height: 140 },
  );
});

test("a thumbnail crop of a small element keeps some of the page around it", () => {
  assert.deepEqual(
    cropBox({
      rect: rect({ x: 500, y: 400, width: 20, height: 20 }),
      padding: 20,
      minSize: { width: 320, height: 180 },
      scale: 2,
      imageWidth: 2400,
      imageHeight: 1600,
    }),
    { x: 700, y: 640, width: 640, height: 360 },
  );
});

test("a thumbnail crop is never larger than the screenshot", () => {
  assert.deepEqual(
    cropBox({
      rect: rect({ x: 0, y: 0, width: 1200, height: 800 }),
      padding: 20,
      scale: 1,
      imageWidth: 1200,
      imageHeight: 800,
    }),
    { x: 0, y: 0, width: 1200, height: 800 },
  );
});

test("a thumbnail crop grows its short side to the requested aspect ratio", () => {
  assert.deepEqual(
    cropBox({
      rect: rect({ x: 100, y: 300, width: 600, height: 40 }),
      padding: 20,
      aspectRatio: 16 / 9,
      scale: 1,
      imageWidth: 1200,
      imageHeight: 800,
    }),
    { x: 80, y: 140, width: 640, height: 360 },
  );
  assert.deepEqual(
    cropBox({
      rect: rect({ x: 500, y: 100, width: 40, height: 320 }),
      padding: 20,
      aspectRatio: 16 / 9,
      scale: 1,
      imageWidth: 1200,
      imageHeight: 800,
    }),
    { x: 200, y: 80, width: 640, height: 360 },
  );
});
