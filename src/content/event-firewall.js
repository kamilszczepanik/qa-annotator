const HOST_BUBBLE_EVENTS = [
  "pointerdown",
  "pointerup",
  "pointermove",
  "pointerover",
  "pointerout",
  "pointerenter",
  "pointerleave",
  "pointercancel",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseover",
  "mouseout",
  "mouseenter",
  "mouseleave",
  "touchstart",
  "touchend",
  "touchmove",
  "touchcancel",
  "click",
  "dblclick",
  "auxclick",
  "contextmenu",
  "keydown",
  "keyup",
  "keypress",
  "input",
  "beforeinput",
  "compositionstart",
  "compositionupdate",
  "compositionend",
  "focusin",
  "focusout",
  "paste",
  "copy",
  "cut",
];

const RELATED_TARGET_EVENTS = [
  "focusout",
  "mouseout",
  "mouseleave",
  "mouseenter",
  "mouseover",
  "pointerout",
  "pointerleave",
  "pointerenter",
  "pointerover",
];

const KEYBOARD_EVENTS = ["keydown", "keyup", "keypress"];

let firewallHost = null;

const isEditable = (element) =>
  element instanceof HTMLElement &&
  (element.isContentEditable || element.matches("input, textarea, select"));

const stopEvent = (event) => {
  event.stopPropagation();
};

const stopWhenRelatedTargetIsHost = (event) => {
  if (event.relatedTarget !== firewallHost) return;
  event.stopPropagation();
};

const stopWhenTargetIsOutsideHost = (event) => {
  if (event.target === firewallHost) return;
  event.stopPropagation();
  if (isEditable(document.activeElement)) event.preventDefault();
};

export const stopEventFirewall = () => {
  if (!firewallHost) return;
  HOST_BUBBLE_EVENTS.forEach((type) =>
    firewallHost.removeEventListener(type, stopEvent),
  );
  RELATED_TARGET_EVENTS.forEach((type) =>
    window.removeEventListener(type, stopWhenRelatedTargetIsHost, true),
  );
  KEYBOARD_EVENTS.forEach((type) =>
    window.removeEventListener(type, stopWhenTargetIsOutsideHost, true),
  );
  firewallHost = null;
};

export const startEventFirewall = (host) => {
  if (!host) return;
  stopEventFirewall();
  firewallHost = host;
  HOST_BUBBLE_EVENTS.forEach((type) => host.addEventListener(type, stopEvent));
  RELATED_TARGET_EVENTS.forEach((type) =>
    window.addEventListener(type, stopWhenRelatedTargetIsHost, true),
  );
  KEYBOARD_EVENTS.forEach((type) =>
    window.addEventListener(type, stopWhenTargetIsOutsideHost, true),
  );
};
