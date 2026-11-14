import { describeElement, roundRect } from "./metadata.js";

let bankedAreas = [];
let offscreenWarned = false;

const toPageRect = ({ x, y, width, height }) => ({
  x: x + window.scrollX,
  y: y + window.scrollY,
  width,
  height,
});

const toViewportRect = ({ x, y, width, height }) =>
  roundRect({
    x: x - window.scrollX,
    y: y - window.scrollY,
    width,
    height,
  });

export const draftAreaOf = ({ pick, comment, thumbnail = null }) => {
  const picked = { comment, thumbnail, pageUrl: window.location.href };
  return pick.kind === "region"
    ? { ...picked, kind: "region", pageRect: toPageRect(pick.rect) }
    : { ...picked, kind: "element", element: pick.element };
};

const resolveArea = ({ kind, comment, element, pageRect }) =>
  kind === "region"
    ? {
        kind,
        comment,
        selector: null,
        elementTag: null,
        text: null,
        rect: toViewportRect(pageRect),
      }
    : { kind, comment, ...describeElement(element) };

const draftFailure = (draft) => {
  const currentUrl = window.location.href;
  const moved = draft.findIndex((area) => area.pageUrl !== currentUrl);
  if (moved !== -1) {
    return `The page changed since area ${moved + 1} was picked. Esc twice to start over.`;
  }
  const gone = draft.findIndex(
    (area) => area.kind === "element" && !area.element.isConnected,
  );
  if (gone !== -1) {
    return `Area ${gone + 1} is gone from the page. Esc twice to start over.`;
  }
  return null;
};

export const bankArea = ({ pick, comment, thumbnail }) => {
  bankedAreas.push(draftAreaOf({ pick, comment, thumbnail }));
  return bankedAreas.length;
};

export const bankedAreaViews = () =>
  bankedAreas.map(({ comment, thumbnail }) => ({ comment, thumbnail }));

export const viewportRectOf = (area) => {
  if (area.kind === "region") return toViewportRect(area.pageRect);
  return area.element.isConnected
    ? roundRect(area.element.getBoundingClientRect())
    : null;
};

export const bankedViewportRects = () => bankedAreas.map(viewportRectOf);

export const draftAreaCount = () => bankedAreas.length;

export const endDraft = () => {
  const hadAreas = bankedAreas.length > 0;
  bankedAreas = [];
  offscreenWarned = false;
  return hadAreas;
};

export const resolveDraftAreas = (current) => {
  const draft = current
    ? [...bankedAreas, draftAreaOf(current)]
    : [...bankedAreas];
  const failure = draftFailure(draft);
  return failure ? { failure } : { areas: draft.map(resolveArea) };
};

export const hasWarnedOffscreen = () => offscreenWarned;

export const markOffscreenWarned = () => {
  offscreenWarned = true;
};
