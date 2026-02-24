import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

export const AuthContext = createContext();
const LOCAL_NOTIFICATIONS_KEY = "bd_local_notifications";

const getUserKey = (userLike) =>
  userLike?._id || userLike?.id || userLike?.email || "anonymous";

const getLocalNotifications = () => {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getLocalUnreadCount = (userLike) => {
  const key = getUserKey(userLike);
  return getLocalNotifications().filter(
    (item) => !item?.seen && (!item?.userKey || item.userKey === key)
  ).length;
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

  const addLocalNotification = useCallback((payload, userLike) => {
    try {
      const current = getLocalNotifications();
      const userKey = getUserKey(userLike);
      current.unshift({
        id: `${payload.type?.toLowerCase?.() || "note"}_${Date.now()}`,
        type: payload.type || "Notification",
        status: payload.status || "info",
        amount: payload.amount ?? null,
        message: payload.message || "",
        createdAt: payload.createdAt || new Date().toISOString(),
        seen: false,
        userKey,
      });
      localStorage.setItem(
        LOCAL_NOTIFICATIONS_KEY,
        JSON.stringify(current.slice(0, 100))
      );
    } catch {
      // ignore local storage errors
    }
  }, []);

  const setNotificationCountForUser = useCallback((apiNotifications, userLike) => {
    const total = Number(apiNotifications || 0) + getLocalUnreadCount(userLike);
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
          // Calculate notification count
          const notifications = res.data.notifications || 0;
          setNotificationCountForUser(notifications, res.data.user);
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
      addLocalNotification(
        {
          type: "Welcome",
          status: "success",
          message: `Welcome back, ${userData?.username || "User"}!`,
        },
        userData
      );
      setNotificationCountForUser(0, userData);
      
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
      addLocalNotification(
        {
          type: "Welcome",
          status: "success",
          message: `Welcome to Biggi Data, ${createdUser?.username || "User"}!`,
        },
        createdUser
      );
      setNotificationCountForUser(0, createdUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: getAuthErrorMessage(error, "Registration failed"),
      };
    }
  };

  const logout = () => {
    if (user) {
      addLocalNotification(
        {
          type: "Signout",
          status: "info",
          message: `Last sign out: ${new Date().toLocaleString()}`,
        },
        user
      );
    }
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
    const key = getUserKey(user);
    const localItems = getLocalNotifications().map((item) =>
      !item?.userKey || item.userKey === key ? { ...item, seen: true } : item
    );
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(localItems));
    setNotificationCount(0);
  };

  const incrementNotificationCount = () => {
    setNotificationCount(prev => {
      const newCount = prev + 1;
      return newCount > 9 ? 9 : newCount;
    });
  };

  const updateUser = (partialUser) => {
    setUser((prev) => (prev ? { ...prev, ...partialUser } : prev));
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
