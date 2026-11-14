export const OVERLAY_HOST_ID = "qa-annotator-root";
const HOST_STYLE_DECLARATIONS = [
  ["position", "fixed"],
  ["inset", "0"],
  ["z-index", "2147483647"],
  ["pointer-events", "none"],
  ["display", "block"],
  ["margin", "0"],
  ["width", "auto"],
  ["height", "auto"],
  ["border", "0"],
  ["padding", "0"],
  ["overflow", "visible"],
  ["background", "transparent"],
  ["color", "initial"],
];

export const createOverlayHost = () => {
  const host = document.createElement("div");
  host.id = OVERLAY_HOST_ID;
  HOST_STYLE_DECLARATIONS.forEach(([property, value]) =>
    host.style.setProperty(property, value, "important"),
  );
  return host;
};

const reinsertIntoTopLayer = (host) => {
  const focused = host.shadowRoot?.activeElement;
  host.hidePopover();
  host.showPopover();
  if (focused?.isConnected && host.shadowRoot?.activeElement !== focused) {
    focused.focus();
  }
};

export const promoteOverlayHost = (host) => {
  if (!host?.isConnected || typeof host.showPopover !== "function") return;
  try {
    host.setAttribute("popover", "manual");
    if (host.matches(":popover-open")) reinsertIntoTopLayer(host);
    else host.showPopover();
  } catch (error) {
    console.error(
      "QA Annotator: promoting the overlay host into the top layer failed.",
      error,
    );
    host.removeAttribute("popover");
  }
};
