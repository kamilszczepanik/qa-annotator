const originOf = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

export const annotationsOnOrigin = ({ annotations, origin }) =>
  annotations.filter((annotation) => originOf(annotation.pageUrl) === origin);
