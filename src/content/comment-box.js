import {
  createAreaCounter,
  createCardActions,
  createCommentInput,
  createErrorLine,
  positionCard,
} from "./comment-card.js";
import { promoteOverlayHost } from "./overlay-host.js";
import { getOverlayHost, getOverlayShadowRoot } from "./overlay.js";
import { rectOfPick } from "./session-store.js";

const EMPTY_COMMENT_MESSAGE = "Add a comment before saving.";

let commentBox = null;
let cardAnchor = null;
let previouslyFocused = null;
let pendingSave = null;
let pendingCancel = null;

export const isCommentBoxOpen = () => commentBox !== null;

const activeElementOf = (shadowRoot) =>
  shadowRoot.activeElement ?? document.activeElement;

const restoreFocus = () => {
  const fallback = getOverlayShadowRoot()?.querySelector(".qa-issue-count");
  const target = previouslyFocused?.isConnected ? previouslyFocused : fallback;
  previouslyFocused = null;
  target?.focus();
};

export const closeCommentBox = () => {
  if (!commentBox) return false;
  commentBox.remove();
  commentBox = null;
  cardAnchor = null;
  pendingSave = null;
  pendingCancel = null;
  restoreFocus();
  return true;
};

export const cancelCommentBox = () => {
  if (!commentBox) return false;
  const cancel = pendingCancel;
  closeCommentBox();
  cancel?.();
  return true;
};

const clampCard = () => {
  if (!commentBox || !cardAnchor) return;
  positionCard({ card: commentBox, anchor: cardAnchor });
};

const showBoxError = ({ textarea, errorLine, message }) => {
  errorLine.textContent = message;
  errorLine.hidden = false;
  textarea.setAttribute("aria-invalid", "true");
  clampCard();
};

const clearBoxError = ({ textarea, errorLine }) => {
  if (errorLine.hidden) return;
  errorLine.hidden = true;
  errorLine.textContent = "";
  textarea.removeAttribute("aria-invalid");
  clampCard();
};

const failureOf = async ({ onSubmit, comment }) => {
  try {
    return await onSubmit(comment);
  } catch (error) {
    console.error("QA Annotator: saving the comment failed.", error);
    return `Could not save the comment: ${error?.message ?? String(error)}`;
  }
};

const submitComment = async ({ textarea, errorLine, onSubmit }) => {
  const comment = textarea.value.trim();
  if (!comment) {
    showBoxError({ textarea, errorLine, message: EMPTY_COMMENT_MESSAGE });
    return;
  }
  const failure = await failureOf({ onSubmit, comment });
  if (failure) {
    showBoxError({ textarea, errorLine, message: failure });
    return;
  }
  closeCommentBox();
};

export const commitCommentBox = async () => {
  if (!commentBox) return true;
  const typed = commentBox.querySelector(".qa-comment-input").value.trim();
  if (!typed) {
    pendingCancel();
    return closeCommentBox();
  }
  await pendingSave();
  return commentBox === null;
};

const keepFocus = (textarea) => {
  if (getOverlayShadowRoot()?.activeElement === textarea) return;
  textarea.focus();
};

export const isSaveShortcut = (event) =>
  event.key === "Enter" &&
  !event.shiftKey &&
  !event.altKey &&
  Boolean(event.metaKey || event.ctrlKey);

export const isAddAreaShortcut = (event) =>
  event.key === "Enter" &&
  event.altKey &&
  !event.shiftKey &&
  Boolean(event.metaKey || event.ctrlKey);

export const showCommentBox = ({
  pick,
  areaNumber,
  onSave,
  onAddArea,
  onCancel,
}) => {
  const shadowRoot = getOverlayShadowRoot();
  if (!shadowRoot) return;
  const previous = activeElementOf(shadowRoot);
  closeCommentBox();
  previouslyFocused =
    previous?.isConnected && previous !== document.body ? previous : null;

  commentBox = document.createElement("div");
  commentBox.className = "qa-comment-box";

  const textarea = createCommentInput(areaNumber);
  const errorLine = createErrorLine();

  const save = () => submitComment({ textarea, errorLine, onSubmit: onSave });
  const addArea = () =>
    submitComment({ textarea, errorLine, onSubmit: onAddArea });
  const cancel = () => {
    onCancel();
    closeCommentBox();
  };
  pendingSave = save;
  pendingCancel = onCancel;
  const { actions, saveButton, addAreaButton } = createCardActions({
    onCancel: cancel,
    onAddArea: () => void addArea(),
    onSave: () => void save(),
  });
  textarea.addEventListener("keydown", (event) => {
    keepFocus(textarea);
    if (isAddAreaShortcut(event)) {
      event.preventDefault();
      void addArea();
      return;
    }
    if (!isSaveShortcut(event)) return;
    event.preventDefault();
    void save();
  });
  textarea.addEventListener("input", () => {
    const isEmpty = textarea.value.trim() === "";
    saveButton.disabled = isEmpty;
    addAreaButton.disabled = isEmpty;
    clearBoxError({ textarea, errorLine });
  });

  commentBox.append(
    createAreaCounter(areaNumber),
    textarea,
    errorLine,
    actions,
  );
  shadowRoot.append(commentBox);
  promoteOverlayHost(getOverlayHost());
  cardAnchor = rectOfPick(pick);
  clampCard();
  textarea.focus();
};
