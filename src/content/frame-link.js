import { frameNonceOf, isFrameCommand } from "../lib/frame-protocol.js";
import { randomId } from "../lib/random-id.js";

const frames = new Map();
let link = null;

const entryOfNonce = (nonce) =>
  [...frames.entries()].find(([, entry]) => entry.nonce === nonce) ?? [];

const adoptPort = ({ name, entry, port }) => {
  entry.port?.disconnect();
  entry.port = port;
  port.onMessage.addListener((message) => {
    if (entry.port === port && isFrameCommand(message)) {
      link?.onCommand({ frame: name, command: message });
    }
  });
  port.onDisconnect.addListener(() => {
    if (entry.port !== port) return;
    entry.port = null;
    link?.onLost(name);
  });
  port.postMessage({ type: "state", ...link.snapshot() });
};

const handleConnect = (port) => {
  if (!link) return;
  const nonce = frameNonceOf({ port, extensionId: chrome.runtime.id });
  const [name, entry] = nonce ? entryOfNonce(nonce) : [];
  if (!entry) return;
  adoptPort({ name, entry, port });
};

export const createFrame = ({ name, path, title }) => {
  const nonce = randomId();
  const element = document.createElement("iframe");
  element.className = `qa-frame qa-frame--${name}`;
  element.title = title;
  element.setAttribute("allow", "clipboard-write");
  element.src = `${chrome.runtime.getURL(path)}#${nonce}`;
  frames.set(name, { element, nonce, port: null });
  return element;
};

export const sendToFrame = (name, message) => {
  const port = frames.get(name)?.port;
  if (!port) return false;
  port.postMessage(message);
  return true;
};

export const pushState = () => {
  if (!link) return;
  const snapshot = link.snapshot();
  frames.forEach(({ port }) => port?.postMessage({ type: "state", ...snapshot }));
  link.onState(snapshot);
};

export const openFrameLink = ({ snapshot, onCommand, onState, onLost }) => {
  link = { snapshot, onCommand, onState, onLost };
  chrome.runtime.onConnect.addListener(handleConnect);
};

export const closeFrameLink = () => {
  link = null;
  if (globalThis.chrome?.runtime?.onConnect) {
    chrome.runtime.onConnect.removeListener(handleConnect);
  }
  frames.forEach(({ port, element }) => {
    try {
      port?.disconnect();
    } catch (error) {
      console.error("QA Annotator: closing a frame port failed.", error);
    }
    element.remove();
  });
  frames.clear();
};
