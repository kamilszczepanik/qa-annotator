import { FRAME_PAGES } from "../lib/frame-protocol.js";
import { issueCountLabel } from "../lib/text.js";
import { whenTrusted } from "../lib/trusted-event.js";
import { createFrame, sendToFrame } from "./frame-link.js";

const LIST_MAX_HEIGHT_RATIO = 0.7;
const PARKED_CLASS = "qa-frame--parked";

let dock = null;
let pill = null;
let count = null;
let list = null;
let listHeight = 0;
let expanded = false;

const span = ({ className, text = "" }) => {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
};

const sizeList = () => {
  if (!list) return;
  const maxHeight = Math.round(window.innerHeight * LIST_MAX_HEIGHT_RATIO);
  list.style.height = `${Math.min(listHeight, maxHeight)}px`;
};

export const isListOpen = () => expanded;

export const collapseList = () => {
  if (!expanded) return false;
  expanded = false;
  list?.classList.add(PARKED_CLASS);
  list?.blur();
  pill?.setAttribute("aria-expanded", "false");
  return true;
};

const expandList = () => {
  expanded = true;
  sizeList();
  list?.classList.remove(PARKED_CLASS);
  pill?.setAttribute("aria-expanded", "true");
  list?.focus();
  sendToFrame("list", { type: "focus" });
};

const toggleList = () => {
  if (expanded) collapseList();
  else expandList();
};

export const setListHeight = (height) => {
  listHeight = Math.ceil(height);
  sizeList();
};

export const createPill = () => {
  dock = document.createElement("div");
  dock.className = "qa-dock";

  list = createFrame({
    name: "list",
    path: FRAME_PAGES.list,
    title: "QA Annotator issues",
  });
  list.classList.add(PARKED_CLASS);

  pill = document.createElement("button");
  pill.type = "button";
  pill.className = "qa-pill";
  pill.setAttribute("aria-expanded", "false");
  count = span({ className: "qa-pill-count" });
  pill.append(
    span({ className: "qa-pill-dot" }),
    span({ className: "qa-pill-mode", text: "QA mode" }),
    span({ className: "qa-pill-separator", text: "·" }),
    count,
    span({ className: "qa-pill-chevron" }),
  );
  pill.addEventListener("click", whenTrusted(toggleList));
  dock.append(list, pill);
  return dock;
};

export const renderPill = ({ sessionIssueCount }) => {
  if (!count) return;
  const label = issueCountLabel(sessionIssueCount);
  count.textContent = label;
  pill.setAttribute("aria-label", `QA mode on, ${label}`);
};

export const removePill = () => {
  dock?.remove();
  dock = null;
  pill = null;
  count = null;
  list = null;
  listHeight = 0;
  expanded = false;
};
