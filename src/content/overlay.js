import { isExtensionAlive } from "../lib/extension-context.js";
import { whenTrusted } from "../lib/trusted-event.js";
import { startEventFirewall, stopEventFirewall } from "./event-firewall.js";
import { resetIssue, startIssue } from "./issue-capture.js";
import {
  createOverlayHost,
  OVERLAY_HOST_ID,
  promoteOverlayHost,
  readOverlayCss,
} from "./overlay-host.js";
import { handlePageKey } from "./page-keys.js";
import { createNotice, setNotice } from "./page-notice.js";
import { startPicking, stopPicking } from "./picker.js";
import {
  loadSession,
  startSessionSync,
  stopSessionSync,
} from "./session-actions.js";
import { resetStatus } from "./session-status.js";
import { mountSessionUi, unmountSessionUi } from "./session-ui.js";
import {
  isLoadedExtensionStale,
  ORPHANED_PAGE_MESSAGE,
  STALE_EXTENSION_MESSAGE,
  whileExtensionAlive,
} from "./stale-extension.js";

let isActive = false;
let shadowRoot = null;
let hostElement = null;
let mountGeneration = 0;
let orphanWatch = 0;

const ORPHAN_CHECK_MS = 1000;

export const getOverlayHost = () => hostElement;

export const getOverlayShadowRoot = () => shadowRoot;

export const setOverlayPointerEvents = (value) => {
  hostElement?.style.setProperty("pointer-events", value, "important");
};

const showOrphanedPage = () => {
  clearInterval(orphanWatch);
  stopPicking();
  resetIssue();
  unmountSessionUi();
  stopEventFirewall();
  setNotice(ORPHANED_PAGE_MESSAGE);
};

const handleKeyDown = (event) => {
  if (isActive && !hostElement?.isConnected) {
    turnOff();
    return;
  }
  handlePageKey({ event, turnOff });
};

const handleTrustedKeyDown = whenTrusted(
  whileExtensionAlive({ handler: handleKeyDown, onOrphaned: showOrphanedPage }),
);

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
  startSessionSync();
  startPicking({
    onPicked: whileExtensionAlive({
      handler: startIssue,
      onOrphaned: showOrphanedPage,
    }),
  });
  mountSessionUi({ root, orphaned: showOrphanedPage });
  orphanWatch = setInterval(() => {
    if (!isExtensionAlive()) showOrphanedPage();
  }, ORPHAN_CHECK_MS);
};

const unmount = () => {
  mountGeneration += 1;
  clearInterval(orphanWatch);
  window.removeEventListener("keydown", handleTrustedKeyDown, true);
  stopSessionSync();
  unmountSessionUi();
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

const turnOff = () => {
  isActive = false;
  unmount();
};

export const toggleQaMode = async () => {
  if (isActive && hostElement?.isConnected && isExtensionAlive()) {
    turnOff();
    return;
  }
  if (isActive) unmount();
  await turnOn();
};
