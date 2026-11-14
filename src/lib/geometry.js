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
