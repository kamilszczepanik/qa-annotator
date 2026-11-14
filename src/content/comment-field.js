import { commentFieldPortName } from "../lib/comment-field-channel.js";
import { randomId } from "../lib/random-id.js";

const FRAME_PATH = "src/frame/comment-field.html";
const SHORTCUTS = new Set(["save", "addArea", "finish", "cancel"]);

export const createCommentField = ({
  label,
  placeholder,
  onInput,
  onShortcut,
}) => {
  const nonce = randomId();
  const frame = document.createElement("iframe");
  frame.className = "qa-comment-input";
  frame.title = label;
  frame.src = `${chrome.runtime.getURL(FRAME_PATH)}#${nonce}`;

  let port = null;
  let value = "";
  const queued = [];

  const send = (message) => {
    if (port) port.postMessage(message);
    else queued.push(message);
  };

  const handleMessage = (message) => {
    if (message?.type === "input" && typeof message.value === "string") {
      value = message.value;
      onInput(value);
      return;
    }
    if (message?.type === "shortcut" && SHORTCUTS.has(message.shortcut)) {
      onShortcut(message.shortcut);
    }
  };

  frame.addEventListener(
    "load",
    () => {
      port = chrome.runtime.connect({ name: commentFieldPortName(nonce) });
      port.onMessage.addListener(handleMessage);
      queued.splice(0).forEach((message) => port.postMessage(message));
    },
    { once: true },
  );

  send({ type: "setup", label, placeholder });

  return {
    element: frame,
    value: () => value,
    focus: () => {
      frame.focus();
      send({ type: "focus" });
    },
    setInvalid: (invalid) => send({ type: "invalid", invalid }),
    dispose: () => port?.disconnect(),
  };
};
