import { isCommentBoxOpen } from "./comment-box.js";
import { describeElement, roundRect } from "./metadata.js";
import {
  getOverlayHost,
  getOverlayShadowRoot,
  setOverlayPointerEvents,
} from "./overlay.js";

const DRAG_THRESHOLD_PX = 6;

let pickHandler = null;
let captureLayer = null;
let highlightBox = null;
let highlightLabel = null;
let hoveredElement = null;
let dragOrigin = null;
let isDragging = false;
let shouldIgnoreNextClick = false;

const positionBox = (box, { x, y, width, height }) => {
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
};

const hideHighlight = () => {
  hoveredElement = null;
  highlightBox.hidden = true;
  highlightBox.classList.remove("qa-highlight--region");
};

const elementUnderCursor = (clientX, clientY) => {
  const host = getOverlayHost();
  return (
    document
      .elementsFromPoint(clientX, clientY)
      .find(
        (element) => element !== host && element !== document.documentElement,
      ) ?? null
  );
};

const rectBetween = (origin, event) =>
  roundRect({
    x: Math.min(origin.x, event.clientX),
    y: Math.min(origin.y, event.clientY),
    width: Math.abs(event.clientX - origin.x),
    height: Math.abs(event.clientY - origin.y),
  });

const hasPassedThreshold = (origin, event) =>
  Math.abs(event.clientX - origin.x) > DRAG_THRESHOLD_PX ||
  Math.abs(event.clientY - origin.y) > DRAG_THRESHOLD_PX;

const showElementHighlight = (element) => {
  const { selector, rect } = describeElement(element);
  positionBox(highlightBox, rect);
  highlightLabel.textContent = `${element.tagName.toLowerCase()} · ${selector}`;
  highlightLabel.hidden = false;
  highlightBox.hidden = false;
};

const showRegionHighlight = (rect) => {
  highlightBox.classList.add("qa-highlight--region");
  highlightLabel.hidden = true;
  positionBox(highlightBox, rect);
  highlightBox.hidden = false;
};

const handlePointerMove = (event) => {
  if (isCommentBoxOpen()) return;

  if (dragOrigin) {
    if (!isDragging && !hasPassedThreshold(dragOrigin, event)) return;
    isDragging = true;
    showRegionHighlight(rectBetween(dragOrigin, event));
    return;
  }

  const element = elementUnderCursor(event.clientX, event.clientY);
  if (!element) {
    hideHighlight();
    return;
  }
  if (element === hoveredElement) return;
  hoveredElement = element;
  showElementHighlight(element);
};

const handlePointerDown = (event) => {
  if (event.button !== 0 || isCommentBoxOpen()) return;
  captureLayer.setPointerCapture(event.pointerId);
  dragOrigin = { x: event.clientX, y: event.clientY };
};

const handlePointerUp = (event) => {
  if (!dragOrigin) return;
  const origin = dragOrigin;
  const wasDragging = isDragging;
  dragOrigin = null;
  isDragging = false;
  if (!wasDragging) return;
  shouldIgnoreNextClick = true;
  hideHighlight();
  pickHandler({ kind: "region", rect: rectBetween(origin, event) });
};

const handleClick = (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (shouldIgnoreNextClick) {
    shouldIgnoreNextClick = false;
    return;
  }
  if (isCommentBoxOpen()) return;
  const element = elementUnderCursor(event.clientX, event.clientY);
  if (!element) return;
  hideHighlight();
  pickHandler({ kind: "element", element });
};

export const cancelDrag = () => {
  if (!dragOrigin) return false;
  dragOrigin = null;
  isDragging = false;
  shouldIgnoreNextClick = true;
  hideHighlight();
  return true;
};

export const startPicking = ({ onPicked }) => {
  const shadowRoot = getOverlayShadowRoot();
  if (!shadowRoot) return;

  pickHandler = onPicked;
  setOverlayPointerEvents("auto");

  captureLayer = document.createElement("div");
  captureLayer.className = "qa-capture-layer";

  highlightBox = document.createElement("div");
  highlightBox.className = "qa-highlight";
  highlightBox.hidden = true;

  highlightLabel = document.createElement("span");
  highlightLabel.className = "qa-highlight-label";
  highlightBox.append(highlightLabel);

  captureLayer.addEventListener("pointermove", handlePointerMove);
  captureLayer.addEventListener("pointerdown", handlePointerDown);
  captureLayer.addEventListener("pointerup", handlePointerUp);
  captureLayer.addEventListener("pointercancel", cancelDrag);
  captureLayer.addEventListener("click", handleClick);

  shadowRoot.append(captureLayer, highlightBox);
};

export const stopPicking = () => {
  captureLayer?.removeEventListener("pointermove", handlePointerMove);
  captureLayer?.removeEventListener("pointerdown", handlePointerDown);
  captureLayer?.removeEventListener("pointerup", handlePointerUp);
  captureLayer?.removeEventListener("pointercancel", cancelDrag);
  captureLayer?.removeEventListener("click", handleClick);
  captureLayer?.remove();
  highlightBox?.remove();

  setOverlayPointerEvents("none");

  captureLayer = null;
  highlightBox = null;
  highlightLabel = null;
  hoveredElement = null;
  pickHandler = null;
  dragOrigin = null;
  isDragging = false;
  shouldIgnoreNextClick = false;
};
