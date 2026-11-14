import { buildHandoffPrompt, buildReport, slugify } from "../lib/report.js";
import { firstLine, twoDigits } from "../lib/text.js";
import { captureWithHighlight, sendToWorker } from "./screenshot.js";
import { getSession, updateAnnotation } from "./session-store.js";

const REPORT_FILENAME = "report.md";

const screenshotNameOf = ({ index, areas }) =>
  `${twoDigits(index)}-${slugify(firstLine(areas[0].comment))}.png`;

const markdownDataUrl = (markdown) =>
  `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;

export const captureAnnotationScreenshot = async ({ annotation, rects }) => {
  const filename = screenshotNameOf(annotation);
  try {
    const dataUrl = await captureWithHighlight(rects);
    await sendToWorker({
      type: "DOWNLOAD",
      filename: `${getSession().sessionId}/${filename}`,
      dataUrl,
    });
    updateAnnotation({
      id: annotation.id,
      changes: { screenshotFilename: filename },
    });
  } catch (error) {
    updateAnnotation({
      id: annotation.id,
      changes: { screenshotFilename: null },
    });
    throw error;
  }
};

const resolveFolderPath = async ({ downloadId, sessionId }) => {
  try {
    const { folderPath } = await sendToWorker({
      type: "DOWNLOAD_FOLDER",
      downloadId,
    });
    if (folderPath) return folderPath;
  } catch (error) {
    console.error("QA Annotator: resolving the report folder failed.", error);
  }
  return `~/Downloads/${sessionId}`;
};

export const exportReport = async () => {
  const session = getSession();
  const { downloadId } = await sendToWorker({
    type: "DOWNLOAD",
    filename: `${session.sessionId}/${REPORT_FILENAME}`,
    dataUrl: markdownDataUrl(buildReport(session)),
  });

  const prompt = buildHandoffPrompt({
    folderPath: await resolveFolderPath({
      downloadId,
      sessionId: session.sessionId,
    }),
    issueCount: session.annotations.length,
  });
  return { prompt };
};
