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

const LOCAL_URL_PATH = "/checkout/step?cart=42&debug=1#summary";

test("a loopback or dev host keeps its query string and fragment", () => {
  [
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.1.1",
    "http://[::1]:8080",
    "http://shop.localhost",
    "https://printer.local",
  ].forEach((origin) =>
    assert.equal(
      scopeUrl({ value: `${origin}${LOCAL_URL_PATH}` }),
      `${origin}${LOCAL_URL_PATH}`,
    ),
  );
});

test("a private network address is reduced to origin and path", () => {
  [
    "http://10.0.0.12:3000",
    "http://192.168.1.20",
    "http://172.16.0.5",
    "http://172.31.255.254",
  ].forEach((origin) =>
    assert.equal(
      scopeUrl({ value: `${origin}${LOCAL_URL_PATH}` }),
      `${origin}/checkout/step`,
    ),
  );
});

test("a dev host still drops credentials", () => {
  assert.equal(
    scopeUrl({ value: `http://admin:secret@localhost:3000${LOCAL_URL_PATH}` }),
    `http://localhost:3000${LOCAL_URL_PATH}`,
  );
});

test("a dev host drops every sensitive query parameter", () => {
  [
    "token",
    "access_token",
    "code",
    "session_id",
    "apiKey",
    "auth",
    "password",
    "passwd",
    "client_secret",
    "reset",
    "sig",
    "X-Amz-Signature",
    "jwt",
    "OTP",
  ].forEach((name) =>
    assert.equal(
      scopeUrl({ value: `http://localhost:3000/a?cart=42&${name}=abc&debug=1` }),
      "http://localhost:3000/a?cart=42&debug=1",
    ),
  );
});

test("a dev host with only sensitive parameters keeps no query", () => {
  assert.equal(
    scopeUrl({ value: "http://localhost:3000/reset?Token=abc&SESSION=x" }),
    "http://localhost:3000/reset",
  );
});

test("a dev host drops a fragment that carries a token", () => {
  [
    "#access_token=abc&token_type=bearer",
    "#state=1&id_token=eyJ",
    "#ID_TOKEN=eyJ",
  ].forEach((hash) =>
    assert.equal(
      scopeUrl({ value: `http://localhost:3000/callback?cart=42${hash}` }),
      "http://localhost:3000/callback?cart=42",
    ),
  );
});

test("a relative href on a dev host keeps its query string", () => {
  assert.equal(
    scopeUrl({
      value: "../orders?id=7#latest",
      baseUrl: "http://localhost:3000/account/settings",
    }),
    "http://localhost:3000/orders?id=7#latest",
  );
});

test("hosts that only look local stay reduced to origin and path", () => {
  [
    "https://localhost.example.com",
    "https://example.local.com",
    "https://127.0.0.1.example.com",
    "http://11.0.0.1",
    "http://[2001:db8::1]",
  ].forEach((origin) =>
    assert.equal(
      scopeUrl({ value: `${origin}${LOCAL_URL_PATH}` }),
      `${origin}/checkout/step`,
    ),
  );
});
