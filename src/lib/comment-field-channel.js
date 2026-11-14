const PORT_NAME_PREFIX = "qa-comment-field:";

export const commentFieldPortName = (nonce) => `${PORT_NAME_PREFIX}${nonce}`;

export const acceptsCommentFieldPort = ({ port, nonce, extensionId }) =>
  Boolean(nonce) &&
  port?.name === commentFieldPortName(nonce) &&
  port.sender?.id === extensionId &&
  Boolean(port.sender?.tab);
