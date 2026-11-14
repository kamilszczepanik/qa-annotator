export const whenTrusted = (handler) => (event) => {
  if (event?.isTrusted !== true) return;
  handler(event);
};
