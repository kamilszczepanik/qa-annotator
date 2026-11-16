import {
  commentShortcutOf,
  isTypedCharacter,
} from "../lib/comment-shortcuts.js";
import { isCardComposing, refocusCard } from "./card-frame.js";
import { sendToFrame } from "./frame-link.js";
import { cancelIssue, hasIssueInProgress, saveIssue } from "./issue-capture.js";
import { cancelDrag } from "./picker.js";
import { requestFinish } from "./session-ui.js";
import { collapseList } from "./session-pill.js";

const forwardToCard = (shortcut) =>
  sendToFrame("card", { type: "shortcut", shortcut });

const cancelFromPage = ({ turnOff }) => {
  if (cancelDrag() || collapseList() || cancelIssue()) return;
  turnOff();
};

const SHORTCUT_HANDLERS = {
  cancel: cancelFromPage,
  finish: () => requestFinish(),
  save: () => {
    if (isCardComposing()) forwardToCard("save");
    else if (hasIssueInProgress()) void saveIssue("");
  },
  addArea: () => {
    if (isCardComposing()) forwardToCard("addArea");
  },
};

export const handlePageKey = ({ event, turnOff }) => {
  const shortcut = commentShortcutOf(event);
  if (!shortcut) {
    if (isTypedCharacter(event) && isCardComposing()) refocusCard();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  SHORTCUT_HANDLERS[shortcut]({ turnOff });
};
