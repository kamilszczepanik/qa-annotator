import test from "node:test";
import assert from "node:assert/strict";

import { annotationsOnOrigin } from "../src/lib/page-origin.js";

test("only annotations from the current origin are kept", () => {
  const annotations = [
    { id: "a", pageUrl: "https://shop.example.com/cart" },
    { id: "b", pageUrl: "https://other.example.org/" },
    { id: "c", pageUrl: "https://shop.example.com/checkout?step=2" },
    { id: "d", pageUrl: "http://shop.example.com/cart" },
    { id: "e", pageUrl: "not a url" },
  ];
  assert.deepEqual(
    annotationsOnOrigin({
      annotations,
      origin: "https://shop.example.com",
    }).map(({ id }) => id),
    ["a", "c"],
  );
});
