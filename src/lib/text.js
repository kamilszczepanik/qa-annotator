export const twoDigits = (value) => String(value).padStart(2, "0");

export const firstLine = (text) => text.split("\n")[0];

export const truncate = ({ text, maxLength }) =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;

export const issueCountLabel = (count) =>
  count === 1 ? "1 issue" : `${count} issues`;

export const areaCountLabel = (count) =>
  count === 1 ? "1 area" : `${count} areas`;

const UNSAFE_CHARACTERS = /[\p{Cc}​-‏‪-‮⁦-⁩]/gu;

export const toSingleLine = (value) =>
  String(value).replace(UNSAFE_CHARACTERS, " ").replace(/\s+/g, " ").trim();
