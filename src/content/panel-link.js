import {
  acceptsPanelPort,
  isPanelCommand,
} from "../lib/panel-protocol.js";

let port = null;
let link = null;

export const isPanelLinked = () => port !== null;

export const sendToPanel = (message) => port?.postMessage(message);

export const pushPanelState = () => {
  if (!port || !link) return;
  port.postMessage({ type: "state", ...link.snapshot() });
};

const handleConnect = (candidate) => {
  if (!link) return;
  if (!acceptsPanelPort({ port: candidate, extensionId: chrome.runtime.id })) {
    return;
  }
  port?.disconnect();
  port = candidate;
  candidate.onMessage.addListener((message) => {
    if (port === candidate && isPanelCommand(message)) {
      link?.onCommand(message);
    }
  });
  candidate.onDisconnect.addListener(() => {
    if (port !== candidate) return;
    port = null;
    link?.onUnlinked();
  });
  link.onLinked();
  pushPanelState();
};

export const openPanelLink = ({ snapshot, onCommand, onLinked, onUnlinked }) => {
  link = { snapshot, onCommand, onLinked, onUnlinked };
  chrome.runtime.onConnect.addListener(handleConnect);
  chrome.runtime.sendMessage({ type: "QA_MOUNTED" }).catch(() => {});
};

export const closePanelLink = () => {
  link = null;
  if (globalThis.chrome?.runtime?.onConnect) {
    chrome.runtime.onConnect.removeListener(handleConnect);
  }
  const linked = port;
  port = null;
  linked?.disconnect();
};
