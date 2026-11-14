import { whenTrusted } from "../lib/trusted-event.js";
import {
  areaCountLabel,
  firstLine,
  issueCountLabel,
  truncate,
} from "../lib/text.js";

const MAX_ROW_COMMENT_LENGTH = 60;

const createRow = ({ annotation, position, onDelete }) => {
  const row = document.createElement("li");
  row.className = "qa-session-row";

  const number = document.createElement("span");
  number.className = "qa-session-index";
  number.textContent = `${position + 1}.`;

  const text = document.createElement("span");
  text.className = "qa-session-comment";
  text.textContent = truncate({
    text: firstLine(annotation.areas[0].comment),
    maxLength: MAX_ROW_COMMENT_LENGTH,
  });

  const areaCount = document.createElement("span");
  areaCount.className = "qa-session-areas";
  areaCount.textContent = `· ${areaCountLabel(annotation.areas.length)}`;
  areaCount.hidden = annotation.areas.length < 2;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "qa-button qa-button--quiet";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener(
    "click",
    whenTrusted(() => onDelete(annotation.id)),
  );

  row.append(number, text, areaCount, deleteButton);
  return row;
};

const createPanel = (root) => {
  const panel = document.createElement("div");
  panel.className = "qa-session-panel";
  panel.hidden = true;

  const rows = document.createElement("ul");
  rows.className = "qa-session-rows";

  const errorLine = document.createElement("p");
  errorLine.className = "qa-inline-error";
  errorLine.hidden = true;

  const actions = document.createElement("div");
  actions.className = "qa-card-actions";

  const finishButton = document.createElement("button");
  finishButton.type = "button";
  finishButton.className = "qa-button qa-button--primary qa-finish-button";
  finishButton.textContent = "Finish (⌘⇧↵)";
  actions.append(finishButton);

  panel.append(rows, errorLine, actions);
  root.append(panel);
  return panel;
};

export const renderSessionPanel = ({
  root,
  annotations,
  error,
  isFinishing,
  onDelete,
  onFinish,
}) => {
  const panel = root.querySelector(".qa-session-panel") ?? createPanel(root);

  const countButton = root.querySelector(".qa-issue-count");
  if (countButton) {
    countButton.textContent = issueCountLabel(annotations.length);
  }

  panel
    .querySelector(".qa-session-rows")
    .replaceChildren(
      ...annotations.map((annotation, position) =>
        createRow({ annotation, position, onDelete }),
      ),
    );

  const errorLine = panel.querySelector(".qa-inline-error");
  errorLine.textContent = error ?? "";
  errorLine.hidden = !error;

  const finishButton = panel.querySelector(".qa-finish-button");
  finishButton.disabled = Boolean(isFinishing);
  finishButton.onclick = whenTrusted(onFinish);
};
