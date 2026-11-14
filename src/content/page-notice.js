import { getOverlayShadowRoot } from "./overlay.js";

const TIP_VISIBLE_MS = 4000;

let tipTimer = 0;

export const setNotice = (message) => {
  clearTimeout(tipTimer);
  const notice = getOverlayShadowRoot()?.querySelector(".qa-notice");
  if (!notice) return;
  notice.textContent = message ?? "";
  notice.hidden = !message;
};

export const flashTip = (message) => {
  setNotice(message);
  tipTimer = setTimeout(() => setNotice(null), TIP_VISIBLE_MS);
};

export const createNotice = () => {
  const notice = document.createElement("p");
  notice.className = "qa-notice";
  notice.setAttribute("role", "status");
  notice.hidden = true;
  return notice;
};
