import { commentShortcutOf } from "../lib/comment-shortcuts.js";
import { PANEL_PORT_NAME } from "../lib/panel-protocol.js";
import { shortcutLabels } from "../lib/shortcut-labels.js";
import { issueCountLabel } from "../lib/text.js";
import { renderDraft, wireComposerFocus } from "./composer.js";
import { renderIssues } from "./issue-list.js";
import { elements } from "./panel-elements.js";

const EMPTY_COMMENT_MESSAGE = "Add a comment before saving.";
const MODE_ON = "QA mode on";
const MODE_OFF = "QA mode off";

const labels = shortcutLabels(
  navigator.userAgentData?.platform ?? navigator.platform,
);

let tabId = null;
let port = null;
let linked = false;
let snapshot = null;
let editingId = null;
let pickId = null;
let localError = null;

const send = (message) => {
  if (linked) port?.postMessage(message);
};

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
  const draft = snapshot?.draft ?? null;
  const issues = snapshot?.issues ?? [];
  elements.mode.textContent = linked ? MODE_ON : MODE_OFF;
  elements.mode.classList.toggle("panel-mode--on", linked);
  renderDraft({
    elements,
    draft,
    linked,
    labels,
    error: localError ?? draft?.error ?? null,
  });
  elements.issueCount.textContent = issues.length ? String(issues.length) : "";
  elements.empty.hidden = issues.length > 0;
  renderIssues({
    list: elements.issueList,
    issues,
    editingId,
    enabled: linked,
    handlers: issueHandlers,
  });
  elements.status.textContent = (linked && snapshot?.status) || "";
  const error = linked ? snapshot?.error : null;
  elements.error.textContent = error ?? "";
  elements.error.hidden = !error;
  const total = snapshot?.sessionIssueCount ?? 0;
  elements.finish.disabled =
    !linked || Boolean(snapshot?.isFinishing) || (total === 0 && !draft);
  elements.finish.title = linked
    ? `${issueCountLabel(total)} in this session`
    : "";
};

const focusComment = () => elements.comment.focus();

const handleState = (state) => {
  const nextPickId = state.draft?.current?.id ?? null;
  if (nextPickId !== pickId) {
    if (!nextPickId) elements.comment.value = "";
    localError = null;
    pickId = nextPickId;
    snapshot = state;
    render();
    if (nextPickId) focusComment();
    return;
  }
  snapshot = state;
  render();
};

const submit = (type) => {
  const current = snapshot?.draft?.current;
  if (!snapshot?.draft) return;
  if (type === "addArea" && !current) return;
  if (current && !elements.comment.value.trim()) {
    localError = EMPTY_COMMENT_MESSAGE;
    render();
    focusComment();
    return;
  }
  send({ type, comment: elements.comment.value });
};

const finish = () => send({ type: "finish", comment: elements.comment.value });

const runShortcut = (shortcut) => {
  if (shortcut === "save") submit("save");
  else if (shortcut === "addArea") submit("addArea");
  else if (shortcut === "finish") finish();
  else if (editingId) issueHandlers.onCancelEdit();
  else if (snapshot?.draft) send({ type: "cancel" });
};

const copyPrompt = async (prompt) => {
  try {
    await navigator.clipboard.writeText(prompt);
    send({ type: "copied" });
  } catch {
    send({ type: "copy", prompt });
  }
};

const handleMessage = (message) => {
  if (message?.type === "state") handleState(message);
  else if (message?.type === "shortcut") runShortcut(message.shortcut);
  else if (message?.type === "report") void copyPrompt(message.prompt);
};

const connect = () => {
  if (port || tabId === null) return;
  const candidate = chrome.tabs.connect(tabId, {
    name: PANEL_PORT_NAME,
    frameId: 0,
  });
  port = candidate;
  candidate.onMessage.addListener((message) => {
    linked = true;
    handleMessage(message);
  });
  candidate.onDisconnect.addListener(() => {
    void chrome.runtime.lastError;
    if (port !== candidate) return;
    port = null;
    linked = false;
    editingId = null;
    render();
  });
};

const wireControls = () => {
  document.querySelectorAll("[data-key]").forEach((key) => {
    key.textContent = labels[key.dataset.key];
  });
  elements.comment.addEventListener("input", () => {
    localError = null;
    render();
  });
  elements.save.addEventListener("click", () => submit("save"));
  elements.addArea.addEventListener("click", () => submit("addArea"));
  elements.cancel.addEventListener("click", () => send({ type: "cancel" }));
  elements.finish.addEventListener("click", finish);
  document.addEventListener("keydown", (event) => {
    if (!event.isTrusted) return;
    const shortcut = commentShortcutOf(event);
    if (!shortcut) return;
    event.preventDefault();
    runShortcut(shortcut);
  });
};

const start = async () => {
  wireControls();
  wireComposerFocus({
    elements,
    isComposing: () => linked && Boolean(snapshot?.draft?.current),
  });
  render();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id ?? null;
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (
      message?.type === "QA_MOUNTED" &&
      sender.id === chrome.runtime.id &&
      sender.tab?.id === tabId
    ) {
      connect();
    }
  });
  connect();
};

void start();
