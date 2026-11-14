const COMMENT_LABEL = "What is wrong here?";
const ERROR_LINE_ID = "qa-comment-error";
const CARD_WIDTH_PX = 280;
const CARD_GAP_PX = 12;

export const positionCard = ({ card, anchor }) => {
  const { x, y, height } = anchor;
  const maxLeft = window.innerWidth - CARD_WIDTH_PX - CARD_GAP_PX;
  const maxTop = window.innerHeight - card.offsetHeight - CARD_GAP_PX;
  card.style.left = `${Math.max(CARD_GAP_PX, Math.min(x, maxLeft))}px`;
  card.style.top = `${Math.max(CARD_GAP_PX, Math.min(y + height + CARD_GAP_PX, maxTop))}px`;
};

export const createAreaCounter = (areaNumber) => {
  const counter = document.createElement("p");
  counter.className = "qa-area-counter";
  counter.textContent = `Area ${areaNumber}`;
  counter.hidden = areaNumber < 2;
  return counter;
};

const accessibleLabel = (areaNumber) =>
  areaNumber > 1 ? `Area ${areaNumber}, ${COMMENT_LABEL}` : COMMENT_LABEL;

export const createCommentInput = (areaNumber) => {
  const textarea = document.createElement("textarea");
  textarea.className = "qa-comment-input";
  textarea.placeholder = COMMENT_LABEL;
  textarea.setAttribute("aria-label", accessibleLabel(areaNumber));
  textarea.setAttribute("aria-describedby", ERROR_LINE_ID);
  return textarea;
};

export const createErrorLine = () => {
  const errorLine = document.createElement("p");
  errorLine.className = "qa-inline-error";
  errorLine.id = ERROR_LINE_ID;
  errorLine.setAttribute("role", "alert");
  errorLine.hidden = true;
  return errorLine;
};

export const createButton = ({ label, className, onClick }) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
};

export const createCardActions = ({ onCancel, onAddArea, onSave }) => {
  const saveButton = createButton({
    label: "Save (⌘↵)",
    className: "qa-button qa-button--primary",
    onClick: onSave,
  });
  const addAreaButton = createButton({
    label: "Add area (⌘⌥↵)",
    className: "qa-button",
    onClick: onAddArea,
  });
  saveButton.disabled = true;
  addAreaButton.disabled = true;

  const secondary = document.createElement("div");
  secondary.className = "qa-card-actions-secondary";
  secondary.append(
    createButton({
      label: "Cancel (Esc)",
      className: "qa-button",
      onClick: onCancel,
    }),
    addAreaButton,
  );

  const actions = document.createElement("div");
  actions.className = "qa-card-actions";
  actions.append(secondary, saveButton);
  return { actions, saveButton, addAreaButton };
};
