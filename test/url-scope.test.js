import test from "node:test";
import assert from "node:assert/strict";

import { scopeUrl } from "../src/lib/url-scope.js";

test("a web URL keeps only its origin and path", () => {
  assert.equal(
    scopeUrl({
      value: "https://user:secret@shop.example.com:8443/reset/step?token=abc#done",
    }),
    "https://shop.example.com:8443/reset/step",
  );
});

test("a relative href resolves against the page", () => {
  assert.equal(
    scopeUrl({
      value: "../orders?id=7",
      baseUrl: "https://shop.example.com/account/settings",
    }),
    "https://shop.example.com/orders",
  );
});

test("non-web schemes and unparsable values are dropped", () => {
  [
    "javascript:alert(1)",
    "data:text/html,<script>x</script>",
    "mailto:someone@example.com",
    "file:///etc/passwd",
    "not a url",
  ].forEach((value) => assert.equal(scopeUrl({ value }), null));
});
