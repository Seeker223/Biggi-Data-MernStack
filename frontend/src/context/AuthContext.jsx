import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

const persistRefreshToken = (token) => {
  if (!token) return;
  localStorage.setItem("refreshToken", token);
  sessionStorage.setItem("refreshToken", token);
  localStorage.setItem("userRefreshToken", token);
  sessionStorage.setItem("userRefreshToken", token);
  localStorage.setItem("refresh_token", token);
  sessionStorage.setItem("refresh_token", token);
};

const getAuthErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.code === "ERR_NETWORK") {
    return "Network error: API request failed from this browser. Open /api/v1/auth/ping on this same domain to verify routing.";
  }
  if (error?.code === "ECONNABORTED") {
    return "Request timeout: server took too long to respond.";
  }
  return fallbackMessage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  const setNotificationCountForUser = useCallback((userLike) => {
    const total = Number(userLike?.notifications || 0);
    setNotificationCount(total > 9 ? 9 : total);
  }, []);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      const legacyToken =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!localStorage.getItem("userToken") && legacyToken) {
        localStorage.setItem("userToken", legacyToken);
        sessionStorage.setItem("userToken", legacyToken);
      }

      if (token) {
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const res = await api.get("/auth/me");
          setUser(res.data.user);
          if (res?.data?.refreshToken) {
            persistRefreshToken(res.data.refreshToken);
          }
          setNotificationCountForUser(res.data.user);
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

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token: newToken, refreshToken: newRefreshToken, user: userData } = res.data;

      localStorage.setItem("userToken", newToken);
      sessionStorage.setItem("userToken", newToken);
      if (newRefreshToken) {
        persistRefreshToken(newRefreshToken);
      }
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setNotificationCountForUser(userData);
      
      return { success: true };
    } catch (error) {
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

      localStorage.setItem("userToken", newToken);
      sessionStorage.setItem("userToken", newToken);
      if (newRefreshToken) {
        persistRefreshToken(newRefreshToken);
      }
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setNotificationCountForUser(userData);
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
      const { token: newToken, refreshToken: newRefreshToken, user: createdUser } = res.data;

      localStorage.setItem("userToken", newToken);
      sessionStorage.setItem("userToken", newToken);
      if (newRefreshToken) {
        persistRefreshToken(newRefreshToken);
      }
      setToken(newToken);
      setUser(createdUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setNotificationCountForUser(createdUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: getAuthErrorMessage(error, "Registration failed"),
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("userToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("userToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("userRefreshToken");
    sessionStorage.removeItem("userRefreshToken");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
    window.location.href = "/launch";
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      setNotificationCountForUser(res.data.user);
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }, [token, setNotificationCountForUser]);

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
      return merged;
    });
  };

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
        markNotificationsAsSeen,
        incrementNotificationCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
