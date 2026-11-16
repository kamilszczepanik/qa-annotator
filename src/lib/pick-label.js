import { toSingleLine, truncate } from "./text.js";

const MAX_LABEL_LENGTH = 48;
const CSS_IDENTIFIER = /^-?[A-Za-z_][\w-]*$/;

const shortName = ({ tagName, id, classList }) => {
  const tag = String(tagName).toLowerCase();
  if (id && CSS_IDENTIFIER.test(id)) return `${tag}#${id}`;
  const className = classList.find((name) => CSS_IDENTIFIER.test(name));
  return className ? `${tag}.${className}` : tag;
};

export const pickLabel = (pick) => {
  if (pick.kind === "region") {
    const { width, height } = pick.rect;
    return `Area ${Math.round(width)} × ${Math.round(height)} px`;
  }
  return truncate({
    text: toSingleLine(shortName(pick)),
    maxLength: MAX_LABEL_LENGTH,
  });
};
