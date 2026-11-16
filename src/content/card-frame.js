import { FRAME_PAGES } from "../lib/frame-protocol.js";
import { placeCard } from "../lib/geometry.js";
import { createFrame, sendToFrame } from "./frame-link.js";
import { draftPlacementRects } from "./issue-capture.js";
import { promoteOverlayHost } from "./overlay-host.js";
import { getOverlayHost, getOverlayShadowRoot } from "./overlay.js";

const CARD_WIDTH_PX = 440;
const EDGE_MARGIN_PX = 12;
const DOCK_RESERVE_PX = 60;
const REVEAL_FALLBACK_MS = 700;
const PARKED_CLASS = "qa-frame--parked";

let card = null;
let cardHeight = 0;
let isShown = false;
let pickId = null;
let revealTimer = 0;
let pendingFocus = false;
let frameRequest = 0;
let isSized = false;
let isCapturing = false;

const cardWidth = () =>
  Math.min(CARD_WIDTH_PX, window.innerWidth - EDGE_MARGIN_PX * 2);

const place = () => {
  frameRequest = 0;
  if (!card || !isShown) return;
  const { anchor, avoid } = draftPlacementRects();
  if (!anchor) return;
  const width = cardWidth();
  const usableHeight = window.innerHeight - DOCK_RESERVE_PX;
  const height = Math.min(cardHeight, usableHeight - EDGE_MARGIN_PX * 2);
  const { left, top } = placeCard({
    anchor,
    avoid,
    size: { width, height },
    viewport: { width: window.innerWidth, height: usableHeight },
    margin: EDGE_MARGIN_PX,
  });
  card.style.width = `${width}px`;
  card.style.height = `${height}px`;
  card.style.left = `${Math.round(left)}px`;
  card.style.top = `${Math.round(top)}px`;
};

const schedulePlace = () => {
  if (!frameRequest) frameRequest = requestAnimationFrame(place);
};

const focusCard = () => {
  pendingFocus = false;
  card?.focus();
  sendToFrame("card", { type: "focus" });
};

const reveal = () => {
  clearTimeout(revealTimer);
  revealTimer = 0;
  if (!card || isShown) return;
  isShown = true;
  place();
  card.classList.remove(PARKED_CLASS);
  promoteOverlayHost({ host: getOverlayHost(), root: getOverlayShadowRoot() });
  window.addEventListener("scroll", schedulePlace, { capture: true, passive: true });
  window.addEventListener("resize", schedulePlace);
  if (pendingFocus) focusCard();
};

const park = () => {
  clearTimeout(revealTimer);
  revealTimer = 0;
  pendingFocus = false;
  if (!card || !isShown) return;
  isShown = false;
  card.classList.add(PARKED_CLASS);
  window.removeEventListener("scroll", schedulePlace, { capture: true });
  window.removeEventListener("resize", schedulePlace);
  card.blur();
};

export const createCardFrame = () => {
  card = createFrame({
    name: "card",
    path: FRAME_PAGES.card,
    title: "QA Annotator comment",
  });
  card.classList.add(PARKED_CLASS);
  card.style.width = `${cardWidth()}px`;
  return card;
};

const revealWhenReady = () => {
  if (revealTimer && isSized && !isCapturing) reveal();
};

export const setCardHeight = (height) => {
  cardHeight = Math.ceil(height);
  isSized = true;
  if (revealTimer) revealWhenReady();
  else place();
};

export const syncCard = (draft) => {
  if (!draft) {
    pickId = null;
    park();
    return;
  }
  const nextPickId = draft.current?.id ?? null;
  const isNewPick = nextPickId !== null && nextPickId !== pickId;
  pickId = nextPickId;
  isCapturing = Boolean(draft.current?.isCapturing);
  if (isNewPick) pendingFocus = true;
  if (!isShown) {
    if (!revealTimer) {
      isSized = false;
      revealTimer = setTimeout(reveal, REVEAL_FALLBACK_MS);
    }
    revealWhenReady();
    return;
  }
  if (isShown) {
    place();
    if (pendingFocus) focusCard();
  }
};

export const isCardComposing = () => isShown && pickId !== null;

export const refocusCard = () => {
  if (isShown) focusCard();
};

export const removeCardFrame = () => {
  park();
  if (frameRequest) cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  card = null;
  cardHeight = 0;
  pickId = null;
};
