import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

const AUTH_REMEMBER_KEY = "authRememberMe";

const clearAuthStorage = (storage) => {
  storage.removeItem("userToken");
  storage.removeItem("token");
  storage.removeItem("refreshToken");
  storage.removeItem("userRefreshToken");
  storage.removeItem("refresh_token");
};

const persistAuthTokens = ({ token, refreshToken, rememberMe }) => {
  const shouldRemember = Boolean(rememberMe);
  const primary = shouldRemember ? localStorage : sessionStorage;
  const secondary = shouldRemember ? sessionStorage : localStorage;

  clearAuthStorage(secondary);
  if (token) {
    primary.setItem("userToken", token);
    primary.setItem("token", token);
  }
  if (refreshToken) {
    primary.setItem("refreshToken", refreshToken);
    primary.setItem("userRefreshToken", refreshToken);
    primary.setItem("refresh_token", refreshToken);
  }

  localStorage.setItem(AUTH_REMEMBER_KEY, shouldRemember ? "1" : "0");
};

const getAuthErrorMessage = (error, fallbackMessage) => { 
  const data = error?.response?.data; 
  if (typeof data?.error === "string" && data.error.trim()) return data.error; 
  if (typeof data?.message === "string" && data.message.trim()) return data.message; 
  if (typeof data?.msg === "string" && data.msg.trim()) return data.msg; 
  if (Array.isArray(data?.errors) && data.errors.length) { 
    const first = data.errors.find((e) => typeof e === "string" && e.trim()); 
    if (first) return first; 
    const firstMsg = data.errors.find((e) => typeof e?.msg === "string" && e.msg.trim()); 
    if (firstMsg) return firstMsg.msg; 
  } 
  if (error?.code === "ERR_NETWORK") { 
    return "Network error: API request failed from this browser. Open /api/v1/auth/ping on this same domain to verify routing."; 
  } 
  if (error?.code === "ECONNABORTED") {
    return "Request timeout: server took too long to respond.";
  }
  return fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const rememberMeFlag = localStorage.getItem(AUTH_REMEMBER_KEY) === "1";
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    (rememberMeFlag ? localStorage.getItem("userToken") : sessionStorage.getItem("userToken")) ||
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const refreshInFlightRef = useRef(false);
  const lastBalanceRef = useRef(null);
  const balanceInitRef = useRef(false);
  const [balanceUpdate, setBalanceUpdate] = useState(null);

  const setNotificationCountForUser = useCallback((userLike) => {
    const total = Number(userLike?.notifications || 0);
    setNotificationCount(total > 9 ? 9 : total);
  }, []);

  const trackBalanceChange = useCallback((userLike) => {
    const nextBalance = Number(userLike?.mainBalance ?? userLike?.main_balance ?? 0);
    if (!balanceInitRef.current) {
      balanceInitRef.current = true;
      lastBalanceRef.current = nextBalance;
      return;
    }
    if (lastBalanceRef.current === null) {
      lastBalanceRef.current = nextBalance;
      return;
    }
    if (nextBalance !== lastBalanceRef.current) {
      const previous = lastBalanceRef.current;
      lastBalanceRef.current = nextBalance;
      setBalanceUpdate({
        previousBalance: previous,
        newBalance: nextBalance,
        delta: nextBalance - previous,
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      const legacyToken =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!localStorage.getItem("userToken") && legacyToken) {
        persistAuthTokens({
          token: legacyToken,
          refreshToken:
            localStorage.getItem("refreshToken") ||
            sessionStorage.getItem("refreshToken"),
          rememberMe: rememberMeFlag,
        });
      }

      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const res = await api.get("/auth/me");
          setUser(res.data.user);
          if (res?.data?.refreshToken) {
            persistAuthTokens({
              token,
              refreshToken: res.data.refreshToken,
              rememberMe: res.data?.rememberMe ?? rememberMeFlag,
            });
          }
          setNotificationCountForUser(res.data.user);
          trackBalanceChange(res.data.user);
        } catch (error) {
          console.error("Auth init error:", error);
          const status = Number(error?.response?.status || 0);
          if (status === 401 || status === 403) {
            logout();
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password, options = {}) => {
    try {
      const requestedRememberMe = Boolean(options?.rememberMe);
      const payload = {
        email,
        password,
        rememberMe: requestedRememberMe,
      };
      let res;
      try {
        res = await api.post("/auth/login", payload, { timeout: 30000 });
      } catch (error) {
        // Handle backend cold starts/slow wake-up by retrying once on timeout.
        if (error?.code !== "ECONNABORTED") throw error;
        res = await api.post("/auth/login", payload, { timeout: 30000 });
      }
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = res.data;
      const shouldRemember = Boolean(res?.data?.rememberMe ?? requestedRememberMe);

      persistAuthTokens({
        token: newToken,
        refreshToken: newRefreshToken,
        rememberMe: shouldRemember,
      });
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setNotificationCountForUser(userData);
      trackBalanceChange(userData);
      
      return { success: true };
    } catch (error) {
      if (error?.response?.data?.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          email: error?.response?.data?.email,
          error: getAuthErrorMessage(error, "Please verify your email"),
        };
      }
      return { 
        success: false, 
        error: getAuthErrorMessage(error, "Login failed"),
      };
    }
  };

  const loginWithBiometricPayload = async (payload) => {
    try {
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = payload || {};
      if (!newToken || !userData) {
        return { success: false, error: "Biometric login failed" };
      }

      persistAuthTokens({
        token: newToken,
        refreshToken: newRefreshToken,
        rememberMe: true,
      });
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setNotificationCountForUser(userData);
      trackBalanceChange(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error, "Biometric login failed"),
      };
    }
  };

  const register = async (...args) => {
    try {
      const userData =
        args.length === 1 && typeof args[0] === "object"
          ? args[0]
          : {
              username: args[0],
              email: args[1],
              password: args[2],
              phoneNumber: args[3],
              birthDate: args[4],
            };

      const res = await api.post("/auth/register", userData);
      if (res?.data?.requiresVerification) {
        return { success: true, requiresVerification: true, email: res?.data?.email };
      }

      const { token: newToken, refreshToken: newRefreshToken, user: createdUser } = res.data;
      persistAuthTokens({
        token: newToken,
        refreshToken: newRefreshToken,
        rememberMe: false,
      });
      setToken(newToken);
      setUser(createdUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setNotificationCountForUser(createdUser);
      trackBalanceChange(createdUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: getAuthErrorMessage(error, "Registration failed"),
      };
    }
  };

  const logout = () => {
    clearAuthStorage(localStorage);
    clearAuthStorage(sessionStorage);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
    window.location.href = "/launch";
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    if (refreshInFlightRef.current) return;
    try {
      refreshInFlightRef.current = true;
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      setNotificationCountForUser(res.data.user);
      trackBalanceChange(res.data.user);
    } catch (error) {
      console.error("Refresh user error:", error);
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [token, setNotificationCountForUser, trackBalanceChange]);

  // Auto-refresh wallet/user balance in the background
  useEffect(() => {
    if (!token) return undefined;
    const intervalMs = 20000;
    const intervalId = setInterval(() => {
      refreshUser();
    }, intervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshUser();
      }
    };

    window.addEventListener("focus", refreshUser);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", refreshUser);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, refreshUser]);

  const markNotificationsAsSeen = async () => {
    try {
      await api.post("/user/notifications/read");
    } catch (error) {
      console.error("Mark notifications read error:", error);
    }
    setNotificationCount(0);
  };

  const incrementNotificationCount = () => {
    setNotificationCount(prev => {
      const newCount = prev + 1;
      return newCount > 9 ? 9 : newCount;
    });
  };

  const updateUser = (partialUser) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...partialUser };
      setNotificationCountForUser(merged);
      trackBalanceChange(merged);
      return merged;
    });
  };

  const clearBalanceUpdate = () => setBalanceUpdate(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authLoading: loading,
        notificationCount,
        login,
        loginWithBiometricPayload,
        register,
        logout,
        refreshUser,
        setUser,
        updateUser,
        balanceUpdate,
        clearBalanceUpdate,
        markNotificationsAsSeen,
        incrementNotificationCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
