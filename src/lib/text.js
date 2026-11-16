export const twoDigits = (value) => String(value).padStart(2, "0");

export const firstLine = (text) => text.split("\n")[0];

export const truncate = ({ text, maxLength }) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

export const issueCountLabel = (count) =>
  count === 1 ? "1 issue" : `${count} issues`;

const LINE_BREAKING_CHARACTERS = /[\p{Cc}\p{Zl}\p{Zp}]/gu;
const INVISIBLE_CHARACTERS = /[\p{Cf}\p{Co}\p{Cn}]/gu;

export const toSingleLine = (value) =>
  String(value)
    .replace(LINE_BREAKING_CHARACTERS, " ")
    .replace(INVISIBLE_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .trim();

export const otherSitesNote = (count) => {
  if (count <= 0) return "";
  return count === 1
    ? "1 more issue in this session is on another site."
    : `${count} more issues in this session are on other sites.`;
};
