import { pushState } from "./frame-link.js";

export const STORAGE_FAILURE_MESSAGE =
  "Could not save to extension storage. The issue is still here, try again.";

let status = null;
let error = null;
let finishing = false;

export const setStatus = (message) => {
  status = message ?? null;
  pushState();
};

export const setError = (message) => {
  error = message ?? null;
  pushState();
};

export const reportStorageFailure = (message, cause) => {
  console.error(`QA Annotator: ${message}`, cause);
  setError(STORAGE_FAILURE_MESSAGE);
};

export const isFinishing = () => finishing;

export const setFinishing = (value) => {
  finishing = value;
  pushState();
};

export const statusSnapshot = () => ({ status, error, isFinishing: finishing });

export const resetStatus = () => {
  status = null;
  error = null;
  finishing = false;
};
