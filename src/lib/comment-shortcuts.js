const hasCommandKey = (event) => Boolean(event.metaKey || event.ctrlKey);

export const isSaveShortcut = (event) =>
  event.key === "Enter" &&
  !event.shiftKey &&
  !event.altKey &&
  hasCommandKey(event);

export const isAddAreaShortcut = (event) =>
  event.key === "Enter" &&
  Boolean(event.altKey) &&
  !event.shiftKey &&
  hasCommandKey(event);

export const isFinishShortcut = (event) =>
  event.key === "Enter" && Boolean(event.shiftKey) && hasCommandKey(event);

export const commentShortcutOf = (event) => {
  if (isFinishShortcut(event)) return "finish";
  if (isAddAreaShortcut(event)) return "addArea";
  if (isSaveShortcut(event)) return "save";
  if (event.key === "Escape") return "cancel";
  return null;
};
