import { commentShortcutOf } from "../lib/comment-shortcuts.js";
import { otherSitesNote } from "../lib/text.js";
import {
  copyPrompt,
  fillShortcutLabels,
  openFramePort,
  reportSize,
} from "./frame-port.js";
import { renderIssues } from "./issue-list.js";

const find = (selector) => document.querySelector(selector);
const elements = {
  sheet: find("[data-sheet]"),
  count: find("[data-count]"),
  empty: find("[data-empty]"),
  issueList: find("[data-issue-list]"),
  elsewhere: find("[data-elsewhere]"),
  error: find("[data-error]"),
  close: find("[data-close]"),
  finish: find("[data-finish]"),
};

let snapshot = null;
let editingId = null;
let port = null;

const send = (message) => port.send(message);
const sendSize = reportSize({ element: elements.sheet, send });

const issueHandlers = {
  onEdit: (id) => {
    editingId = id;
    render();
  },
  onDelete: (id) => send({ type: "delete", id }),
  onSaveEdit: ({ id, comments }) => {
    editingId = null;
    send({ type: "edit", id, comments });
    render();
  },
  onCancelEdit: () => {
    editingId = null;
    render();
  },
};

const render = () => {
  const issues = snapshot?.issues ?? [];
  const total = snapshot?.sessionIssueCount ?? 0;
  elements.count.textContent = issues.length ? `(${issues.length})` : "";
  elements.empty.hidden = issues.length > 0;
  renderIssues({
    list: elements.issueList,
    issues,
    editingId,
    enabled: true,
    handlers: issueHandlers,
  });
  const note = otherSitesNote(total - issues.length);
  elements.elsewhere.textContent = note;
  elements.elsewhere.hidden = !note;
  const error = snapshot?.error ?? null;
  elements.error.textContent = error ?? "";
  elements.error.hidden = !error;
  elements.finish.disabled =
    Boolean(snapshot?.isFinishing) || (total === 0 && !snapshot?.draft);
  sendSize();
};

const finish = () => send({ type: "finish", comment: "" });

const handleMessage = (message) => {
  if (message?.type === "state") {
    snapshot = message;
    render();
  } else if (message?.type === "focus") {
    window.focus();
    if (elements.finish.disabled) elements.close.focus();
    else elements.finish.focus();
  } else if (message?.type === "report") {
    void copyPrompt({ prompt: message.prompt, send });
  }
};

port = openFramePort({ onMessage: handleMessage });

fillShortcutLabels();
elements.close.addEventListener("click", () => send({ type: "close" }));
elements.finish.addEventListener("click", finish);
document.addEventListener("keydown", (event) => {
  if (!event.isTrusted) return;
  const shortcut = commentShortcutOf(event);
  if (shortcut === "finish") {
    event.preventDefault();
    finish();
  } else if (shortcut === "cancel" && !editingId) {
    event.preventDefault();
    send({ type: "close" });
  }
});
render();
