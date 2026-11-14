(async () => {
  const module = await import(chrome.runtime.getURL("src/content/overlay.js"));
  module.toggleQaMode();
})();
