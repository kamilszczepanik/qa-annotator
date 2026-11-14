import { acceptsCommentFieldPort } from "../lib/comment-field-channel.js";
import { commentShortcutOf } from "../lib/comment-shortcuts.js";

const textarea = document.querySelector(".qa-comment-field");
const nonce = window.location.hash.slice(1);
let port = null;

const send = (message) => port?.postMessage(message);

const messageHandlers = {
  setup: ({ label, placeholder }) => {
    textarea.placeholder = String(placeholder ?? "");
    textarea.setAttribute("aria-label", String(label ?? ""));
    document.title = String(label ?? "");
  },
  focus: () => textarea.focus(),
  invalid: ({ invalid }) =>
    invalid
      ? textarea.setAttribute("aria-invalid", "true")
      : textarea.removeAttribute("aria-invalid"),
};

const handleMessage = (message) => messageHandlers[message?.type]?.(message);

chrome.runtime.onConnect.addListener((candidate) => {
  if (port) return;
  if (
    !acceptsCommentFieldPort({
      port: candidate,
      nonce,
      extensionId: chrome.runtime.id,
    })
  ) {
    return;
  }
  port = candidate;
  port.onMessage.addListener(handleMessage);
  port.onDisconnect.addListener(() => {
    port = null;
    textarea.value = "";
  });
});

textarea.addEventListener("input", () =>
  send({ type: "input", value: textarea.value }),
);

textarea.addEventListener("keydown", (event) => {
  if (!event.isTrusted) return;
  const shortcut = commentShortcutOf(event);
  if (!shortcut) return;
  event.preventDefault();
  send({ type: "shortcut", shortcut });
});
