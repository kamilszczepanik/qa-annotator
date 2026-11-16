const PORT_NAME_PREFIX = "qa-annotator-frame:";

export const FRAME_PAGES = {
  card: "src/frame/card.html",
  list: "src/frame/list.html",
};

export const framePortName = (nonce) => `${PORT_NAME_PREFIX}${nonce}`;

export const frameNonceOf = ({ port, extensionId }) => {
  const name = port?.name;
  if (!extensionId || port?.sender?.id !== extensionId) return null;
  if (typeof name !== "string" || !name.startsWith(PORT_NAME_PREFIX)) {
    return null;
  }
  return name.slice(PORT_NAME_PREFIX.length) || null;
};

const isText = (value) => typeof value === "string";

const COMMAND_SHAPES = {
  save: ({ comment }) => isText(comment),
  addArea: ({ comment }) => isText(comment),
  finish: ({ comment }) => isText(comment),
  cancel: () => true,
  close: () => true,
  delete: ({ id }) => isText(id),
  edit: ({ id, comments }) =>
    isText(id) && Array.isArray(comments) && comments.every(isText),
  copied: () => true,
  copy: ({ prompt }) => isText(prompt),
  size: ({ height }) => Number.isFinite(height) && height >= 0,
};

export const isFrameCommand = (message) =>
  typeof message === "object" &&
  message !== null &&
  Object.hasOwn(COMMAND_SHAPES, message.type) &&
  COMMAND_SHAPES[message.type](message);
