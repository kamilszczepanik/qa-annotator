const GENERATED_PREFIX = /^(css-|sc-|jsx-|_)/;
const HEX_RUN = /[0-9a-f]{6,}/i;
const SELECTOR_BREAKING = /[[:/]/;
const ROOT_TAGS = ["body", "html"];
const MAX_LEVELS = 8;

const isStableClass = (className) =>
  !GENERATED_PREFIX.test(className) &&
  !HEX_RUN.test(className) &&
  !SELECTOR_BREAKING.test(className);

const describeNode = ({ tagName, id, classList, testId, siblingIndex }) => {
  if (id) return { part: `#${id}`, anchored: true };
  if (testId) return { part: `[data-testid="${testId}"]`, anchored: true };
  const stableClass = classList.find(isStableClass);
  const nth = siblingIndex === null ? "" : `:nth-of-type(${siblingIndex})`;
  return {
    part: `${tagName}${stableClass ? `.${stableClass}` : ""}${nth}`,
    anchored: false,
  };
};

export const buildSelector = (node) => {
  if (ROOT_TAGS.includes(node.tagName)) return node.tagName;
  const parts = [];
  let current = node;
  while (
    current &&
    !ROOT_TAGS.includes(current.tagName) &&
    parts.length < MAX_LEVELS
  ) {
    const { part, anchored } = describeNode(current);
    parts.unshift(part);
    if (anchored) break;
    current = current.parent;
  }
  return parts.join(" > ");
};
