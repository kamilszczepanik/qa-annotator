import { whenTrusted } from "../lib/trusted-event.js";
import {
  COMMENT_LABEL,
  commentFieldLabel,
  createAreaCounter,
  createCardActions,
  createErrorLine,
  positionCard,
} from "./comment-card.js";
import { createCommentField } from "./comment-field.js";
import { promoteOverlayHost } from "./overlay-host.js";
import {
  finishFromKeyboard,
  getOverlayHost,
  getOverlayShadowRoot,
} from "./overlay.js";
import { rectOfPick } from "./session-store.js";

const EMPTY_COMMENT_MESSAGE = "Add a comment before saving.";

let commentBox = null;
let commentField = null;
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
  commentField?.dispose();
  commentBox.remove();
  commentBox = null;
  commentField = null;
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

const showBoxError = ({ field, errorLine, message }) => {
  errorLine.textContent = message;
  errorLine.hidden = false;
  field.setInvalid(true);
  clampCard();
};

const clearBoxError = ({ field, errorLine }) => {
  if (errorLine.hidden) return;
  errorLine.hidden = true;
  errorLine.textContent = "";
  field.setInvalid(false);
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

const submitComment = async ({ field, errorLine, onSubmit }) => {
  const comment = field.value().trim();
  if (!comment) {
    showBoxError({ field, errorLine, message: EMPTY_COMMENT_MESSAGE });
    return;
  }
  const failure = await failureOf({ onSubmit, comment });
  if (failure) {
    showBoxError({ field, errorLine, message: failure });
    return;
  }
  closeCommentBox();
};

export const commitCommentBox = async () => {
  if (!commentBox) return true;
  const typed = commentField.value().trim();
  if (!typed) {
    pendingCancel();
    return closeCommentBox();
  }
  await pendingSave();
  return commentBox === null;
};

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

  const errorLine = createErrorLine();
  let field = null;

  const save = () => submitComment({ field, errorLine, onSubmit: onSave });
  const addArea = () =>
    submitComment({ field, errorLine, onSubmit: onAddArea });
  const cancel = () => {
    onCancel();
    closeCommentBox();
  };
  const shortcutHandlers = {
    save: () => void save(),
    addArea: () => void addArea(),
    cancel: () => cancelCommentBox(),
    finish: () => void finishFromKeyboard(),
  };
  pendingSave = save;
  pendingCancel = onCancel;
  const { actions, saveButton, addAreaButton } = createCardActions({
    onCancel: cancel,
    onAddArea: whenTrusted(() => void addArea()),
    onSave: whenTrusted(() => void save()),
  });
  field = createCommentField({
    label: commentFieldLabel(areaNumber),
    placeholder: COMMENT_LABEL,
    onInput: (value) => {
      const isEmpty = value.trim() === "";
      saveButton.disabled = isEmpty;
      addAreaButton.disabled = isEmpty;
      clearBoxError({ field, errorLine });
    },
    onShortcut: (shortcut) => shortcutHandlers[shortcut]?.(),
  });
  commentField = field;

  commentBox.append(
    createAreaCounter(areaNumber),
    field.element,
    errorLine,
    actions,
  );
  shadowRoot.append(commentBox);
  promoteOverlayHost({ host: getOverlayHost(), root: shadowRoot });
  cardAnchor = rectOfPick(pick);
  clampCard();
  field.focus();
};
