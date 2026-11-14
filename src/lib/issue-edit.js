export const editedAreas = ({ areas, comments }) => {
  if (!Array.isArray(areas) || !Array.isArray(comments)) return null;
  if (comments.length !== areas.length) return null;
  const trimmed = comments.map((comment) => String(comment).trim());
  if (trimmed.some((comment) => comment === "")) return null;
  return areas.map((area, position) => ({
    ...area,
    comment: trimmed[position],
  }));
};
