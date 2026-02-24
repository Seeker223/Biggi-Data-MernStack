import axios from 'axios';

// Resolve API origin safely for local dev and production devices.
const envBaseUrl = import.meta.env.VITE_BASE_URL?.trim();
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
// In production, always use same-origin "/api" and let hosting rewrites/proxy forward to backend.
const API_ORIGIN = isLocalHost ? (envBaseUrl || "http://localhost:5000") : "";
const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api/v1` : "/api/v1";

console.log("API Base URL:", API_BASE_URL);

// -----------------------------------------------------------
// ⚙️ Axios instance
// -----------------------------------------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// -----------------------------------------------------------
// 🔐 Attach access token automatically
// -----------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -----------------------------------------------------------
// 🔄 Token refresh mechanism
// -----------------------------------------------------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) promise.reject(error);
    else promise.resolve(token);
  });
  failedQueue = [];
};

// -----------------------------------------------------------
// 🚫 Global response interceptor
// -----------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // -------------------------------------------------------
    // 🌐 Network & timeout errors
    // -------------------------------------------------------
    if (error.message === "Network Error") {
      console.error("❌ Network Error — backend unreachable");
      return Promise.reject(error);
    }

    if (error.code === "ECONNABORTED") {
      console.error("⏰ Request timeout");
      return Promise.reject(error);
    }

    // -------------------------------------------------------
    // 🔁 Handle expired access token (401)
    // -------------------------------------------------------
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          }
        );

        const newAccessToken = res.data.accessToken;

        // Store in both localStorage and sessionStorage for safety
        localStorage.setItem("userToken", newAccessToken);
        sessionStorage.setItem("userToken", newAccessToken);

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // ❌ Refresh failed → force logout
        localStorage.removeItem("userToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("userToken");
        sessionStorage.removeItem("refreshToken");
        delete api.defaults.headers.common.Authorization;

        console.error("❌ Token refresh failed:", refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// -----------------------------------------------------------
// 🔌 TEST BACKEND CONNECTION
// -----------------------------------------------------------
export const testBackendConnection = async () => {
  try {
    const res = await api.get("/auth/ping");
    console.log("✅ Backend reachable:", res.data);
    return true;
  } catch (err) {
    console.error("❌ Backend ping failed:", err.message);
    return false;
  }
};

// -----------------------------------------------------------
// AUTH
// -----------------------------------------------------------
export const loginUser = (payload) => api.post("/auth/login", payload);
export const registerUser = (payload) => api.post("/auth/register", payload);
export const fetchUser = () => api.get("/auth/me");

// -----------------------------------------------------------
// WALLET & PAYMENTS
// -----------------------------------------------------------
export const refreshUserBalance = () => api.get("/wallet/balance");
export const getDepositHistory = () => api.get("/wallet/deposit-history");

export const verifyFlutterwavePayment = (tx_ref) =>
  api.post("/wallet/verify-flutterwave", { tx_ref });

export const getDepositStatus = (tx_ref) =>
  api.get(`/wallet/deposit-status/${tx_ref}`);

export const reconcilePayment = (tx_ref) =>
  api.post("/wallet/reconcile-payment", { tx_ref });

export const redeemRewards = (payload = {}) => api.post("/wallet/redeem", payload);

export const withdrawFunds = (payload) => api.post("/wallet/withdraw", payload);

export const getWithdrawalHistory = async () => {
  try {
    const res = await api.get("/wallet/withdraw-history");
    return res.data;
  } catch (err) {
    console.error("Withdrawal history error:", err);
    return { success: false, withdrawals: [] };
  }
};

// -----------------------------------------------------------
// DATA PURCHASE
// -----------------------------------------------------------
export const buyData = async (payload) => {
  try {
    const res = await api.post("/data/buy", payload);
    
    if (res.data.success) {
      // Update monthly purchase count
      try {
        await updateMonthlyPurchase();
      } catch (monthlyError) {
        console.log("Monthly purchase update failed (non-critical):", monthlyError);
        // Continue anyway - main data purchase succeeded
      }
    }
    
    return res.data;
  } catch (err) {
    return {
      success: false,
      msg: err.response?.data?.msg || "Failed to purchase data",
    };
  }
};

export const getDataPurchaseHistory = () => api.get("/data/history");

// -----------------------------------------------------------
// GAMES - DAILY & MONTHLY
// -----------------------------------------------------------
// DAILY GAMES
export const playDailyGame = (numbers) =>
  api.post("/game/daily/play", { numbers });

export const getDailyResult = () => api.get("/game/daily/result");

export const getDailyGameHistory = () => api.get("/game/daily/history");

// MONTHLY GAMES
export const getMonthlyEligibility = () => 
  api.get("/game/monthly/eligibility");

export const getMonthlyWinners = (month) => 
  api.get("/game/monthly/winners", month ? { params: { month } } : {});

export const updateMonthlyPurchase = () => 
  api.post("/game/monthly/purchase");

// GAME TICKETS
export const getGameTickets = () => api.get("/game/tickets");

// -----------------------------------------------------------
// LEADERBOARD
// -----------------------------------------------------------
export const getLeaderboard = async () => {
  try {
    const res = await api.get("/data/leaderboard");
    return res.data.leaderboard || [];
  } catch (err) {
    console.log("Failed to load leaderboard", err);
    return [];
  }
};

// -----------------------------------------------------------
// USER PROFILE
// -----------------------------------------------------------
export const updateUserProfile = (payload) =>
  api.put("/user/update-profile", payload);

export const updateAvatar = async (formData) => {
  try {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");

    const res = await axios.put(
      `${API_BASE_URL}/user/update-avatar`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );

    return res.data;
  } catch (err) {
    console.log("Avatar upload error:", err.response?.data || err.message);
    return {
      success: false,
      msg: err.response?.data?.msg || "Failed to update avatar",
    };
  }
};

// -----------------------------------------------------------
// GAME HISTORY & STATISTICS
// -----------------------------------------------------------
export const getUserGameStats = async () => {
  try {
    const res = await api.get("/game/stats");
    return res.data;
  } catch (err) {
    console.log("Failed to load game stats:", err);
    return {
      success: false,
      stats: {
        dailyWins: 0,
        monthlyWins: 0,
        totalWins: 0,
        totalPrizeWon: 0,
        tickets: 0,
      }
    };
  }
};

export const claimDailyReward = (gameId) =>
  api.post("/game/daily/claim", { gameId });

export const claimMonthlyReward = (month) =>
  api.post("/game/monthly/claim", { month });

// -----------------------------------------------------------
// NOTIFICATIONS
// -----------------------------------------------------------
export const getNotifications = () => api.get("/user/notifications");
export const markNotificationsAsRead = () => api.post("/user/notifications/read");

// -----------------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------------
export const checkConnection = async () => {
  try {
    await api.get("/auth/ping");
    return true;
  } catch {
    return false;
  }
};

// -----------------------------------------------------------
// DATA BUNDLE MANAGEMENT
// -----------------------------------------------------------
export const getAvailableBundles = () => api.get("/data/bundles");
export const getBundleCategories = () => api.get("/data/categories");

// -----------------------------------------------------------
// BULK DATA PURCHASE
// -----------------------------------------------------------
export const bulkPurchaseData = async (bundles) => {
  try {
    const res = await api.post("/data/bulk-purchase", { bundles });
    
    if (res.data.success) {
      try {
        await updateMonthlyPurchase();
      } catch (monthlyError) {
        console.log("Monthly purchase update failed:", monthlyError);
      }
    }
    
    return res.data;
  } catch (err) {
    return {
      success: false,
      msg: err.response?.data?.msg || "Failed to purchase bundles",
    };
  }
};

// -----------------------------------------------------------
// DRAW SCHEDULES
// -----------------------------------------------------------
export const getDrawSchedules = async () => {
  try {
    const res = await api.get("/game/schedules");
    return res.data;
  } catch (err) {
    console.log("Failed to load draw schedules:", err);
    return {
      success: false,
      schedules: {
        daily: { time: "19:30", timezone: "WAT", recurring: "daily" },
        monthly: { time: "23:59", timezone: "WAT", recurring: "monthly" },
      }
    };
  }
};

// -----------------------------------------------------------
// PRIZE DISTRIBUTION
// -----------------------------------------------------------
export const getPrizeDistribution = (type = "daily") => 
  api.get(`/game/prizes/${type}`);

// -----------------------------------------------------------
// WINNER VERIFICATION
// -----------------------------------------------------------
export const verifyWinnerStatus = (drawType, drawDate) =>
  api.post("/game/verify-winner", { drawType, drawDate });

// -----------------------------------------------------------
// GAME RULES & TERMS
// -----------------------------------------------------------
export const getGameRules = (gameType = "daily") =>
  api.get(`/game/rules/${gameType}`);

// -----------------------------------------------------------
// TICKET MANAGEMENT
// -----------------------------------------------------------
export const getTicketHistory = () => api.get("/game/tickets/history");
export const purchaseTickets = (quantity) => api.post("/game/tickets/purchase", { quantity });

// -----------------------------------------------------------
// REFERRAL SYSTEM
// -----------------------------------------------------------
export const getReferralStats = () => api.get("/user/referrals");
export const generateReferralLink = () => api.post("/user/referrals/generate");

// -----------------------------------------------------------
// GAME ANALYTICS
// -----------------------------------------------------------
export const getGameAnalytics = (period = "monthly") =>
  api.get(`/game/analytics/${period}`);

// -----------------------------------------------------------
// Storage utility for web
// -----------------------------------------------------------
export const storage = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value); // Backup in session storage
    } catch (e) {
      console.warn("Local storage unavailable, using session storage");
      sessionStorage.setItem(key, value);
    }
  },
  
  getItem: (key) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

export default api;
