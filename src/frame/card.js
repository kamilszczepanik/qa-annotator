import {
  cardHint,
  cardTitle,
  commentPlaceholder,
  EMPTY_COMMENT_MESSAGE,
} from "../lib/card-text.js";
import { commentShortcutOf } from "../lib/comment-shortcuts.js";
import { renderAreas } from "./card-areas.js";
import {
  copyPrompt,
  fillShortcutLabels,
  openFramePort,
  reportSize,
} from "./frame-port.js";

const find = (selector) => document.querySelector(selector);
const elements = {
  card: find("[data-card]"),
  title: find("[data-title]"),
  target: find("[data-target]"),
  areas: find("[data-areas]"),
  hint: find("[data-hint]"),
  composer: find("[data-composer]"),
  label: find("[data-label]"),
  comment: find("#comment"),
  error: find("[data-error]"),
  cancel: find("[data-cancel]"),
  addArea: find("[data-add-area]"),
  save: find("[data-save]"),
};

let draft = null;
let pickId = null;
let localError = null;

const autoGrow = () => {
  const { comment } = elements;
  comment.style.height = "auto";
  comment.style.height = `${comment.scrollHeight + 2}px`;
};

const render = () => {
  const current = draft?.current ?? null;
  const text = elements.comment.value.trim();
  elements.title.textContent = cardTitle(draft);
  elements.target.textContent = current?.label ?? "";
  renderAreas({ list: elements.areas, areas: draft?.areas ?? [] });
  const hint = cardHint(draft);
  elements.hint.textContent = hint;
  elements.hint.hidden = !hint;
  elements.composer.hidden = !current;
  const placeholder = commentPlaceholder(current);
  elements.comment.placeholder = placeholder;
  elements.label.textContent = placeholder;
  elements.addArea.hidden = !current;
  elements.addArea.disabled = !text;
  elements.save.disabled = current ? !text : !draft?.areas.length;
  const error = localError ?? draft?.error ?? null;
  elements.error.textContent = error ?? "";
  elements.error.hidden = !error;
  if (error) elements.comment.setAttribute("aria-invalid", "true");
  else elements.comment.removeAttribute("aria-invalid");
};

let port = null;
const send = (message) => port.send(message);
const sendSize = reportSize({ element: elements.card, send });

const focusComment = () => {
  window.focus();
  if (draft?.current) elements.comment.focus();
  else elements.card.focus();
};

const handleState = (state) => {
  const nextPickId = state.draft?.current?.id ?? null;
  if (nextPickId !== pickId) {
    if (!nextPickId) elements.comment.value = "";
    localError = null;
    pickId = nextPickId;
  }
  draft = state.draft;
  render();
  autoGrow();
  sendSize();
};

const submit = (type) => {
  const current = draft?.current;
  if (!draft) return;
  if (type === "addArea" && !current) return;
  if (current && !elements.comment.value.trim()) {
    localError = EMPTY_COMMENT_MESSAGE;
    render();
    focusComment();
    return;
  }
  send({ type, comment: elements.comment.value });
};

const runShortcut = (shortcut) => {
  if (shortcut === "save" || shortcut === "addArea") submit(shortcut);
  else if (shortcut === "finish") {
    send({ type: "finish", comment: elements.comment.value });
  } else send({ type: "cancel" });
};

const handleMessage = (message) => {
  if (message?.type === "state") handleState(message);
  else if (message?.type === "focus") focusComment();
  else if (message?.type === "shortcut") runShortcut(message.shortcut);
  else if (message?.type === "report") {
    void copyPrompt({ prompt: message.prompt, send });
  }
};

port = openFramePort({ onMessage: handleMessage });

fillShortcutLabels();
elements.comment.addEventListener("input", () => {
  localError = null;
  autoGrow();
  render();
});
elements.save.addEventListener("click", () => submit("save"));
elements.addArea.addEventListener("click", () => submit("addArea"));
elements.cancel.addEventListener("click", () => send({ type: "cancel" }));
document.addEventListener("keydown", (event) => {
  if (!event.isTrusted) return;
  const shortcut = commentShortcutOf(event);
  if (!shortcut) return;
  event.preventDefault();
  runShortcut(shortcut);
});
render();
sendSize();
