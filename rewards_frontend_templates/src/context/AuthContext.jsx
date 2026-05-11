import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, me as apiMe } from "../services/api";

const TOKEN_KEY = "br_token";
const USER_KEY = "br_user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });
  const [booting, setBooting] = useState(Boolean(token));

  useEffect(() => {
    let live = true;
    const hydrate = async () => {
      if (!token) return;
      try {
        const data = await apiMe(token);
        if (!live) return;
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch {
        // ignore
      } finally {
        if (live) setBooting(false);
      }
    };
    hydrate();
    return () => {
      live = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      async login(email, password) {
        const data = await apiLogin({ email, password });
        const nextToken = data?.token || data?.accessToken || "";
        if (!nextToken) throw new Error("Login succeeded but token missing");
        setToken(nextToken);
        localStorage.setItem(TOKEN_KEY, nextToken);
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        return data;
      },
      logout() {
        setToken("");
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      },
      setUser,
    }),
    [token, user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

