import { offscreenAreaNumbers } from "../lib/geometry.js";
import { areaCountLabel } from "../lib/text.js";
import { closeCommentBox, showCommentBox } from "./comment-box.js";
import {
  bankArea,
  draftAreaCount,
  endDraft,
  hasWarnedOffscreen,
  markOffscreenWarned,
  resolveDraftAreas,
} from "./draft-issue.js";
import { setOverlayStatus } from "./overlay.js";
import {
  renderSessionList,
  reportListFailure,
  setListError,
  STORAGE_FAILURE_MESSAGE,
} from "./panel.js";
import { captureAnnotationScreenshot } from "./session-export.js";
import { addAnnotation, persistSession } from "./session-store.js";

const SCREENSHOT_FAILURE_MESSAGE = "Screenshot failed, issue saved without it.";
export const DRAFT_DISCARDED_MESSAGE = "Draft discarded.";

const bankedStatus = (count) =>
  `${areaCountLabel(count)} banked. Pick the next one, or ⌘↵ to save.`;

const offscreenWarning = (numbers) =>
  numbers.length === 1
    ? `Area ${numbers[0]} has scrolled out of view. Save again to keep it anyway.`
    : `Areas ${numbers.join(", ")} have scrolled out of view. Save again to keep them anyway.`;

const attachScreenshot = async ({ annotation, rects }) => {
  try {
    await captureAnnotationScreenshot({ annotation, rects });
    setListError(null);
    setOverlayStatus(null);
  } catch (error) {
    console.error("QA Annotator: capturing the screenshot failed.", error);
    setListError(SCREENSHOT_FAILURE_MESSAGE);
    setOverlayStatus(SCREENSHOT_FAILURE_MESSAGE);
  }

  try {
    await persistSession();
    renderSessionList();
  } catch (error) {
    reportListFailure("writing the session to storage failed.", error);
  }
};

const commitIssue = async ({ areas, saved }) => {
  const rects = areas.map((area) => area.rect);
  const offscreen = offscreenAreaNumbers({
    rects,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });
  if (offscreen.length > 0 && !hasWarnedOffscreen()) {
    markOffscreenWarned();
    return { failure: offscreenWarning(offscreen) };
  }
  const annotation = saved ?? addAnnotation({ areas });
  if (saved) saved.areas = areas;
  renderSessionList();

  try {
    await persistSession();
  } catch (error) {
    console.error(
      "QA Annotator: writing the session to storage failed.",
      error,
    );
    endDraft();
    return { failure: STORAGE_FAILURE_MESSAGE };
  }
  closeCommentBox();
  endDraft();
  await attachScreenshot({ annotation, rects });
  return { annotation };
};

export const saveBankedDraft = async () => {
  const { areas, failure } = resolveDraftAreas();
  if (failure) {
    setOverlayStatus(failure);
    return;
  }
  const result = await commitIssue({ areas });
  if (result.failure) setOverlayStatus(result.failure);
};

export const openCommentBox = (pick) => {
  let annotation = null;
  showCommentBox({
    pick,
    areaNumber: draftAreaCount() + 1,
    onAddArea: (comment) => {
      setOverlayStatus(bankedStatus(bankArea({ pick, comment })));
      return null;
    },
    onCancel: () => {
      if (endDraft()) setOverlayStatus(DRAFT_DISCARDED_MESSAGE);
    },
    onSave: async (comment) => {
      const { areas, failure } = resolveDraftAreas({ pick, comment });
      if (failure) return failure;
      const result = await commitIssue({ areas, saved: annotation });
      if (result.failure) return result.failure;
      annotation = result.annotation;
      return null;
    },
  });
};
