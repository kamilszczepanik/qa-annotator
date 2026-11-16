import { framePortName } from "../lib/frame-protocol.js";
import { shortcutLabels } from "../lib/shortcut-labels.js";

export const labels = shortcutLabels(
  navigator.userAgentData?.platform ?? navigator.platform,
);

export const fillShortcutLabels = () =>
  document.querySelectorAll("[data-key]").forEach((key) => {
    key.textContent = labels[key.dataset.key];
  });

export const openFramePort = ({ onMessage }) => {
  const name = framePortName(window.location.hash.slice(1));
  let port = null;

  const connect = async () => {
    const tab = await chrome.tabs.getCurrent();
    if (typeof tab?.id !== "number") {
      console.error("QA Annotator: this frame is not inside a tab.");
      return;
    }
    const candidate = chrome.tabs.connect(tab.id, { frameId: 0, name });
    port = candidate;
    candidate.onMessage.addListener(onMessage);
    candidate.onDisconnect.addListener(() => {
      void chrome.runtime.lastError;
      if (port === candidate) port = null;
    });
  };
  void connect();

  return { send: (message) => port?.postMessage(message) };
};

export const reportSize = ({ element, send }) => {
  let lastHeight = -1;
  const report = (force) => {
    const height = Math.ceil(element.getBoundingClientRect().height);
    if (!force && height === lastHeight) return;
    lastHeight = height;
    send({ type: "size", height });
  };
  new ResizeObserver(() => report(false)).observe(element);
  return () => report(true);
};

export const copyPrompt = async ({ prompt, send }) => {
  try {
    await navigator.clipboard.writeText(prompt);
    send({ type: "copied" });
  } catch {
    send({ type: "copy", prompt });
  }
};
