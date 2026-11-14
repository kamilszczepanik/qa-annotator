import { getOverlayShadowRoot } from "./overlay.js";

const BADGE_ROOM_PX = 24;

let layer = null;
let rectsOf = null;
let frame = 0;

const createMark = ({ rect, number }) => {
  const mark = document.createElement("div");
  mark.className = "qa-mark";
  mark.style.left = `${rect.x}px`;
  mark.style.top = `${rect.y}px`;
  mark.style.width = `${rect.width}px`;
  mark.style.height = `${rect.height}px`;

  mark.classList.toggle("qa-mark--badge-inside", rect.y < BADGE_ROOM_PX);
  const badge = document.createElement("span");
  badge.className = "qa-mark-badge";
  badge.textContent = String(number);
  mark.append(badge);
  return mark;
};

const render = () => {
  frame = 0;
  if (!layer || !rectsOf) return;
  layer.replaceChildren(
    ...rectsOf().flatMap((rect, position) =>
      rect ? [createMark({ rect, number: position + 1 })] : [],
    ),
  );
};

const scheduleRender = () => {
  if (!frame) frame = requestAnimationFrame(render);
};

export const showMarks = (getRects) => {
  const root = getOverlayShadowRoot();
  if (!root) return;
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "qa-marks";
    root.append(layer);
    window.addEventListener("scroll", scheduleRender, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", scheduleRender);
  }
  rectsOf = getRects;
  render();
};

export const clearMarks = () => {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  window.removeEventListener("scroll", scheduleRender, { capture: true });
  window.removeEventListener("resize", scheduleRender);
  layer?.remove();
  layer = null;
  rectsOf = null;
};
