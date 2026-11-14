import { annotationsOnOrigin } from "../lib/page-origin.js";
import { closeCommentBox } from "./comment-box.js";
import { endDraft } from "./draft-issue.js";
import { getOverlayShadowRoot, setOverlayStatus } from "./overlay.js";
import { exportReport } from "./session-export.js";
import { renderSessionPanel } from "./session-list.js";
import {
  clearSession,
  getSession,
  persistSession,
  readStoredSession,
  removeAnnotation,
} from "./session-store.js";

export const STORAGE_FAILURE_MESSAGE =
  "Could not save to extension storage. The issue is still here, try again.";
const CLIPBOARD_FAILURE_MESSAGE =
  "Could not copy the prompt to the clipboard. The report is still in the folder.";
const WRITING_REPORT_STATUS = "Writing report…";
const NOTHING_TO_EXPORT_MESSAGE = "No issues yet, nothing to export.";

let listError = null;
let isFinishing = false;

export const renderSessionList = () => {
  const shadowRoot = getOverlayShadowRoot();
  if (!shadowRoot) return;
  renderSessionPanel({
    root: shadowRoot,
    annotations: annotationsOnOrigin({
      annotations: getSession().annotations,
      origin: window.location.origin,
    }),
    error: listError,
    isFinishing,
    onDelete: (id) => void deleteAnnotation(id),
    onFinish: () => void finishSession(),
  });
};

export const setListError = (message) => {
  listError = message;
  renderSessionList();
};

export const reportListFailure = (message, error) => {
  console.error(`QA Annotator: ${message}`, error);
  listError = STORAGE_FAILURE_MESSAGE;
  renderSessionList();
};

export const loadSession = async () => {
  try {
    await readStoredSession();
    renderSessionList();
  } catch (error) {
    reportListFailure("reading the stored session failed.", error);
  }
};

const deleteAnnotation = async (id) => {
  removeAnnotation(id);
  listError = null;
  renderSessionList();
  try {
    await persistSession();
  } catch (error) {
    reportListFailure("writing the session to storage failed.", error);
  }
};

const writeReport = async (sessionId) => {
  let clipboardCopied = false;
  try {
    ({ clipboardCopied } = await exportReport());
  } catch (error) {
    console.error("QA Annotator: writing the report failed.", error);
    setOverlayStatus(null);
    const reason = error?.message ?? String(error);
    listError = `Could not write the report: ${reason}`;
    return;
  }

  endDraft();
  try {
    await clearSession();
  } catch (error) {
    setOverlayStatus(null);
    reportListFailure("clearing the stored session failed.", error);
    return;
  }

  const savedTo = `Saved to ~/Downloads/${sessionId}`;
  setOverlayStatus(
    clipboardCopied ? `${savedTo}. Prompt copied to the clipboard.` : savedTo,
  );
  listError = clipboardCopied ? null : CLIPBOARD_FAILURE_MESSAGE;
};

export const finishSession = async () => {
  const { annotations, sessionId } = getSession();
  if (isFinishing) return;
  if (annotations.length === 0) {
    setOverlayStatus(NOTHING_TO_EXPORT_MESSAGE);
    return;
  }

  isFinishing = true;
  setOverlayStatus(WRITING_REPORT_STATUS);
  renderSessionList();
  try {
    await writeReport(sessionId);
  } finally {
    isFinishing = false;
    renderSessionList();
  }
};

export const closePanel = () => {
  closeCommentBox();
  listError = null;
  isFinishing = false;
};
