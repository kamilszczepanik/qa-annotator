const WEB_PROTOCOLS = new Set(["http:", "https:"]);
const DEV_HOSTNAMES = new Set(["localhost", "[::1]"]);
const DEV_SUFFIXES = [".localhost", ".local"];
const LOOPBACK_IPV4_PATTERN = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const SENSITIVE_PARAM_PARTS = [
  "token",
  "code",
  "session",
  "key",
  "auth",
  "password",
  "passwd",
  "secret",
  "reset",
  "sig",
  "signature",
  "jwt",
  "otp",
];
const TOKEN_FRAGMENT_PATTERN = /(access_token|id_token)=/i;

export const isDevHostname = (hostname) =>
  DEV_HOSTNAMES.has(hostname) ||
  DEV_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
  LOOPBACK_IPV4_PATTERN.test(hostname);

const paramNameOf = (pair) => {
  const rawName = pair.split("=")[0].replace(/\+/g, " ");
  try {
    return decodeURIComponent(rawName).toLowerCase();
  } catch {
    return rawName.toLowerCase();
  }
};

const isSensitivePair = (pair) => {
  const name = paramNameOf(pair);
  return SENSITIVE_PARAM_PARTS.some((part) => name.includes(part));
};

const safeSearchOf = (search) => {
  const kept = search
    .slice(1)
    .split("&")
    .filter((pair) => pair !== "" && !isSensitivePair(pair));
  return kept.length > 0 ? `?${kept.join("&")}` : "";
};

const safeHashOf = (hash) => (TOKEN_FRAGMENT_PATTERN.test(hash) ? "" : hash);

export const scopeUrl = ({ value, baseUrl }) => {
  try {
    const url = new URL(value, baseUrl);
    if (!WEB_PROTOCOLS.has(url.protocol)) return null;
    const scoped = `${url.origin}${url.pathname}`;
    if (!isDevHostname(url.hostname)) return scoped;
    return `${scoped}${safeSearchOf(url.search)}${safeHashOf(url.hash)}`;
  } catch {
    return null;
  }
};
