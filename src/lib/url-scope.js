const WEB_PROTOCOLS = new Set(["http:", "https:"]);

export const scopeUrl = ({ value, baseUrl }) => {
  try {
    const url = new URL(value, baseUrl);
    if (!WEB_PROTOCOLS.has(url.protocol)) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
};
