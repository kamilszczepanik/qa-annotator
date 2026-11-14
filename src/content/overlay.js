import { isFinishShortcut, isSaveShortcut } from "../lib/comment-shortcuts.js";
import { whenTrusted } from "../lib/trusted-event.js";
import {
  cancelCommentBox,
  commitCommentBox,
  isCommentBoxOpen,
} from "./comment-box.js";
import { draftAreaCount, endDraft } from "./draft-issue.js";
import {
  DRAFT_DISCARDED_MESSAGE,
  openCommentBox,
  saveBankedDraft,
} from "./issue-capture.js";
import { startEventFirewall, stopEventFirewall } from "./event-firewall.js";
import {
  createOverlayHost,
  OVERLAY_HOST_ID,
  promoteOverlayHost,
  readOverlayCss,
} from "./overlay-host.js";
import { closePanel, finishSession, loadSession } from "./panel.js";
import { cancelDrag, startPicking, stopPicking } from "./picker.js";
import {
  isLoadedExtensionStale,
  ORPHANED_PAGE_MESSAGE,
  STALE_EXTENSION_MESSAGE,
  whileExtensionAlive,
} from "./stale-extension.js";

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

export const finishFromKeyboard = async () => {
  if (await commitCommentBox()) await finishSession();
};

const showOrphanedPage = () => {
  stopPicking();
  setOverlayStatus(ORPHANED_PAGE_MESSAGE);
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

const handleTrustedKeyDown = whenTrusted(
  whileExtensionAlive({ handler: handleKeyDown, onOrphaned: showOrphanedPage }),
);

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
  window.addEventListener("keydown", handleTrustedKeyDown, true);

  document.getElementById(OVERLAY_HOST_ID)?.remove();
  const host = createOverlayHost();
  const root = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = await readOverlayCss();
  if (generation !== mountGeneration) return;

  hostElement = host;
  shadowRoot = root;
  document.documentElement.append(host);
  promoteOverlayHost({ host, root });
  startEventFirewall(host);
  root.append(style, createStatusBar());
  root.querySelector(".qa-issue-count")?.focus();

  const isStale = await isLoadedExtensionStale();
  if (generation !== mountGeneration) {
    host.remove();
    return;
  }
  if (isStale) {
    setOverlayStatus(STALE_EXTENSION_MESSAGE);
    return;
  }

  await loadSession();
  if (generation !== mountGeneration) {
    host.remove();
    return;
  }
  startPicking({
    onPicked: whileExtensionAlive({
      handler: openCommentBox,
      onOrphaned: showOrphanedPage,
    }),
  });
};

const unmount = () => {
  mountGeneration += 1;
  window.removeEventListener("keydown", handleTrustedKeyDown, true);
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
