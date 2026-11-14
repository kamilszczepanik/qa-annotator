import test from "node:test";
import assert from "node:assert/strict";

import { withAreas } from "../src/content/session-store.js";

const flatAnnotation = (overrides) => ({
  id: "ann-1",
  index: 1,
  kind: "element",
  comment: "Save button is too small to tap on mobile",
  pageUrl: "http://localhost:3000/dashboard",
  pageTitle: "Reviews · Example Shop",
  viewport: { width: 390, height: 844, dpr: 3 },
  selector: "main > button.btn-primary",
  elementTag: '<button class="btn-primary">',
  text: "Save",
  rect: { x: 24, y: 612, width: 88, height: 32 },
  screenshotFilename: null,
  capturedAt: "2026-09-07T14:35:00.000Z",
  ...overrides,
});

const ONE_AREA = [
  {
    kind: "element",
    comment: "Save button is too small to tap on mobile",
    selector: "main > button.btn-primary",
    elementTag: '<button class="btn-primary">',
    text: "Save",
    rect: { x: 24, y: 612, width: 88, height: 32 },
  },
];

test("an old flat annotation becomes a one-area annotation", () => {
  const upgraded = withAreas(flatAnnotation({}));
  assert.deepEqual(upgraded.areas, ONE_AREA);
  assert.equal(upgraded.id, "ann-1");
  assert.equal(upgraded.pageUrl, "http://localhost:3000/dashboard");
  assert.equal(upgraded.comment, undefined);
  assert.equal(upgraded.rect, undefined);
});

test("an annotation that already carries areas passes through untouched", () => {
  const stored = {
    id: "ann-2",
    index: 2,
    pageUrl: "http://localhost:3000/settings",
    areas: [
      {
        kind: "region",
        comment: "Move it here",
        selector: null,
        elementTag: null,
        text: null,
        rect: { x: 0, y: 0, width: 10, height: 10 },
      },
    ],
  };
  assert.deepEqual(withAreas(stored), stored);
});

test("an empty or non-array areas field is rebuilt from the flat shape", () => {
  assert.deepEqual(withAreas(flatAnnotation({ areas: [] })).areas, ONE_AREA);
  assert.deepEqual(withAreas(flatAnnotation({ areas: null })).areas, ONE_AREA);
});
