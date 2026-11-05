/** Minimal JWT payload shape used by SmartPalm tokens. */
export interface JwtPayload {
  sid?: string | number;
  name?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decodes a JWT payload without verifying the signature (client-side convenience).
 * Returns null if the token is malformed.
 */
export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    // Browser + modern Node provide atob; avoid Buffer for CSR bundle safety.
    if (typeof atob !== 'function') return null;
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * User id from JWT claims used by .NET TokenService.
 * ClaimTypes.Sid often serializes as a long URI, not short "sid".
 */
export function userIdFromToken(token: string | null | undefined): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const candidates = [
    payload.sid,
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid'],
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid'],
    payload['sub'],
    payload['nameid'],
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
  ];

  for (const c of candidates) {
    if (c === undefined || c === null || c === '') continue;
    const id = Number(c);
    if (Number.isFinite(id) && id > 0) return id;
  }
  return null;
}
