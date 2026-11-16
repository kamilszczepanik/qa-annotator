import { pickLabel } from "../lib/pick-label.js";
import { randomId } from "../lib/random-id.js";
import { clearMarks, showMarks } from "./area-marks.js";
import {
  bankArea,
  bankedAreaViews,
  bankedViewportRects,
  draftAreaCount,
  draftAreaOf,
  endDraft,
  resolveDraftAreas,
  viewportRectOf,
} from "./draft-issue.js";
import { pushState } from "./frame-link.js";
import { captureThumbnail } from "./screenshot.js";
import { commitIssue } from "./issue-commit.js";
import { setStatus } from "./session-status.js";

const EMPTY_COMMENT_MESSAGE = "Add a comment before saving.";
export const DRAFT_DISCARDED_MESSAGE = "Draft discarded.";

let current = null;
let composeError = null;

export const hasIssueInProgress = () =>
  current !== null || draftAreaCount() > 0;

const markRects = () => [
  ...bankedViewportRects(),
  ...(current ? [viewportRectOf(current.area)] : []),
];

const refresh = () => {
  if (hasIssueInProgress()) showMarks(markRects);
  else clearMarks();
  pushState();
};

const fail = (message) => {
  composeError = message;
  pushState();
  return false;
};

const attachThumbnail = async (pending) => {
  try {
    const rect = viewportRectOf(pending.area);
    pending.thumbnail = rect ? await captureThumbnail(rect) : null;
  } catch (error) {
    console.error("QA Annotator: capturing the area thumbnail failed.", error);
  }
  pending.isCapturing = false;
  if (current === pending) pushState();
};

export const draftPlacementRects = () => {
  const rects = markRects().filter(Boolean);
  return { anchor: rects.at(-1) ?? null, avoid: rects.slice(0, -1) };
};

const labelOf = (pick) =>
  pick.kind === "region"
    ? pickLabel({ kind: "region", rect: pick.rect })
    : pickLabel({
        kind: "element",
        tagName: pick.element.tagName,
        id: pick.element.id,
        classList: Array.from(pick.element.classList),
      });

export const startIssue = (pick) => {
  current = {
    id: randomId(),
    label: labelOf(pick),
    pick,
    area: draftAreaOf({ pick, comment: "" }),
    thumbnail: null,
    isCapturing: true,
    annotation: current?.annotation ?? null,
  };
  composeError = null;
  refresh();
  void attachThumbnail(current);
};

export const saveIssue = async (comment) => {
  const text = comment.trim();
  if (!hasIssueInProgress()) return true;
  if (current && !text) return fail(EMPTY_COMMENT_MESSAGE);
  const { areas, failure } = resolveDraftAreas(
    current ? { pick: current.pick, comment: text } : undefined,
  );
  if (failure) return fail(failure);
  const result = await commitIssue({
    areas,
    saved: current?.annotation,
    onCommitted: () => {
      current = null;
      composeError = null;
      endDraft();
      setStatus(null);
      refresh();
    },
  });
  if (!result.failure) return true;
  if (current && result.annotation) current.annotation = result.annotation;
  return fail(result.failure);
};

export const addArea = (comment) => {
  const text = comment.trim();
  if (!current) return false;
  if (!text) return fail(EMPTY_COMMENT_MESSAGE);
  bankArea({
    pick: current.pick,
    comment: text,
    thumbnail: current.thumbnail,
  });
  current = null;
  composeError = null;
  setStatus(null);
  refresh();
  return true;
};

export const cancelIssue = () => {
  if (!hasIssueInProgress()) return false;
  const hadBanked = draftAreaCount() > 0;
  current = null;
  composeError = null;
  endDraft();
  setStatus(hadBanked ? DRAFT_DISCARDED_MESSAGE : null);
  refresh();
  return true;
};

export const settleIssue = async (comment) => {
  if (current && !comment.trim()) {
    current = null;
    composeError = null;
  }
  return saveIssue(comment);
};

export const resetIssue = () => {
  current = null;
  composeError = null;
  endDraft();
  clearMarks();
};

export const draftSnapshot = () => {
  if (!hasIssueInProgress()) return null;
  const areas = bankedAreaViews().map((view, position) => ({
    number: position + 1,
    ...view,
  }));
  return {
    areas,
    current: current
      ? {
          id: current.id,
          number: areas.length + 1,
          kind: current.pick.kind,
          label: current.label,
          thumbnail: current.thumbnail,
          isCapturing: current.isCapturing,
        }
      : null,
    error: composeError,
  };
};
