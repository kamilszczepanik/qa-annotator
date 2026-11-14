export const PANEL_PORT_NAME = "qa-annotator-panel";
export const PANEL_PAGE_PATH = "src/panel/panel.html";

const isText = (value) => typeof value === "string";

const COMMAND_SHAPES = {
  save: ({ comment }) => isText(comment),
  addArea: ({ comment }) => isText(comment),
  finish: ({ comment }) => isText(comment),
  cancel: () => true,
  delete: ({ id }) => isText(id),
  edit: ({ id, comments }) =>
    isText(id) && Array.isArray(comments) && comments.every(isText),
  copied: () => true,
  copy: ({ prompt }) => isText(prompt),
};

export const isPanelCommand = (message) =>
  typeof message === "object" &&
  message !== null &&
  Object.hasOwn(COMMAND_SHAPES, message.type) &&
  COMMAND_SHAPES[message.type](message);

export const acceptsPanelPort = ({ port, extensionId }) =>
  port?.name === PANEL_PORT_NAME &&
  Boolean(extensionId) &&
  port.sender?.id === extensionId &&
  !port.sender?.tab &&
  port.sender?.url?.startsWith(
    `chrome-extension://${extensionId}/${PANEL_PAGE_PATH}`,
  ) === true;
