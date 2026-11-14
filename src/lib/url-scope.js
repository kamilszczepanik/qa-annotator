const WEB_PROTOCOLS = new Set(["http:", "https:"]);
const LOCAL_HOSTNAMES = new Set(["localhost", "[::1]"]);
const LOCAL_SUFFIXES = [".localhost", ".local"];
const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/;

const isPrivateIpv4 = (hostname) => {
  const match = IPV4_PATTERN.exec(hostname);
  if (!match) return false;
  const [first, second] = [Number(match[1]), Number(match[2])];
  return (
    first === 10 ||
    first === 127 ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31)
  );
};

export const isLocalHostname = (hostname) =>
  LOCAL_HOSTNAMES.has(hostname) ||
  LOCAL_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
  isPrivateIpv4(hostname);

export const scopeUrl = ({ value, baseUrl }) => {
  try {
    const url = new URL(value, baseUrl);
    if (!WEB_PROTOCOLS.has(url.protocol)) return null;
    const scoped = `${url.origin}${url.pathname}`;
    return isLocalHostname(url.hostname)
      ? `${scoped}${url.search}${url.hash}`
      : scoped;
  } catch {
    return null;
  }
};
