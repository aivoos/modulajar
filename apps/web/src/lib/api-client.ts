/**
 * API client that automatically injects the X-User-ID header from cookies.
 * All frontend-to-API calls should use these helpers instead of raw fetch.
 */

import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Get fetch options with X-User-ID header from session cookies.
 * Used for all /api/* calls that require authentication.
 */
export async function getAuthFetchOpts(
  init?: RequestInit
): Promise<RequestInit> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value ?? "";

  return {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type": "application/json",
      "X-User-ID": accessToken,
    },
  };
}

/**
 * GET helper with auth headers
 */
export async function apiGet<T>(path: string): Promise<T> {
  const opts = await getAuthFetchOpts({ method: "GET" });
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/**
 * POST helper with auth headers
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const opts = await getAuthFetchOpts({
    method: "POST",
    body: JSON.stringify(body),
  });
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/**
 * PATCH helper with auth headers
 */
export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const opts = await getAuthFetchOpts({
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

/**
 * Server-side fetch for streaming (SSE) endpoints.
 * Returns the raw Response object so callers can stream.
 */
export async function apiStream(
  path: string,
  body: unknown
): Promise<Response> {
  const opts = await getAuthFetchOpts({
    method: "POST",
    body: JSON.stringify(body),
  });
  return fetch(`${API_BASE}${path}`, opts);
}
