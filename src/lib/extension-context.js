export const isExtensionAlive = (chromeApi = globalThis.chrome) =>
  Boolean(chromeApi?.runtime?.id);
