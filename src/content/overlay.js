import {
  cancelCommentBox,
  commitCommentBox,
  isCommentBoxOpen,
  isSaveShortcut,
} from "./comment-box.js";
import { draftAreaCount, endDraft } from "./draft-issue.js";
import {
  DRAFT_DISCARDED_MESSAGE,
  openCommentBox,
  saveBankedDraft,
} from "./issue-capture.js";
import { startEventFirewall, stopEventFirewall } from "./event-firewall.js";
import { createOverlayHost, promoteOverlayHost } from "./overlay-host.js";
import { closePanel, finishSession, loadSession } from "./panel.js";
import { cancelDrag, startPicking, stopPicking } from "./picker.js";

const STYLESHEET_PATHS = ["src/overlay.css", "src/panel.css"];
const STATUS_SILENT_CLASS = "qa-visually-hidden";

let isActive = false;
let shadowRoot = null;
let hostElement = null;
let mountGeneration = 0;

export const getOverlayHost = () => hostElement;

export const getOverlayShadowRoot = () => shadowRoot;

export const setOverlayPointerEvents = (value) => {
  hostElement?.style.setProperty("pointer-events", value, "important");
};

const isFinishShortcut = (event) =>
  event.key === "Enter" && event.shiftKey && (event.metaKey || event.ctrlKey);

const finishFromKeyboard = async () => {
  if (await commitCommentBox()) await finishSession();
};

const handleKeyDown = (event) => {
  if (isActive && !getOverlayHost()?.isConnected) {
    void toggleQaMode();
    return;
  }
  if (isFinishShortcut(event)) {
    event.preventDefault();
    event.stopPropagation();
    void finishFromKeyboard();
    return;
  }
  if (isSaveShortcut(event) && !isCommentBoxOpen() && draftAreaCount() > 0) {
    event.preventDefault();
    event.stopPropagation();
    void saveBankedDraft();
    return;
  }
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  if (cancelDrag()) return;
  if (cancelCommentBox()) return;
  if (endDraft()) {
    setOverlayStatus(DRAFT_DISCARDED_MESSAGE);
    return;
  }
  void toggleQaMode();
};

const readOverlayCss = async () => {
  const stylesheets = await Promise.all(
    STYLESHEET_PATHS.map(async (path) => {
      const response = await fetch(chrome.runtime.getURL(path));
      return response.text();
    }),
  );
  return stylesheets.join("\n");
};

const createStatusBar = () => {
  const statusBar = document.createElement("div");
  statusBar.className = "qa-status-bar";

  const label = document.createElement("span");
  label.textContent = "QA mode on ·";

  const status = document.createElement("span");
  status.className = `qa-status-message ${STATUS_SILENT_CLASS}`;
  status.setAttribute("role", "status");

  const issueCount = document.createElement("button");
  issueCount.type = "button";
  issueCount.className = "qa-issue-count";
  issueCount.textContent = "0 issues";
  issueCount.addEventListener("click", () => {
    const sessionPanel = shadowRoot.querySelector(".qa-session-panel");
    if (sessionPanel) sessionPanel.hidden = !sessionPanel.hidden;
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "qa-close-button";
  closeButton.setAttribute("aria-label", "Turn off QA mode");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => toggleQaMode());

  statusBar.append(label, status, issueCount, closeButton);
  return statusBar;
};

export const setOverlayStatus = (message) => {
  const status = shadowRoot?.querySelector(".qa-status-message");
  if (!status) return;
  status.textContent = message ?? "";
  status.classList.toggle(STATUS_SILENT_CLASS, !message);
};

const mount = async () => {
  mountGeneration += 1;
  const generation = mountGeneration;
  window.addEventListener("keydown", handleKeyDown, true);

  const host = createOverlayHost();
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = await readOverlayCss();
  if (generation !== mountGeneration) return;

  hostElement = host;
  shadowRoot = root;
  document.documentElement.append(host);
  promoteOverlayHost(host);
  startEventFirewall(host);
  root.append(style, createStatusBar());
  root.querySelector(".qa-issue-count")?.focus();

  await loadSession();
  if (generation !== mountGeneration) {
    host.remove();
    return;
  }
  startPicking({ onPicked: openCommentBox });
};

const unmount = () => {
  mountGeneration += 1;
  window.removeEventListener("keydown", handleKeyDown, true);
  stopPicking();
  endDraft();
  closePanel();
  stopEventFirewall();
  hostElement?.remove();
  hostElement = null;
  shadowRoot = null;
};

export const toggleQaMode = async () => {
  isActive = !isActive;

  if (!isActive) {
    unmount();
    return;
  }

  try {
    await mount();
  } catch (error) {
    console.error("QA Annotator: mounting the overlay failed.", error);
    isActive = false;
    unmount();
  }
};
