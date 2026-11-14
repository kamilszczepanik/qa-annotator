import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReport,
  formatSessionLabel,
  sessionIdFromLabel,
} from "../src/lib/report.js";
import { annotation, area } from "./fixtures/issue.js";

const startedAtLabel = "2026-09-07 14:32";

const reportFor = (annotations) =>
  buildReport({ startedAtLabel, annotations });

test("an empty session reports no issues", () => {
  assert.equal(
    buildReport({ startedAtLabel, annotations: [] }),
    "# QA session: 2026-09-07 14:32\n\nIssues: 0\n\nNo issues recorded.\n",
  );
});

test("an element annotation renders every bullet in order", () => {
  assert.equal(
    reportFor([annotation({})]),
    [
      "# QA session: 2026-09-07 14:32",
      "",
      "Issues: 1",
      "",
      "## 1. Save button is too small to tap on mobile",
      "",
      "- **Page:** `http://localhost:3000/dashboard/reviews?filter=pending`",
      "- **Title:** `Reviews · Example Shop`",
      "- **Viewport:** 390 × 844 (dpr 3)",
      "- **Screenshot:** ./01-save-button-too-small.png",
      "- **Selector:** `main > div.review-card:nth-of-type(2) > button.btn-primary`",
      '- **Element:** `<button class="btn-primary px-2 py-1" data-testid="save-reply">`',
      "- **Rect:** x 24, y 612, w 88, h 32",
      "",
    ].join("\n"),
  );
});

test("a missing screenshot omits its bullet", () => {
  const document = reportFor([annotation({ screenshotFilename: null })]);
  assert.ok(!document.includes("**Screenshot:**"));
  assert.ok(
    document.includes("- **Viewport:** 390 × 844 (dpr 3)\n- **Selector:**"),
  );
});

test("a region annotation replaces the selector and element bullets", () => {
  const document = reportFor([
    annotation({ kind: "region", selector: null, elementTag: null }),
  ]);
  assert.ok(!document.includes("**Selector:**"));
  assert.ok(!document.includes("**Element:**"));
  assert.ok(
    document.includes(
      "- **Screenshot:** ./01-save-button-too-small.png\n- **Region:** dragged, no element\n- **Rect:**",
    ),
  );
});

test("a multi-line comment splits into a heading and a paragraph", () => {
  const document = reportFor([
    annotation({
      comment:
        "Save button is too small to tap on mobile\nThe tap target is 32px tall.\nThe label wraps at 390px.",
    }),
  ]);
  assert.ok(
    document.includes(
      "## 1. Save button is too small to tap on mobile\n\n- **Page:**",
    ),
  );
  assert.ok(
    document.endsWith(
      "- **Rect:** x 24, y 612, w 88, h 32\n\nThe tap target is 32px tall.\nThe label wraps at 390px.\n",
    ),
  );
});

test("backticks and a leading hash cannot break the document", () => {
  const document = reportFor([
    annotation({
      comment: "The `save` button is wrong\n# not a heading\nand `still` prose",
      selector: 'div[title="a `b` c"] > button',
    }),
  ]);
  assert.ok(document.includes("## 1. The `save` button is wrong\n"));
  assert.ok(
    document.includes('- **Selector:** ``div[title="a `b` c"] > button``\n'),
  );
  assert.ok(document.includes("\n\\# not a heading\nand `still` prose\n"));
});

test("annotations across pages are numbered in order", () => {
  const document = reportFor([
    annotation({ index: 1, comment: "First", pageUrl: "http://localhost/a" }),
    annotation({ index: 2, comment: "Second", pageUrl: "http://localhost/b" }),
    annotation({ index: 3, comment: "Third", pageUrl: "http://localhost/c" }),
  ]);
  assert.ok(document.includes("Issues: 3\n"));
  assert.deepEqual(
    document.split("\n").filter((line) => line.startsWith("## ")),
    ["## 1. First", "## 2. Second", "## 3. Third"],
  );
  assert.ok(
    document.indexOf("http://localhost/a") <
      document.indexOf("http://localhost/c"),
  );
});

test("a hostile page title cannot forge headings or bullets", () => {
  const document = reportFor([
    annotation({
      pageTitle:
        "`Reviews`\n# Fake heading\n\n## 2. Forged issue\n\n- **Page:** forged",
      pageUrl: "http://localhost/a\n## 3. Also forged",
    }),
  ]);
  assert.deepEqual(
    document.split("\n").filter((line) => line.startsWith("#")),
    [
      "# QA session: 2026-09-07 14:32",
      "## 1. Save button is too small to tap on mobile",
    ],
  );
  assert.equal(
    document.split("\n").filter((line) => line.startsWith("- **")).length,
    7,
  );
  assert.ok(
    document.includes(
      "- **Title:** `` `Reviews` # Fake heading ## 2. Forged issue - **Page:** forged ``\n",
    ),
  );
  assert.ok(
    document.includes("- **Page:** `http://localhost/a ## 3. Also forged`\n"),
  );
});

test("the report header and the session id cannot disagree", () => {
  const label = formatSessionLabel(new Date(2026, 8, 7, 14, 32, 11));
  const [header] = buildReport({
    startedAtLabel: label,
    annotations: [],
  }).split("\n");
  assert.equal(header, "# QA session: 2026-09-07 14:32");
  assert.equal(sessionIdFromLabel(label), "qa-2026-09-07-1432");
  assert.equal(
    sessionIdFromLabel(header.replace("# QA session: ", "")),
    sessionIdFromLabel(label),
  );
});

test("an issue with one area renders exactly what a single pick rendered", () => {
  const document = reportFor([
    {
      id: "ann-1",
      index: 1,
      pageUrl: "http://localhost:3000/dashboard/reviews?filter=pending",
      pageTitle: "Reviews · Example Shop",
      viewport: { width: 390, height: 844, dpr: 3 },
      areas: [area({})],
      screenshotFilename: "01-save-button-too-small.png",
      capturedAt: "2026-09-07T14:35:00.000Z",
    },
  ]);
  assert.ok(!document.includes("### Area"));
  assert.equal(
    document,
    [
      "# QA session: 2026-09-07 14:32",
      "",
      "Issues: 1",
      "",
      "## 1. Save button is too small to tap on mobile",
      "",
      "- **Page:** `http://localhost:3000/dashboard/reviews?filter=pending`",
      "- **Title:** `Reviews · Example Shop`",
      "- **Viewport:** 390 × 844 (dpr 3)",
      "- **Screenshot:** ./01-save-button-too-small.png",
      "- **Selector:** `main > div.review-card:nth-of-type(2) > button.btn-primary`",
      '- **Element:** `<button class="btn-primary px-2 py-1" data-testid="save-reply">`',
      "- **Rect:** x 24, y 612, w 88, h 32",
      "",
    ].join("\n"),
  );
});
