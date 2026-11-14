import { toSingleLine } from "./text.js";
import { scopeUrl } from "./url-scope.js";

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

const scopeAttribute = ({ name, value, baseUrl }) =>
  name === "href" ? scopeUrl({ value, baseUrl }) : value;

const cleanAttributeValue = (value) =>
  toSingleLine(value)
    .slice(0, MAX_ATTRIBUTE_VALUE_LENGTH)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");

export const buildOpeningTag = ({ tagName, attributes, baseUrl }) => {
  const kept = attributes
    .map(({ name, value }) => ({ name: name.toLowerCase(), value }))
    .filter(({ name }) => ALLOWED_ATTRIBUTES.includes(name))
    .map(({ name, value }) => ({
      name,
      value: scopeAttribute({ name, value, baseUrl }),
    }))
    .filter(({ value }) => value !== null)
    .map(({ name, value }) => ` ${name}="${cleanAttributeValue(value)}"`)
    .join("");
  return `<${tagName.toLowerCase()}${kept}>`;
};
