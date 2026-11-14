import test from "node:test";
import assert from "node:assert/strict";

import { buildSelector } from "../src/lib/selector.js";

const descriptor = (overrides) => ({
  tagName: "div",
  id: null,
  classList: [],
  testId: null,
  parent: null,
  siblingIndex: null,
  ...overrides,
});

const nestedDivs = (depth) =>
  Array.from({ length: depth }).reduce(
    (parent) => descriptor({ tagName: "div", parent }),
    null,
  );

const cases = [
  {
    name: "an id anchors the path and stops the walk",
    node: descriptor({
      tagName: "button",
      id: "save",
      classList: ["btn"],
      siblingIndex: 2,
      parent: descriptor({ tagName: "main" }),
    }),
    expected: "#save",
  },
  {
    name: "a data-testid anchors the path and stops the walk",
    node: descriptor({
      tagName: "button",
      classList: ["btn"],
      testId: "save-reply",
      siblingIndex: 2,
      parent: descriptor({ tagName: "main" }),
    }),
    expected: '[data-testid="save-reply"]',
  },
  {
    name: "a stable class joins the tag",
    node: descriptor({ tagName: "button", classList: ["btn-primary"] }),
    expected: "button.btn-primary",
  },
  {
    name: "generated classes fall back to the bare tag",
    node: descriptor({
      tagName: "span",
      classList: ["css-1x2y3z", "sc-abc123", "_hash", "jsx-991", "a1b2c3d4"],
    }),
    expected: "span",
  },
  {
    name: "tailwind arbitrary and variant classes are rejected as unstable",
    node: descriptor({
      tagName: "a",
      classList: ["w-[32px]", "hover:bg-x", "aspect-1/2", "card-link"],
    }),
    expected: "a.card-link",
  },
  {
    name: "a sibling index produces nth-of-type",
    node: descriptor({
      tagName: "div",
      classList: ["review-card"],
      siblingIndex: 2,
    }),
    expected: "div.review-card:nth-of-type(2)",
  },
  {
    name: "ancestors join with a child combinator and stop at an anchored ancestor",
    node: descriptor({
      tagName: "button",
      classList: ["btn-primary"],
      parent: descriptor({
        tagName: "div",
        classList: ["review-card"],
        siblingIndex: 2,
        parent: descriptor({
          tagName: "main",
          id: "app",
          parent: descriptor({ tagName: "body" }),
        }),
      }),
    }),
    expected: "#app > div.review-card:nth-of-type(2) > button.btn-primary",
  },
  {
    name: "body returns its bare tag",
    node: descriptor({
      tagName: "body",
      classList: ["page"],
      siblingIndex: 1,
      parent: descriptor({ tagName: "html" }),
    }),
    expected: "body",
  },
  {
    name: "a chain deeper than eight levels is capped to the nearest eight",
    node: nestedDivs(12),
    expected: Array.from({ length: 8 }, () => "div").join(" > "),
  },
];

cases.forEach(({ name, node, expected }) => {
  test(name, () => {
    assert.equal(buildSelector(node), expected);
  });
});
