const ID_BYTES = 16;

export const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(ID_BYTES)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
