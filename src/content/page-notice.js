import { getOverlayShadowRoot } from "./overlay.js";

let noticeTimer = 0;

export const setNotice = (message) => {
  clearTimeout(noticeTimer);
  const notice = getOverlayShadowRoot()?.querySelector(".qa-notice");
  if (!notice) return;
  notice.textContent = message ?? "";
  notice.hidden = !message;
};

export const flashNotice = (message, visibleMs) => {
  setNotice(message);
  noticeTimer = setTimeout(() => setNotice(null), visibleMs);
};

export const createNotice = () => {
  const notice = document.createElement("p");
  notice.className = "qa-notice";
  notice.setAttribute("role", "status");
  notice.hidden = true;
  return notice;
};
