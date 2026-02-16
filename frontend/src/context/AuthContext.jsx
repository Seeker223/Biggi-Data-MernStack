import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

const getAuthErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.code === "ERR_NETWORK") {
    return "Network error: your phone cannot reach the API server. Check VITE_BASE_URL, backend deployment, and CORS.";
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
          // Calculate notification count
          const notifications = res.data.notifications || 0;
          setNotificationCount(notifications > 9 ? 9 : notifications);
        } catch (error) {
          console.error("Auth init error:", error);
          logout();
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
        localStorage.setItem("refreshToken", newRefreshToken);
        sessionStorage.setItem("refreshToken", newRefreshToken);
      }
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: getAuthErrorMessage(error, "Login failed"),
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
        localStorage.setItem("refreshToken", newRefreshToken);
        sessionStorage.setItem("refreshToken", newRefreshToken);
      }
      setToken(newToken);
      setUser(createdUser);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      
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
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common["Authorization"];
    window.location.href = "/login";
  };

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }, [token]);

  const markNotificationsAsSeen = () => {
    setNotificationCount(0);
  };

  const incrementNotificationCount = () => {
    setNotificationCount(prev => {
      const newCount = prev + 1;
      return newCount > 9 ? 9 : newCount;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        notificationCount,
        login,
        register,
        logout,
        refreshUser,
        setUser,
        markNotificationsAsSeen,
        incrementNotificationCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
