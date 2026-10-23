import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, configureAuthHandlers, getAccessToken, refreshSession, setAccessToken } from "./client";
import { ApiError } from "./errors";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

const tokenBody = (token: string) => ({
  access_token: token,
  token_type: "bearer",
  expires_in: 900,
  user: { id: 1, username: "admin", email: "a@x.test", full_name: "A", role: { name: "admin", display_name: "Admin" }, permissions: [], last_login_at: null },
});

const authHeader = (init?: RequestInit) => new Headers(init?.headers).get("Authorization");

describe("apiRequest", () => {
  const onSessionExpired = vi.fn();
  const onTokenRefreshed = vi.fn();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    configureAuthHandlers({ onSessionExpired, onTokenRefreshed });
    setAccessToken("old-token");
    onSessionExpired.mockReset();
    onTokenRefreshed.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it("sends the bearer token and returns JSON", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await expect(apiRequest("/api/v1/auth/me")).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/me");
    expect(authHeader(init)).toBe("Bearer old-token");
    expect(init.credentials).toBe("same-origin");
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: "INVALID_TOKEN", message: "Token has expired." } }))
      .mockResolvedValueOnce(json(200, tokenBody("new-token")))
      .mockResolvedValueOnce(json(200, { id: 1 }));

    await expect(apiRequest("/api/v1/auth/me")).resolves.toEqual({ id: 1 });

    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1];
    expect(refreshUrl).toBe("/api/v1/auth/refresh");
    expect(new Headers(refreshInit.headers).get("X-Requested-With")).toBe("XMLHttpRequest");
    expect(authHeader(fetchMock.mock.calls[2][1])).toBe("Bearer new-token");
    expect(getAccessToken()).toBe("new-token");
    expect(onTokenRefreshed).toHaveBeenCalledOnce();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("ends the session when the refresh is refused", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: "SESSION_REVOKED", message: "Your session has ended." } }))
      .mockResolvedValueOnce(json(401, { error: { code: "INVALID_SESSION", message: "Invalid session." } }));

    const error = await apiRequest("/api/v1/auth/me").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("SESSION_REVOKED");
    expect(onSessionExpired).toHaveBeenCalledOnce();
    expect(getAccessToken()).toBeNull();
  });

  it("does not end the session when the refresh fails with a network error", async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: "INVALID_TOKEN", message: "Token has expired." } }))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const error = await apiRequest("/api/v1/auth/me").catch((e: unknown) => e);
    expect((error as ApiError).code).toBe("NETWORK_ERROR");
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("never sends a token or refreshes for auth: false requests", async () => {
    fetchMock.mockResolvedValueOnce(json(401, { error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password." } }));
    const error = await apiRequest("/api/v1/auth/login", { method: "POST", json: {}, auth: false }).catch((e: unknown) => e);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(authHeader(fetchMock.mock.calls[0][1])).toBeNull();
    expect((error as ApiError).code).toBe("INVALID_CREDENTIALS");
  });

  it("returns undefined for 204 responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(apiRequest("/api/v1/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("shares one refresh between concurrent callers (rotation reuse would end the session)", async () => {
    let release!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (release = resolve)));
    const a = refreshSession();
    const b = refreshSession();
    release(json(200, tokenBody("shared")));
    const [ta, tb] = await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(ta?.access_token).toBe("shared");
    expect(tb?.access_token).toBe("shared");
  });
});
