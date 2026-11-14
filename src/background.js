import { PANEL_PAGE_PATH } from "./lib/panel-protocol.js";

const RESTRICTED_URL_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "https://chrome.google.com/webstore",
  "about:",
  "edge://",
];

const BOOT_SCRIPT_PATH = "src/content/boot.js";

const isRestrictedUrl = (url) =>
  RESTRICTED_URL_PREFIXES.some((prefix) => (url ?? "").startsWith(prefix));

const logPanelFailure = (error) =>
  console.error("QA Annotator: opening the side panel failed.", error);

const openSidePanel = (tabId) => {
  chrome.sidePanel
    .setOptions({ tabId, path: PANEL_PAGE_PATH, enabled: true })
    .catch(logPanelFailure);
  chrome.sidePanel.open({ tabId }).catch(logPanelFailure);
};

const closeSidePanel = (tabId) =>
  chrome.sidePanel.setOptions({ tabId, enabled: false });

const toggleOnTab = async (tab) => {
  if (typeof tab?.id !== "number") {
    console.warn("QA Annotator: no active tab to toggle QA mode on.");
    return;
  }

  if (isRestrictedUrl(tab.url)) {
    console.warn(
      `QA Annotator: Chrome forbids extension scripts on ${tab.url}, so QA mode cannot start there.`,
    );
    return;
  }

  openSidePanel(tab.id);
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [BOOT_SCRIPT_PATH],
    });
  } catch (error) {
    console.error(`QA Annotator: injecting ${BOOT_SCRIPT_PATH} failed.`, error);
  }
};

const toggleOnActiveTab = async () => {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    await toggleOnTab(activeTab);
  } catch (error) {
    console.error("QA Annotator: resolving the active tab failed.", error);
  }
};

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "toggle-qa-mode") return;
  if (tab) void toggleOnTab(tab);
  else void toggleOnActiveTab();
});

chrome.action.onClicked.addListener((tab) => {
  void toggleOnTab(tab);
});

const CAPTURE_INTERVAL_MS = 600;

let captureQueue = Promise.resolve();
let lastCaptureStartedAt = 0;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const captureVisibleTab = async (windowId) => {
  const idleFor = lastCaptureStartedAt + CAPTURE_INTERVAL_MS - Date.now();
  if (idleFor > 0) await wait(idleFor);
  lastCaptureStartedAt = Date.now();
  return chrome.tabs.captureVisibleTab(windowId, { format: "png" });
};

const queueCapture = (windowId) => {
  const capture = captureQueue.then(
    () => captureVisibleTab(windowId),
    () => captureVisibleTab(windowId),
  );
  captureQueue = capture.catch(() => {});
  return capture;
};

const SESSION_FILE_PATTERN =
  /^qa-\d{4}-\d{2}-\d{2}-\d{4}\/(\d{2,}-[a-z0-9-]+\.png|report\.md)$/;

const isSafeDownloadPath = (filename) =>
  typeof filename === "string" && SESSION_FILE_PATTERN.test(filename);

const messageHandlers = {
  QA_MODE_OFF: async ({ sender }) => {
    await closeSidePanel(sender.tab.id);
    return { ok: true };
  },
  CAPTURE_VISIBLE_TAB: async ({ sender }) => ({
    ok: true,
    dataUrl: await queueCapture(sender.tab.windowId),
  }),
  DOWNLOAD: async ({ message: { filename, dataUrl } }) => {
    if (!isSafeDownloadPath(filename)) {
      throw new Error(`"${filename}" is not a filename Chrome will accept.`);
    }
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
      conflictAction: "uniquify",
    });
    return { ok: true, downloadId };
  },
  DOWNLOAD_FOLDER: async ({ message: { downloadId } }) => {
    if (typeof downloadId !== "number") {
      throw new Error(`"${downloadId}" is not a download id.`);
    }
    const [download] = await chrome.downloads.search({ id: downloadId });
    const localPath = download?.filename;
    if (!localPath) {
      throw new Error(`Download ${downloadId} has no local path yet.`);
    }
    return { ok: true, folderPath: localPath.replace(/[/\\][^/\\]*$/, "") };
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message?.type];
  if (!handler || sender?.id !== chrome.runtime.id || !sender.tab) return false;
  handler({ message, sender })
    .then(sendResponse)
    .catch((error) =>
      sendResponse({ ok: false, error: error?.message ?? String(error) }),
    );
  return true;
});
