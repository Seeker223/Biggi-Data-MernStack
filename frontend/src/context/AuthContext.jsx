import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
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
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Login failed" 
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUser(userData);
      api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || "Registration failed" 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
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