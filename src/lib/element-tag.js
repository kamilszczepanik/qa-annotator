import { toSingleLine } from "./text.js";

export const ALLOWED_ATTRIBUTES = [
  "id",
  "class",
  "data-testid",
  "role",
  "aria-label",
  "name",
  "type",
  "href",
];
export const MAX_ATTRIBUTE_VALUE_LENGTH = 200;

const withoutQueryOrFragment = (url) => url.split(/[?#]/)[0];

const cleanAttributeValue = ({ name, value }) => {
  const scoped = name === "href" ? withoutQueryOrFragment(value) : value;
  return toSingleLine(scoped)
    .slice(0, MAX_ATTRIBUTE_VALUE_LENGTH)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
};

export const buildOpeningTag = ({ tagName, attributes }) => {
  const kept = attributes
    .map(({ name, value }) => ({ name: name.toLowerCase(), value }))
    .filter(({ name }) => ALLOWED_ATTRIBUTES.includes(name))
    .map((attribute) => ` ${attribute.name}="${cleanAttributeValue(attribute)}"`)
    .join("");
  return `<${tagName.toLowerCase()}${kept}>`;
};
