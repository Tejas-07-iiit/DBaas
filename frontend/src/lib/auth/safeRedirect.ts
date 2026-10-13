export function getSafeRedirect(next?: string | null, fallback = '/'): string {
  if (!next) return fallback;
  // Only allow valid absolute paths within the app
  if (next.startsWith('/') && !next.startsWith('//') && !next.startsWith('\\')) {
    return next;
  }
  return fallback;
}
