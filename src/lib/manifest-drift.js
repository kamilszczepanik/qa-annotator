const KEYS_CHROME_ADDS = new Set(["key", "current_locale", "update_url"]);

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical(value[key])]),
  );
};

const comparableKeys = ({ onDisk, loaded }) =>
  new Set([
    ...Object.keys(onDisk),
    ...Object.keys(loaded).filter((key) => !KEYS_CHROME_ADDS.has(key)),
  ]);

export const manifestDrifted = ({ onDisk, loaded }) => {
  if (!onDisk || !loaded) return false;
  return [...comparableKeys({ onDisk, loaded })].some(
    (key) =>
      JSON.stringify(canonical(onDisk[key])) !==
      JSON.stringify(canonical(loaded[key])),
  );
};

export const MANIFEST_PATH = "manifest.json";

export const exposesManifest = (manifest) =>
  (manifest?.web_accessible_resources ?? []).some(
    (entry) =>
      Array.isArray(entry?.resources) &&
      entry.resources.includes(MANIFEST_PATH),
  );
