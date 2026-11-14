import {
  commentShortcutOf,
  isTypedCharacter,
} from "../lib/comment-shortcuts.js";
import { whenTrusted } from "../lib/trusted-event.js";
import { startEventFirewall, stopEventFirewall } from "./event-firewall.js";
import {
  cancelIssue,
  hasIssueInProgress,
  resetIssue,
  startIssue,
} from "./issue-capture.js";
import {
  createOverlayHost,
  OVERLAY_HOST_ID,
  promoteOverlayHost,
  readOverlayCss,
} from "./overlay-host.js";
import { panelSnapshot, runPanelCommand } from "./panel-commands.js";
import {
  closePanelLink,
  isPanelLinked,
  openPanelLink,
  sendToPanel,
} from "./panel-link.js";
import { createNotice, flashTip, setNotice } from "./page-notice.js";
import { cancelDrag, startPicking, stopPicking } from "./picker.js";
import { loadSession } from "./session-actions.js";
import { resetStatus } from "./session-status.js";
import { isExtensionAlive } from "../lib/extension-context.js";
import {
  isLoadedExtensionStale,
  ORPHANED_PAGE_MESSAGE,
  STALE_EXTENSION_MESSAGE,
  whileExtensionAlive,
} from "./stale-extension.js";

const PANEL_WAIT_MS = 3000;
const TYPE_IN_PANEL_MESSAGE =
  "Click the comment box in the side panel, then type.";
const PANEL_CLOSED_MESSAGE =
  "The QA Annotator side panel is closed. Click the toolbar icon to open it.";

let isActive = false;
let shadowRoot = null;
let hostElement = null;
let mountGeneration = 0;

export const getOverlayHost = () => hostElement;

export const getOverlayShadowRoot = () => shadowRoot;

export const setOverlayPointerEvents = (value) => {
  hostElement?.style.setProperty("pointer-events", value, "important");
};

const showOrphanedPage = () => {
  stopPicking();
  resetIssue();
  setNotice(ORPHANED_PAGE_MESSAGE);
};

const handleKeyDown = (event) => {
  if (isActive && !hostElement?.isConnected) {
    void turnOff();
    return;
  }
  const shortcut = commentShortcutOf(event);
  if (!shortcut) {
    if (isTypedCharacter(event) && hasIssueInProgress()) {
      flashTip(TYPE_IN_PANEL_MESSAGE);
    }
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (shortcut === "cancel") {
    if (cancelDrag() || cancelIssue()) return;
    void turnOff();
    return;
  }
  if (isPanelLinked()) sendToPanel({ type: "shortcut", shortcut });
  else setNotice(PANEL_CLOSED_MESSAGE);
};

const handleTrustedKeyDown = whenTrusted(
  whileExtensionAlive({ handler: handleKeyDown, onOrphaned: showOrphanedPage }),
);

const handlePanelClosed = () => {
  if (!isExtensionAlive()) {
    showOrphanedPage();
    return;
  }
  if (isActive) void turnOff();
};

const remindWhenPanelStaysClosed = (generation) => {
  setTimeout(() => {
    if (generation !== mountGeneration || !isActive) return;
    if (!isPanelLinked()) setNotice(PANEL_CLOSED_MESSAGE);
  }, PANEL_WAIT_MS);
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
  root.append(style, createNotice());

  const isStale = await isLoadedExtensionStale();
  if (generation !== mountGeneration) return;
  if (isStale) {
    setNotice(STALE_EXTENSION_MESSAGE);
    return;
  }

  await loadSession();
  if (generation !== mountGeneration) return;
  openPanelLink({
    snapshot: panelSnapshot,
    onCommand: (command) => void runPanelCommand(command),
    onLinked: () => setNotice(null),
    onUnlinked: handlePanelClosed,
  });
  startPicking({
    onPicked: whileExtensionAlive({
      handler: startIssue,
      onOrphaned: showOrphanedPage,
    }),
  });
  remindWhenPanelStaysClosed(generation);
};

const unmount = () => {
  mountGeneration += 1;
  window.removeEventListener("keydown", handleTrustedKeyDown, true);
  closePanelLink();
  stopPicking();
  resetIssue();
  resetStatus();
  stopEventFirewall();
  hostElement?.remove();
  hostElement = null;
  shadowRoot = null;
};

const turnOn = async () => {
  isActive = true;
  try {
    await mount();
  } catch (error) {
    console.error("QA Annotator: mounting the overlay failed.", error);
    isActive = false;
    unmount();
  }
};

const turnOff = async () => {
  isActive = false;
  unmount();
  if (!isExtensionAlive()) return;
  try {
    await chrome.runtime.sendMessage({ type: "QA_MODE_OFF" });
  } catch (error) {
    console.error("QA Annotator: closing the side panel failed.", error);
  }
};

export const toggleQaMode = async () => {
  if (!isActive) {
    await turnOn();
    return;
  }
  if (isPanelLinked() || !hostElement?.isConnected) await turnOff();
};
