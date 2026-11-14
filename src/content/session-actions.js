import { editedAreas } from "../lib/issue-edit.js";
import { settleIssue } from "./issue-capture.js";
import { pushPanelState, sendToPanel } from "./panel-link.js";
import { exportReport } from "./session-export.js";
import {
  isFinishing,
  reportStorageFailure,
  setError,
  setFinishing,
  setStatus,
} from "./session-status.js";
import {
  clearSession,
  getSession,
  persistSession,
  readStoredSession,
  removeAnnotation,
  updateAnnotation,
} from "./session-store.js";

const CLIPBOARD_FAILURE_MESSAGE =
  "Could not copy the prompt to the clipboard. The report is still in the folder.";
const WRITING_REPORT_STATUS = "Writing report…";
const NOTHING_TO_EXPORT_MESSAGE = "No issues yet, nothing to export.";
const EDIT_REJECTED_MESSAGE = "Every area needs a comment.";

let savedTo = null;

const persistChange = async () => {
  try {
    await persistSession();
    pushPanelState();
  } catch (error) {
    reportStorageFailure("writing the session to storage failed.", error);
  }
};

export const loadSession = async () => {
  try {
    await readStoredSession();
    pushPanelState();
  } catch (error) {
    reportStorageFailure("reading the stored session failed.", error);
  }
};

export const deleteIssue = async (id) => {
  removeAnnotation(id);
  setError(null);
  await persistChange();
};

export const editIssue = async ({ id, comments }) => {
  const annotation = getSession().annotations.find(
    (candidate) => candidate.id === id,
  );
  const areas = editedAreas({ areas: annotation?.areas, comments });
  if (!areas) {
    setError(EDIT_REJECTED_MESSAGE);
    return;
  }
  updateAnnotation({ id, changes: { areas } });
  setError(null);
  await persistChange();
};

const writeReport = async (sessionId) => {
  let prompt = null;
  try {
    ({ prompt } = await exportReport());
  } catch (error) {
    console.error("QA Annotator: writing the report failed.", error);
    setStatus(null);
    setError(`Could not write the report: ${error?.message ?? String(error)}`);
    return;
  }

  try {
    await clearSession();
  } catch (error) {
    setStatus(null);
    reportStorageFailure("clearing the stored session failed.", error);
    return;
  }

  savedTo = `Saved to ~/Downloads/${sessionId}.`;
  setError(null);
  setStatus(savedTo);
  sendToPanel({ type: "report", prompt });
};

export const finishSession = async ({ comment = "" } = {}) => {
  if (isFinishing()) return;
  if (!(await settleIssue(comment))) return;
  const { annotations, sessionId } = getSession();
  if (annotations.length === 0) {
    setStatus(NOTHING_TO_EXPORT_MESSAGE);
    return;
  }

  setFinishing(true);
  setStatus(WRITING_REPORT_STATUS);
  try {
    await writeReport(sessionId);
  } finally {
    setFinishing(false);
  }
};

export const noteCopied = () => {
  if (savedTo) setStatus(`${savedTo} Prompt copied to the clipboard.`);
};

export const copyPromptFromPage = async (prompt) => {
  try {
    await navigator.clipboard.writeText(prompt);
    noteCopied();
  } catch (error) {
    console.error("QA Annotator: copying the prompt failed.", error);
    setError(CLIPBOARD_FAILURE_MESSAGE);
  }
};
