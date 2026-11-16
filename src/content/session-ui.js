import { isExtensionAlive } from "../lib/extension-context.js";
import {
  createCardFrame,
  isCardComposing,
  removeCardFrame,
  setCardHeight,
  syncCard,
} from "./card-frame.js";
import {
  finishAndCopy,
  runFrameCommand,
  sessionSnapshot,
} from "./frame-commands.js";
import {
  closeFrameLink,
  openFrameLink,
  pushState,
  sendToFrame,
} from "./frame-link.js";
import { flashNotice } from "./page-notice.js";
import {
  collapseList,
  createPill,
  removePill,
  renderPill,
  setListHeight,
} from "./session-pill.js";

const STATUS_VISIBLE_MS = 6000;
const ERROR_VISIBLE_MS = 10000;

let lastStatus = null;
let lastError = null;
let onOrphaned = null;

const showStatusChanges = ({ status, error }) => {
  if (error && error !== lastError) flashNotice(error, ERROR_VISIBLE_MS);
  else if (status && status !== lastStatus) {
    flashNotice(status, STATUS_VISIBLE_MS);
  }
  lastStatus = status;
  lastError = error;
};

const renderState = (snapshot) => {
  renderPill(snapshot);
  syncCard(snapshot.draft);
  showStatusChanges(snapshot);
};

export const requestFinish = ({ frame = null } = {}) => {
  if (isCardComposing() && frame !== "card") {
    sendToFrame("card", { type: "shortcut", shortcut: "finish" });
    return;
  }
  void finishAndCopy({ frame });
};

const handleCommand = ({ frame, command }) => {
  if (command.type === "size") {
    if (frame === "card") setCardHeight(command.height);
    else setListHeight(command.height);
    return;
  }
  if (command.type === "close") {
    collapseList();
    return;
  }
  if (command.type === "finish" && frame !== "card") {
    requestFinish({ frame });
    return;
  }
  void runFrameCommand({ frame, command });
};

const handleLost = () => {
  if (!isExtensionAlive()) onOrphaned?.();
};

export const mountSessionUi = ({ root, orphaned }) => {
  onOrphaned = orphaned;
  openFrameLink({
    snapshot: sessionSnapshot,
    onCommand: handleCommand,
    onState: renderState,
    onLost: handleLost,
  });
  root.append(createCardFrame(), createPill());
  pushState();
};

export const unmountSessionUi = () => {
  closeFrameLink();
  removeCardFrame();
  removePill();
  lastStatus = null;
  lastError = null;
  onOrphaned = null;
};
