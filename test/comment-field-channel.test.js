import test from "node:test";
import assert from "node:assert/strict";

import {
  acceptsCommentFieldPort,
  commentFieldPortName,
} from "../src/lib/comment-field-channel.js";

const EXTENSION_ID = "qa-annotator-id";
const NONCE = "5d1f6c1e-8f3e-4f39-9a55-3c1f0e6c1b2a";

const portFrom = ({
  name = commentFieldPortName(NONCE),
  id = EXTENSION_ID,
  tab = { id: 7 },
} = {}) => ({
  name,
  sender: { id, tab },
});

test("the field accepts the content script that opened it", () => {
  assert.equal(
    acceptsCommentFieldPort({
      port: portFrom(),
      nonce: NONCE,
      extensionId: EXTENSION_ID,
    }),
    true,
  );
});

test("the field ignores ports for another field", () => {
  assert.equal(
    acceptsCommentFieldPort({
      port: portFrom({ name: commentFieldPortName("other-nonce") }),
      nonce: NONCE,
      extensionId: EXTENSION_ID,
    }),
    false,
  );
});

test("the field ignores ports from another extension or outside a tab", () => {
  assert.equal(
    acceptsCommentFieldPort({
      port: portFrom({ id: "other-extension" }),
      nonce: NONCE,
      extensionId: EXTENSION_ID,
    }),
    false,
  );
  assert.equal(
    acceptsCommentFieldPort({
      port: portFrom({ tab: null }),
      nonce: NONCE,
      extensionId: EXTENSION_ID,
    }),
    false,
  );
});

test("a field without a nonce accepts nothing", () => {
  assert.equal(
    acceptsCommentFieldPort({
      port: portFrom({ name: commentFieldPortName("") }),
      nonce: "",
      extensionId: EXTENSION_ID,
    }),
    false,
  );
});
