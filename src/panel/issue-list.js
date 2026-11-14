import { commentShortcutOf } from "../lib/comment-shortcuts.js";

const createButton = ({ label, className, onClick }) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
};

const createComments = (comments) => {
  const body = document.createElement("div");
  body.className = "issue-body";
  comments.forEach((comment, position) => {
    const text = document.createElement("p");
    text.className = "issue-comment";
    text.textContent =
      comments.length > 1 ? `Area ${position + 1}: ${comment}` : comment;
    body.append(text);
  });
  return body;
};

const createNumber = (position) => {
  const number = document.createElement("span");
  number.className = "issue-number";
  number.textContent = String(position + 1);
  return number;
};

const createViewRow = ({ issue, position, enabled, onEdit, onDelete }) => {
  const row = document.createElement("li");
  row.className = "issue";
  row.dataset.id = issue.id;

  const actions = document.createElement("div");
  actions.className = "issue-actions";
  const edit = createButton({
    label: "Edit",
    className: "button button--quiet",
    onClick: () => onEdit(issue.id),
  });
  const remove = createButton({
    label: "Delete",
    className: "button button--quiet button--danger",
    onClick: () => onDelete(issue.id),
  });
  edit.disabled = !enabled;
  remove.disabled = !enabled;
  edit.setAttribute("aria-label", `Edit issue ${position + 1}`);
  remove.setAttribute("aria-label", `Delete issue ${position + 1}`);
  actions.append(edit, remove);

  row.append(createNumber(position), createComments(issue.comments), actions);
  return row;
};

const createEditRow = ({ issue, position, onSaveEdit, onCancelEdit }) => {
  const row = document.createElement("li");
  row.className = "issue issue--editing";
  row.dataset.id = issue.id;
  row.dataset.editing = "true";

  const form = document.createElement("div");
  form.className = "issue-edit";
  const fields = issue.comments.map((comment, area) => {
    const field = document.createElement("textarea");
    field.className = "comment-field comment-field--compact";
    field.rows = 3;
    field.value = comment;
    field.setAttribute(
      "aria-label",
      issue.comments.length > 1
        ? `Issue ${position + 1}, area ${area + 1}`
        : `Issue ${position + 1}`,
    );
    return field;
  });
  const save = () =>
    onSaveEdit({ id: issue.id, comments: fields.map((f) => f.value) });
  form.addEventListener("keydown", (event) => {
    const shortcut = commentShortcutOf(event);
    if (shortcut !== "save" && shortcut !== "cancel") return;
    event.preventDefault();
    event.stopPropagation();
    if (shortcut === "save") save();
    else onCancelEdit();
  });

  const actions = document.createElement("div");
  actions.className = "issue-actions";
  actions.append(
    createButton({
      label: "Cancel",
      className: "button",
      onClick: onCancelEdit,
    }),
    createButton({
      label: "Save changes",
      className: "button button--primary",
      onClick: save,
    }),
  );
  form.append(...fields, actions);
  row.append(createNumber(position), form);
  queueMicrotask(() => fields[0]?.focus());
  return row;
};

export const renderIssues = ({ list, issues, editingId, enabled, handlers }) => {
  const signature = JSON.stringify({ issues, editingId, enabled });
  if (list.dataset.signature === signature) return;
  list.dataset.signature = signature;
  list.replaceChildren(
    ...issues.map((issue, position) =>
      issue.id === editingId
        ? createEditRow({ issue, position, ...handlers })
        : createViewRow({ issue, position, enabled, ...handlers }),
    ),
  );
};
