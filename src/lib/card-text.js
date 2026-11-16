export const EMPTY_COMMENT_MESSAGE = "Type what is wrong before saving.";

const areaCount = (count) => (count === 1 ? "1 area" : `${count} areas`);

export const cardTitle = (draft) => {
  const banked = draft?.areas.length ?? 0;
  if (draft?.current && banked > 0) {
    return `Area ${draft.current.number} of this issue`;
  }
  if (banked > 0) return `Issue with ${areaCount(banked)}`;
  return "New issue";
};

export const commentPlaceholder = (current) =>
  current && current.number > 1
    ? `What is wrong in area ${current.number}?`
    : "What is wrong here?";

export const cardHint = (draft) =>
  draft && !draft.current && draft.areas.length > 0
    ? `Click or drag area ${draft.areas.length + 1} on the page, or save the issue with ${areaCount(draft.areas.length)}.`
    : "";
