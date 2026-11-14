const IDLE_HINT =
  "Click the element that is wrong on the page, or drag a box around an area.";
const BANKED_HINT =
  "Pick the next area on the page, or save the issue with the areas you have.";
const CAPTURING_LABEL = "Capturing…";
const FOCUSED_PLACEHOLDER = "Describe what is wrong and what you expected.";
const UNFOCUSED_PLACEHOLDER = "Click here, then type what is wrong.";
const EDITABLE_TARGETS = "button, textarea, input, select, a";

const offlineHint = (labels) =>
  `QA mode is off on this page. Press ${labels.toggle} on the page to start.`;

const createThumbnail = ({ number, thumbnail }) => {
  const figure = document.createElement("figure");
  figure.className = "area-shot";
  if (thumbnail) {
    const image = document.createElement("img");
    image.src = thumbnail;
    image.alt = `Area ${number} on the page`;
    figure.append(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "area-shot-placeholder";
    placeholder.textContent = CAPTURING_LABEL;
    figure.append(placeholder);
  }
  return figure;
};

const createArea = ({ number, comment, thumbnail, isCurrent }) => {
  const item = document.createElement("li");
  item.className = isCurrent ? "area area--current" : "area";
  item.append(createThumbnail({ number, thumbnail }));
  if (comment) {
    const text = document.createElement("p");
    text.className = "area-comment";
    text.textContent = comment;
    item.append(text);
  }
  return item;
};

const titleOf = (draft) => {
  if (!draft) return "New issue";
  const count = draft.areas.length + (draft.current ? 1 : 0);
  return count > 1 ? `New issue · ${count} areas` : "New issue";
};

const hintOf = ({ draft, linked, labels }) => {
  if (!linked) return offlineHint(labels);
  if (!draft) return IDLE_HINT;
  return draft.current ? "" : BANKED_HINT;
};

const fieldLabelOf = (current) =>
  current.number > 1
    ? `Area ${current.number}: what is wrong here?`
    : "What is wrong here?";

export const renderDraft = ({ elements, draft, linked, labels, error }) => {
  const current = linked ? (draft?.current ?? null) : null;
  const visibleDraft = linked ? draft : null;
  const text = elements.comment.value.trim();

  elements.title.textContent = titleOf(visibleDraft);
  const hint = hintOf({ draft: visibleDraft, linked, labels });
  elements.hint.textContent = hint;
  elements.hint.hidden = !hint;

  const areas = [
    ...(visibleDraft?.areas ?? []),
    ...(current ? [{ ...current, isCurrent: true }] : []),
  ];
  const signature = JSON.stringify(areas);
  if (elements.areas.dataset.signature !== signature) {
    elements.areas.dataset.signature = signature;
    elements.areas.replaceChildren(...areas.map(createArea));
  }
  elements.areas.hidden = !visibleDraft;

  elements.composer.hidden = !current;
  if (current) elements.label.textContent = fieldLabelOf(current);

  elements.actions.hidden = !visibleDraft;
  elements.keys.hidden = !visibleDraft;
  elements.cancel.disabled = !visibleDraft;
  elements.addArea.disabled = !current || !text;
  elements.save.disabled = current ? !text : !visibleDraft?.areas.length;

  const message = linked ? error : null;
  elements.composeError.textContent = message ?? "";
  elements.composeError.hidden = !message;
  if (message) elements.comment.setAttribute("aria-invalid", "true");
  else elements.comment.removeAttribute("aria-invalid");
};

const syncPlaceholder = (comment) => {
  comment.placeholder = document.hasFocus()
    ? FOCUSED_PLACEHOLDER
    : UNFOCUSED_PLACEHOLDER;
};

export const wireComposerFocus = ({ elements, isComposing }) => {
  syncPlaceholder(elements.comment);
  window.addEventListener("focus", () => syncPlaceholder(elements.comment));
  window.addEventListener("blur", () => syncPlaceholder(elements.comment));
  document.addEventListener("mousedown", (event) => {
    if (!isComposing() || event.target.closest?.(EDITABLE_TARGETS)) return;
    event.preventDefault();
    elements.comment.focus();
  });
};
