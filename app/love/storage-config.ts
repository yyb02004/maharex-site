// This is a public API origin, never a NAS login address or an access token.
// The invitation remains available before storage is connected.
export function getWeddingStorageOrigin(): string | null {
  const value = process.env.LOVE_STORAGE_API_URL?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const localDevelopment = process.env.NODE_ENV === "development"
      && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}
