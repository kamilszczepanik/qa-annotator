const MAC_LABELS = {
  save: "⌘↵",
  addArea: "⌘⌥↵",
  finish: "⌘⇧↵",
  cancel: "Esc",
  toggle: "⌘⇧U",
};

const OTHER_LABELS = {
  save: "Ctrl+Enter",
  addArea: "Ctrl+Alt+Enter",
  finish: "Ctrl+Shift+Enter",
  cancel: "Esc",
  toggle: "Ctrl+Shift+U",
};

export const isMacPlatform = (platform) => /mac/i.test(String(platform ?? ""));

export const shortcutLabels = (platform) =>
  isMacPlatform(platform) ? MAC_LABELS : OTHER_LABELS;
