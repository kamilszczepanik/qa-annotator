(() => {
  const OVERLAY_HOST_ID = "qa-annotator-root";
  const KEYBOARD_EVENTS = ["keydown", "keypress", "keyup"];
  const PASS_THROUGH_KEYS = new Set(["Enter", "Escape", "Tab"]);
  const EDITABLE_TAGS = new Set(["TEXTAREA", "INPUT"]);

  const isEditable = (node) =>
    Boolean(node?.isContentEditable || EDITABLE_TAGS.has(node?.tagName));

  const comesFromOverlayField = (event) => {
    const path = event.composedPath();
    return (
      isEditable(path[0]) && path.some((node) => node?.id === OVERLAY_HOST_ID)
    );
  };

  const isOverlayShortcut = (event) =>
    PASS_THROUGH_KEYS.has(event.key) || event.metaKey || event.ctrlKey;

  const shieldTyping = (event) => {
    if (isOverlayShortcut(event) || !comesFromOverlayField(event)) return;
    event.stopImmediatePropagation();
  };

  KEYBOARD_EVENTS.forEach((type) =>
    window.addEventListener(type, shieldTyping, true),
  );
})();
