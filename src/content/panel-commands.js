import { annotationsOnOrigin } from "../lib/page-origin.js";
import {
  addArea,
  cancelIssue,
  draftSnapshot,
  saveIssue,
} from "./issue-capture.js";
import {
  copyPromptFromPage,
  deleteIssue,
  editIssue,
  finishSession,
  noteCopied,
} from "./session-actions.js";
import { statusSnapshot } from "./session-status.js";
import { getSession } from "./session-store.js";

const COMMANDS = {
  save: ({ comment }) => saveIssue(comment),
  addArea: ({ comment }) => addArea(comment),
  cancel: () => cancelIssue(),
  finish: ({ comment }) => finishSession({ comment }),
  delete: ({ id }) => deleteIssue(id),
  edit: ({ id, comments }) => editIssue({ id, comments }),
  copied: () => noteCopied(),
  copy: ({ prompt }) => copyPromptFromPage(prompt),
};

export const runPanelCommand = async (command) => {
  try {
    await COMMANDS[command.type](command);
  } catch (error) {
    console.error(`QA Annotator: the ${command.type} command failed.`, error);
  }
};

export const panelSnapshot = () => {
  const { annotations } = getSession();
  return {
    draft: draftSnapshot(),
    issues: annotationsOnOrigin({
      annotations,
      origin: window.location.origin,
    }).map(({ id, areas }) => ({
      id,
      comments: areas.map((area) => area.comment),
    })),
    sessionIssueCount: annotations.length,
    ...statusSnapshot(),
  };
};
