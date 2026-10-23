"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { configureAuthHandlers, setAccessToken } from "@/lib/api/client";
import { api } from "@/lib/api/endpoints";
import type { ApiError } from "@/lib/api/errors";
import type { LoginRequest, Me, TokenResponse } from "@/lib/api/types";
import { hardNavigate } from "@/lib/hard-navigate";
import { satisfies, type PermissionCode, type PermissionRequirement } from "@/lib/permissions";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: Me | null;
  /** Set when restoring the session failed for a reason other than "not signed in". */
  restoreError: ApiError | null;
  login: (credentials: LoginRequest) => Promise<Me>;
  logout: (options?: { reason?: string }) => Promise<void>;
  can: (permission: PermissionCode) => boolean;
  allows: (requirement?: PermissionRequirement) => boolean;
  retryRestore: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const CHANNEL = "facetrack-auth";
// Refresh this long before the access token expires.
const REFRESH_MARGIN_MS = 60_000;

function loginUrl(reason?: string): `/${string}` {
  const params = new URLSearchParams();
  if (reason) params.set("reason", reason);
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<Me | null>(null);
  const [restoreError, setRestoreError] = useState<ApiError | null>(null);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);

  const scheduleRefresh = useCallback((expiresInSeconds: number) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const delay = Math.max(expiresInSeconds * 1000 - REFRESH_MARGIN_MS, 10_000);
    refreshTimer.current = setTimeout(() => {
      // Failures are handled by the next API call's 401 path.
      void api.refresh().catch(() => undefined);
    }, delay);
  }, []);

  const applyTokens = useCallback(
    (tokens: TokenResponse) => {
      setAccessToken(tokens.access_token);
      setUser(tokens.user);
      setStatus("authenticated");
      setRestoreError(null);
      scheduleRefresh(tokens.expires_in);
    },
    [scheduleRefresh],
  );

  const clearSession = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  // Wire the API client to this provider.
  useEffect(() => {
    configureAuthHandlers({
      onTokenRefreshed: applyTokens,
      onSessionExpired: () => {
        clearSession();
      },
    });
  }, [applyTokens, clearSession]);

  // Restore the session from the HttpOnly refresh cookie on first load.
  useEffect(() => {
    let cancelled = false;
    api
      .refresh()
      .then((tokens) => {
        if (cancelled) return;
        if (tokens) applyTokens(tokens);
        else clearSession();
      })
      .catch((error: ApiError) => {
        if (cancelled) return;
        setRestoreError(error);
        clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [restoreAttempt, applyTokens, clearSession]);

  // Signing out in one tab signs out every tab.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(CHANNEL);
    channel.current = bc;
    bc.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data?.type === "logout") {
        setAccessToken(null);
        hardNavigate(loginUrl());
      }
    };
    return () => {
      bc.close();
      channel.current = null;
    };
  }, []);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    [],
  );

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const tokens = await api.login(credentials);
      applyTokens(tokens);
      return tokens.user;
    },
    [applyTokens],
  );

  const logout = useCallback(async ({ reason }: { reason?: string } = {}) => {
    try {
      await api.logout();
    } catch {
      // The session may already be gone; signing out locally is still correct.
    }
    setAccessToken(null);
    channel.current?.postMessage({ type: "logout" });
    hardNavigate(loginUrl(reason));
  }, []);

  const permissions = useMemo(() => new Set(user?.permissions ?? []), [user]);
  const can = useCallback((permission: PermissionCode) => permissions.has(permission), [permissions]);
  const allows = useCallback((requirement?: PermissionRequirement) => satisfies(permissions, requirement), [permissions]);
  const retryRestore = useCallback(() => {
    setStatus("loading");
    setRestoreAttempt((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ status, user, restoreError, login, logout, can, allows, retryRestore }),
    [status, user, restoreError, login, logout, can, allows, retryRestore],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
