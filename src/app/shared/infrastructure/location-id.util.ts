/**
 * Extracts the last numeric path segment from a REST Location header.
 * Example: `/api/v1/plantations/1/recommendations/3` → `3`
 */
export function parseLocationId(location: string | null | undefined): number | null {
  if (!location) return null;
  const trimmed = location.trim().replace(/\/+$/, '');
  const segment = trimmed.split('/').pop();
  if (!segment) return null;
  const id = Number(segment);
  return Number.isFinite(id) ? id : null;
}

/**
 * Reads Location from HttpResponse headers (case-insensitive fallback).
 */
export function parseLocationIdFromHeaders(headers: {
  get(name: string): string | null;
}): number | null {
  const location = headers.get('Location') ?? headers.get('location');
  return parseLocationId(location);
}
