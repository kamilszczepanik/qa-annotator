const DEFAULT_AREA = {
  kind: "element",
  comment: "Save button is too small to tap on mobile",
  selector: "main > div.review-card:nth-of-type(2) > button.btn-primary",
  elementTag: '<button class="btn-primary px-2 py-1" data-testid="save-reply">',
  text: "Save",
  rect: { x: 24, y: 612, width: 88, height: 32 },
};

export const area = (overrides) => ({ ...DEFAULT_AREA, ...overrides });

export const annotation = ({
  kind = DEFAULT_AREA.kind,
  comment = DEFAULT_AREA.comment,
  selector = DEFAULT_AREA.selector,
  elementTag = DEFAULT_AREA.elementTag,
  text = DEFAULT_AREA.text,
  rect = DEFAULT_AREA.rect,
  ...overrides
} = {}) => ({
  id: "ann-1",
  index: 1,
  pageUrl: "http://localhost:3000/dashboard/reviews?filter=pending",
  pageTitle: "Reviews · Example Shop",
  viewport: { width: 390, height: 844, dpr: 3 },
  areas: [{ kind, comment, selector, elementTag, text, rect }],
  screenshotFilename: "01-save-button-too-small.png",
  capturedAt: "2026-09-07T14:35:00.000Z",
  ...overrides,
});
