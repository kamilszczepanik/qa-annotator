import { formatSessionLabel, sessionIdFromLabel } from "../lib/report.js";
import { randomId } from "../lib/random-id.js";
import { describeElement } from "./metadata.js";

const SESSION_STORAGE_KEY = "qaSession";

const emptySession = () => ({
  sessionId: null,
  startedAt: null,
  startedAtLabel: null,
  annotations: [],
});

let session = emptySession();
const removedIds = new Set();

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const withAreas = ({
  kind,
  comment,
  selector,
  elementTag,
  text,
  rect,
  ...annotation
}) => {
  if (Array.isArray(annotation.areas) && annotation.areas.length > 0) {
    return annotation;
  }
  if (typeof comment !== "string" || !isPlainObject(rect)) return null;
  return {
    ...annotation,
    areas: [{ kind, comment, selector, elementTag, text, rect }],
  };
};

const usableAnnotations = (stored) =>
  stored.reduce((usable, entry) => {
    const annotation = isPlainObject(entry) ? withAreas(entry) : null;
    if (annotation) usable.push(annotation);
    else {
      console.error(
        "QA Annotator: dropped an unreadable stored annotation.",
        entry,
      );
    }
    return usable;
  }, []);

export const rectOfPick = (pick) =>
  pick.kind === "region" ? pick.rect : describeElement(pick.element).rect;

export const getSession = () => session;

const mergeAnnotations = ({ stored, current }) => {
  const merged = new Map(
    stored.map((annotation) => [annotation.id, annotation]),
  );
  current.forEach((annotation) => merged.set(annotation.id, annotation));
  removedIds.forEach((id) => merged.delete(id));
  return [...merged.values()].sort((left, right) => left.index - right.index);
};

const isStoredSession = (stored) =>
  Boolean(stored) && Array.isArray(stored.annotations);

const adoptStored = (stored) => {
  const base = isStoredSession(stored) ? stored : emptySession();
  session = {
    sessionId: base.sessionId ?? session.sessionId,
    startedAt: base.startedAt ?? session.startedAt,
    startedAtLabel: base.startedAtLabel ?? session.startedAtLabel,
    annotations: mergeAnnotations({
      stored: usableAnnotations(base.annotations),
      current: session.annotations,
    }),
  };
};

const readStored = async () => {
  const stored = await chrome.storage.local.get(SESSION_STORAGE_KEY);
  return stored[SESSION_STORAGE_KEY];
};

export const readStoredSession = async () => {
  adoptStored(await readStored());
};

export const persistSession = async () => {
  adoptStored(await readStored());
  await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: session });
};

export const clearSession = async () => {
  await chrome.storage.local.remove(SESSION_STORAGE_KEY);
  removedIds.clear();
  session = emptySession();
};

const nextIndex = (annotations) =>
  annotations.reduce(
    (highest, annotation) => Math.max(highest, annotation.index),
    0,
  ) + 1;

export const addAnnotation = ({ areas }) => {
  if (!session.sessionId) {
    const startedAt = new Date();
    const startedAtLabel = formatSessionLabel(startedAt);
    session = {
      sessionId: sessionIdFromLabel(startedAtLabel),
      startedAt: startedAt.toISOString(),
      startedAtLabel,
      annotations: [],
    };
  }
  const annotation = {
    id: randomId(),
    index: nextIndex(session.annotations),
    pageUrl: window.location.href,
    pageTitle: document.title,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
    },
    areas,
    screenshotFilename: null,
    capturedAt: new Date().toISOString(),
  };
  session.annotations.push(annotation);
  return annotation;
};

export const updateAnnotation = ({ id, changes }) => {
  const annotation = session.annotations.find(
    (candidate) => candidate.id === id,
  );
  if (annotation) Object.assign(annotation, changes);
  return annotation ?? null;
};

export const removeAnnotation = (id) => {
  removedIds.add(id);
  session.annotations = session.annotations.filter(
    (annotation) => annotation.id !== id,
  );
};
