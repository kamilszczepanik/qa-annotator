export const OVERLAY_HOST_ID = "qa-annotator-root";
const STYLESHEET_PATHS = ["src/overlay.css"];
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

const reinsertIntoTopLayer = ({ host, root }) => {
  const focused = root?.activeElement;
  host.hidePopover();
  host.showPopover();
  if (focused?.isConnected && root?.activeElement !== focused) {
    focused.focus();
  }
};

export const promoteOverlayHost = ({ host, root }) => {
  if (!host?.isConnected || typeof host.showPopover !== "function") return;
  try {
    host.setAttribute("popover", "manual");
    if (host.matches(":popover-open")) reinsertIntoTopLayer({ host, root });
    else host.showPopover();
  } catch (error) {
    console.error(
      "QA Annotator: promoting the overlay host into the top layer failed.",
      error,
    );
    host.removeAttribute("popover");
  }
};

export const readOverlayCss = async () => {
  const stylesheets = await Promise.all(
    STYLESHEET_PATHS.map(async (path) => {
      const response = await fetch(chrome.runtime.getURL(path));
      return response.text();
    }),
  );
  return stylesheets.join("\n");
};
