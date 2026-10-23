/**
 * Typed wrappers for every endpoint the backend currently serves (backend/app/api/v1).
 * People, departments, faces, scans, attendance and reports have no endpoints yet; their pages
 * show what is planned instead of calling URLs that do not exist.
 */
import { apiRequest, refreshSession, setAccessToken } from "./client";
import type { ChangePasswordRequest, Health, LoginRequest, Me, Readiness, RoleDetail, TokenResponse } from "./types";

export const api = {
  health: (signal?: AbortSignal) => apiRequest<Health>("/api/v1/health", { auth: false, signal }),

  /** 503 responses still carry a Readiness body, so they are returned rather than thrown. */
  readiness: async (signal?: AbortSignal): Promise<Readiness> => {
    const response = await fetch("/api/v1/health/ready", { cache: "no-store", signal });
    if (response.status === 200 || response.status === 503) {
      const body = (await response.json().catch(() => null)) as Readiness | null;
      if (body && "database" in body) return body;
    }
    return {
      status: "unavailable",
      database: "unavailable",
      migrations: "unknown",
      current_revision: null,
      head_revision: null,
    };
  },

  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const tokens = await apiRequest<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      json: credentials,
      auth: false,
    });
    setAccessToken(tokens.access_token);
    return tokens;
  },

  refresh: refreshSession,

  logout: () => apiRequest<void>("/api/v1/auth/logout", { method: "POST" }),

  me: (signal?: AbortSignal) => apiRequest<Me>("/api/v1/auth/me", { signal }),

  changePassword: (body: ChangePasswordRequest) =>
    apiRequest<void>("/api/v1/auth/change-password", { method: "POST", json: body }),

  roles: (signal?: AbortSignal) => apiRequest<RoleDetail[]>("/api/v1/roles", { signal }),
};
