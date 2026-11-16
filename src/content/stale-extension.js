import { isExtensionAlive } from "../lib/extension-context.js";
import {
  exposesManifest,
  MANIFEST_PATH,
  manifestDrifted,
} from "../lib/manifest-drift.js";

export const STALE_EXTENSION_MESSAGE =
  "QA Annotator was updated. Open chrome://extensions, click the reload icon on QA Annotator, then reload this page.";
export const ORPHANED_PAGE_MESSAGE =
  "QA Annotator was reloaded. Reload this page to keep annotating.";

export const whileExtensionAlive =
  ({ handler, onOrphaned }) =>
  (...args) =>
    isExtensionAlive() ? handler(...args) : onOrphaned();

export const isLoadedExtensionStale = async () => {
  const loaded = chrome.runtime.getManifest();
  if (!exposesManifest(loaded)) return true;
  try {
    const response = await fetch(chrome.runtime.getURL(MANIFEST_PATH));
    return manifestDrifted({ onDisk: await response.json(), loaded });
  } catch (error) {
    console.error("QA Annotator: reading manifest.json failed.", error);
    return false;
  }
};
