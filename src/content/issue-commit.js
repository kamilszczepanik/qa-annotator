import { offscreenAreaNumbers } from "../lib/geometry.js";
import { hasWarnedOffscreen, markOffscreenWarned } from "./draft-issue.js";
import { pushPanelState } from "./panel-link.js";
import { captureAnnotationScreenshot } from "./session-export.js";
import {
  reportStorageFailure,
  setError,
  STORAGE_FAILURE_MESSAGE,
} from "./session-status.js";
import { addAnnotation, persistSession } from "./session-store.js";

const SCREENSHOT_FAILURE_MESSAGE = "Screenshot failed, issue saved without it.";

const offscreenWarning = (numbers) =>
  numbers.length === 1
    ? `Area ${numbers[0]} has scrolled out of view. Save again to keep it anyway.`
    : `Areas ${numbers.join(", ")} have scrolled out of view. Save again to keep them anyway.`;

const attachScreenshot = async ({ annotation, rects }) => {
  try {
    await captureAnnotationScreenshot({ annotation, rects });
    setError(null);
  } catch (error) {
    console.error("QA Annotator: capturing the screenshot failed.", error);
    setError(SCREENSHOT_FAILURE_MESSAGE);
  }
  try {
    await persistSession();
    pushPanelState();
  } catch (error) {
    reportStorageFailure("writing the session to storage failed.", error);
  }
};

export const commitIssue = async ({ areas, saved, onCommitted }) => {
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
  try {
    await persistSession();
  } catch (error) {
    console.error(
      "QA Annotator: writing the session to storage failed.",
      error,
    );
    return { failure: STORAGE_FAILURE_MESSAGE, annotation };
  }
  onCommitted();
  await attachScreenshot({ annotation, rects });
  return { annotation };
};

