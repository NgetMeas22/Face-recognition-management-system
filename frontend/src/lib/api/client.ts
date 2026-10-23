/**
 * Centralised API client.
 *
 * - Requests go to this origin (/api/v1/...), which Next.js proxies to FastAPI.
 * - The access token lives only in memory (never localStorage). The refresh token is the
 *   backend's HttpOnly cookie; JavaScript cannot read it.
 * - On 401 the client refreshes once and retries. Refreshes are single-flight within a tab and
 *   serialised across tabs with the Web Locks API, because the backend treats a second use of a
 *   rotated refresh token as theft and ends the whole sign-in.
 */
import { ApiError, apiErrorFromResponse, networkError } from "./errors";
import type { ApiPath, TokenResponse } from "./types";

const REFRESH_PATH: ApiPath = "/api/v1/auth/refresh";
const REFRESH_LOCK = "facetrack-auth-refresh";

let accessToken: string | null = null;
let refreshInFlight: Promise<TokenResponse | null> | null = null;
let onSessionExpired: (() => void) | null = null;
let onTokenRefreshed: ((tokens: TokenResponse) => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Wires the auth provider in: called when a refresh succeeds or the session cannot be restored. */
export function configureAuthHandlers(handlers: {
  onSessionExpired: () => void;
  onTokenRefreshed: (tokens: TokenResponse) => void;
}): void {
  onSessionExpired = handlers.onSessionExpired;
  onTokenRefreshed = handlers.onTokenRefreshed;
}

async function performRefresh(): Promise<TokenResponse | null> {
  const run = async (): Promise<TokenResponse | null> => {
    let response: Response;
    try {
      response = await fetch(REFRESH_PATH, {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
        cache: "no-store",
      });
    } catch (cause) {
      throw networkError(cause);
    }
    if (response.status === 401 || response.status === 403) {
      accessToken = null;
      return null;
    }
    if (!response.ok) {
      throw apiErrorFromResponse(response, await readJson(response));
    }
    const tokens = (await response.json()) as TokenResponse;
    accessToken = tokens.access_token;
    onTokenRefreshed?.(tokens);
    return tokens;
  };

  if (typeof navigator !== "undefined" && "locks" in navigator && navigator.locks) {
    return navigator.locks.request(REFRESH_LOCK, run);
  }
  return run();
}

/**
 * Exchanges the refresh cookie for a new access token. Returns null when there is no valid
 * session (not signed in, expired, or revoked). Throws ApiError on network/server failure.
 */
export function refreshSession(): Promise<TokenResponse | null> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function readJson(response: Response): Promise<unknown> {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body. */
  json?: unknown;
  /** Form body (URL-encoded or multipart). */
  body?: URLSearchParams | FormData;
  /** Send the access token and refresh on 401. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
};

/**
 * Calls a backend endpoint. `path` must be one of the paths in the generated OpenAPI types, so
 * the compiler rejects URLs the backend does not serve.
 */
export async function apiRequest<T>(path: ApiPath, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, body, auth = true, signal } = options;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (json !== undefined) headers["Content-Type"] = "application/json";
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    try {
      return await fetch(path, {
        method,
        headers,
        body: json !== undefined ? JSON.stringify(json) : body,
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
      throw networkError(cause);
    }
  };

  let response = await send();

  if (response.status === 401 && auth) {
    // A network failure here propagates as NETWORK_ERROR; only a refused refresh ends the session.
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await send();
    }
    if (response.status === 401) {
      accessToken = null;
      onSessionExpired?.();
    }
  }

  if (!response.ok) {
    throw apiErrorFromResponse(response, await readJson(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await readJson(response)) as T;
}

export { ApiError };
