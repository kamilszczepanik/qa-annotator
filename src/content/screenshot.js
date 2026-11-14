import { getOverlayHost } from "./overlay.js";

let captureQueue = Promise.resolve();

const HIGHLIGHT_COLOR = "#ff2d55";
const HIGHLIGHT_WIDTH_PX = 3;
const BADGE_TEXT_COLOR = "#ffffff";
const BADGE_FONT_PX = 12;
const BADGE_PADDING_X_PX = 7;
const BADGE_PADDING_Y_PX = 4;
const BADGE_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const sendToWorker = async (message) => {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) {
    throw new Error(response?.error ?? "The extension worker did not answer.");
  }
  return response;
};

const afterTwoFrames = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );

const dataUrlToBlob = (dataUrl) => {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: "image/png" });
};

const drawBadge = ({ context, rect, number, scale, canvasWidth }) => {
  const label = String(number);
  const fontSize = BADGE_FONT_PX * scale;
  context.font = `700 ${fontSize}px ${BADGE_FONT_STACK}`;
  context.textAlign = "left";
  context.textBaseline = "top";

  const paddingX = BADGE_PADDING_X_PX * scale;
  const paddingY = BADGE_PADDING_Y_PX * scale;
  const width = context.measureText(label).width + paddingX * 2;
  const height = fontSize + paddingY * 2;
  const top = rect.y * scale;
  const badgeTop = Math.max(0, top - height < 0 ? top : top - height);
  const badgeLeft = Math.min(
    Math.max(0, rect.x * scale),
    Math.max(0, canvasWidth - width),
  );

  context.fillStyle = HIGHLIGHT_COLOR;
  context.fillRect(badgeLeft, badgeTop, width, height);
  context.fillStyle = BADGE_TEXT_COLOR;
  context.fillText(label, badgeLeft + paddingX, badgeTop + paddingY);
};

const drawHighlight = async ({ frameDataUrl, rects }) => {
  const bitmap = await createImageBitmap(dataUrlToBlob(frameDataUrl));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const scale = canvas.width / window.innerWidth;
  context.strokeStyle = HIGHLIGHT_COLOR;
  context.lineWidth = HIGHLIGHT_WIDTH_PX * scale;
  const shouldDrawBadges = rects.length > 1;
  rects.forEach((rect, position) => {
    context.strokeRect(
      rect.x * scale,
      rect.y * scale,
      rect.width * scale,
      rect.height * scale,
    );
    if (!shouldDrawBadges) return;
    drawBadge({
      context,
      rect,
      number: position + 1,
      scale,
      canvasWidth: canvas.width,
    });
  });
  return canvas.toDataURL("image/png");
};

const captureHidden = async (rects) => {
  const host = getOverlayHost();
  if (host) host.style.setProperty("opacity", "0", "important");
  try {
    await afterTwoFrames();
    const { dataUrl } = await sendToWorker({ type: "CAPTURE_VISIBLE_TAB" });
    return await drawHighlight({ frameDataUrl: dataUrl, rects });
  } finally {
    if (host) host.style.removeProperty("opacity");
  }
};

export const captureWithHighlight = (rects) => {
  const capture = captureQueue.then(
    () => captureHidden(rects),
    () => captureHidden(rects),
  );
  captureQueue = capture.catch(() => {});
  return capture;
};
