import { buildOpeningTag } from "../lib/element-tag.js";
import { buildSelector } from "../lib/selector.js";

const MAX_TEXT_LENGTH = 120;

const siblingIndexOf = (element) => {
  const sameTagSiblings = Array.from(element.parentElement?.children ?? []).filter(
    (sibling) => sibling.tagName === element.tagName,
  );
  return sameTagSiblings.length < 2 ? null : sameTagSiblings.indexOf(element) + 1;
};

const toDescriptor = (element) => ({
  tagName: element.tagName.toLowerCase(),
  id: element.id || null,
  classList: Array.from(element.classList),
  testId: element.getAttribute("data-testid"),
  siblingIndex: siblingIndexOf(element),
  parent: null,
});

const buildDescriptorChain = (element) => {
  const leaf = toDescriptor(element);
  let descriptor = leaf;
  let current = element;
  while (current.parentElement) {
    current = current.parentElement;
    descriptor.parent = toDescriptor(current);
    descriptor = descriptor.parent;
  }
  return leaf;
};

const openingTagOf = (element) =>
  buildOpeningTag({
    tagName: element.tagName,
    attributes: Array.from(element.attributes, ({ name, value }) => ({
      name,
      value,
    })),
  });

const collapsedTextOf = (element) => {
  const text = element.textContent
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
  return text || null;
};

export const roundRect = ({ x, y, width, height }) => ({
  x: Math.round(x),
  y: Math.round(y),
  width: Math.round(width),
  height: Math.round(height),
});

export const describeElement = (element) => ({
  selector: buildSelector(buildDescriptorChain(element)),
  elementTag: openingTagOf(element),
  text: collapsedTextOf(element),
  rect: roundRect(element.getBoundingClientRect()),
});
