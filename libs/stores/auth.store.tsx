"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { User, AuthContextType } from "@/libs/types";
import { STORAGE_KEYS } from "@/constants";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Check whether the stored token has expired.
 * Returns `true` when the token is still valid, `false` when it has expired
 * or when no expiry timestamp is stored.
 */
function isTokenValid(): boolean {
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (!expiresAt) return false;

  // expiresAt is an ISO-8601 date string from the backend
  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return false;

  // Add a small buffer (5 seconds) to account for clock drift
  return Date.now() < expiryTime - 5000;
}

/**
 * Returns the number of milliseconds until the token expires.
 * Returns 0 if the token is already expired or no expiry is stored.
 */
function msUntilExpiry(): number {
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (!expiresAt) return 0;

  const expiryTime = new Date(expiresAt).getTime();
  if (isNaN(expiryTime)) return 0;

  // Subtract a 5-second buffer so we log out just before the server rejects us
  const remaining = expiryTime - Date.now() - 5000;
  return Math.max(remaining, 0);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Clear all auth-related data from localStorage and state */
  const clearAuth = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    setUser(null);
  }, []);

  /** Schedule an auto-logout when the token expires */
  const scheduleAutoLogout = useCallback(() => {
    // Clear any previous timer
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    const ms = msUntilExpiry();
    if (ms <= 0) {
      // Token is already expired – log out immediately
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      return;
    }

    expiryTimerRef.current = setTimeout(() => {
      console.warn("[Auth] Token expired – logging out automatically.");
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }, ms);
  }, [clearAuth]);

  // ──────────────────────────────────────────────────────────────
  //  Bootstrap: restore session from localStorage on mount
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);

    if (token && userStr) {
      // If the token has already expired, clear everything instead of restoring
      if (!isTokenValid()) {
        console.warn("[Auth] Stored token has expired – clearing session.");
        clearAuth();
        setIsLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        // Start the auto-logout timer
        scheduleAutoLogout();
      } catch (error) {
        console.error("Failed to parse user data:", error);
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────
  //  Visibility change: re-check token when user returns to tab
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return; // not logged in

      if (!isTokenValid()) {
        console.warn("[Auth] Token expired while tab was inactive – logging out.");
        clearAuth();
        window.location.href = "/auth/login";
        return;
      }

      // Re-schedule in case setTimeout drifted while tab was suspended
      scheduleAutoLogout();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [clearAuth, scheduleAutoLogout]);

  // ──────────────────────────────────────────────────────────────
  //  Clean up timer on unmount
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  //  Public API
  // ──────────────────────────────────────────────────────────────
  const login = (user: User, accessToken: string, refreshToken: string, expiresAt?: string) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    if (expiresAt) {
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt);
    }

    setUser(user);

    // Start the auto-logout timer for this new session
    scheduleAutoLogout();
  };

  const logout = () => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    clearAuth();
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
