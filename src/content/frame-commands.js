import { annotationsOnOrigin } from "../lib/page-origin.js";
import { sendToFrame } from "./frame-link.js";
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

export const finishAndCopy = async ({ comment = "", frame = null } = {}) => {
  const prompt = await finishSession({ comment });
  if (!prompt) return;
  if (frame && sendToFrame(frame, { type: "report", prompt })) return;
  await copyPromptFromPage(prompt);
};

const COMMANDS = {
  save: ({ command }) => saveIssue(command.comment),
  addArea: ({ command }) => addArea(command.comment),
  cancel: () => cancelIssue(),
  finish: ({ frame, command }) =>
    finishAndCopy({ comment: command.comment, frame }),
  delete: ({ command }) => deleteIssue(command.id),
  edit: ({ command }) =>
    editIssue({ id: command.id, comments: command.comments }),
  copied: () => noteCopied(),
  copy: ({ command }) => copyPromptFromPage(command.prompt),
};

export const runFrameCommand = async ({ frame, command }) => {
  try {
    await COMMANDS[command.type]?.({ frame, command });
  } catch (error) {
    console.error(`QA Annotator: the ${command.type} command failed.`, error);
  }
};

export const sessionSnapshot = () => {
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
