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
