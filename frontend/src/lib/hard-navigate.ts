/**
 * Full page load to an internal path. Used only when the session ends (logout, password change):
 * Next.js keeps visited routes mounted in memory, and a full load is the reliable way to discard
 * every page that rendered the previous user's data, plus the in-memory access token.
 * Use router.push() for ordinary navigation.
 */
export function hardNavigate(path: `/${string}`): void {
  window.location.assign(path);
}
