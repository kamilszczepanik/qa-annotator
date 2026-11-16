export const isRectOffscreen = ({ rect, viewport }) =>
  rect.x + rect.width <= 0 ||
  rect.y + rect.height <= 0 ||
  rect.x >= viewport.width ||
  rect.y >= viewport.height;

export const offscreenAreaNumbers = ({ rects, viewport }) =>
  rects
    .map((rect, position) =>
      isRectOffscreen({ rect, viewport }) ? position + 1 : null,
    )
    .filter((number) => number !== null);

const clamp = ({ value, min, max }) => Math.min(Math.max(value, min), max);

const cropSpan = ({ start, length, wanted, scale, limit }) => {
  const size = Math.min(wanted * scale, limit);
  const center = (start + length / 2) * scale;
  const from = clamp({ value: center - size / 2, min: 0, max: limit - size });
  return { from: Math.round(from), size: Math.max(1, Math.round(size)) };
};

const wantedSize = ({ rect, padding, minSize, aspectRatio }) => {
  const width = Math.max(rect.width + padding * 2, minSize.width);
  const height = Math.max(rect.height + padding * 2, minSize.height);
  if (!aspectRatio) return { width, height };
  return width / height > aspectRatio
    ? { width, height: width / aspectRatio }
    : { width: height * aspectRatio, height };
};

export const cropBox = ({
  rect,
  padding,
  minSize = { width: 0, height: 0 },
  aspectRatio = null,
  scale,
  imageWidth,
  imageHeight,
}) => {
  const wanted = wantedSize({ rect, padding, minSize, aspectRatio });
  const horizontal = cropSpan({
    start: rect.x,
    length: rect.width,
    wanted: wanted.width,
    scale,
    limit: imageWidth,
  });
  const vertical = cropSpan({
    start: rect.y,
    length: rect.height,
    wanted: wanted.height,
    scale,
    limit: imageHeight,
  });
  return {
    x: horizontal.from,
    y: vertical.from,
    width: horizontal.size,
    height: vertical.size,
  };
};

const fitsWithin = ({ start, size, limit, margin }) =>
  start >= margin && start + size <= limit - margin;

const clampInto = ({ start, size, limit, margin }) =>
  clamp({
    value: start,
    min: margin,
    max: Math.max(margin, limit - margin - size),
  });

const overlaps = (a, b) =>
  a.left < b.x + b.width &&
  b.x < a.left + a.width &&
  a.top < b.y + b.height &&
  b.y < a.top + a.height;

const candidatesFor = ({ anchor, size, viewport, gap, margin }) => {
  const horizontal = { size: size.width, limit: viewport.width, margin };
  const vertical = { size: size.height, limit: viewport.height, margin };
  const alignedTop = clampInto({ start: anchor.y, ...vertical });
  const alignedLeft = clampInto({ start: anchor.x, ...horizontal });
  const right = anchor.x + anchor.width + gap;
  const below = anchor.y + anchor.height + gap;
  const left = anchor.x - gap - size.width;
  const above = anchor.y - gap - size.height;
  const sides = [
    { side: "right", left: right, top: alignedTop, axis: horizontal, start: right },
    { side: "below", left: alignedLeft, top: below, axis: vertical, start: below },
    { side: "left", left, top: alignedTop, axis: horizontal, start: left },
    { side: "above", left: alignedLeft, top: above, axis: vertical, start: above },
  ];
  return sides.filter(({ axis, start }) => fitsWithin({ start, ...axis }));
};

export const placeCard = ({
  anchor,
  size,
  viewport,
  avoid = [],
  gap = 12,
  margin = 12,
}) => {
  const candidates = candidatesFor({ anchor, size, viewport, gap, margin });
  const isClear = ({ left, top }) =>
    !avoid.some((rect) =>
      overlaps({ left, top, width: size.width, height: size.height }, rect),
    );
  const chosen = candidates.find(isClear) ?? candidates[0];
  if (chosen) return { side: chosen.side, left: chosen.left, top: chosen.top };
  const fallbackLeft = clampInto({
    start: viewport.width,
    size: size.width,
    limit: viewport.width,
    margin,
  });
  return { side: "inside", left: fallbackLeft, top: margin };
};
