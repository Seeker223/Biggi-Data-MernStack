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

const BIOMETRIC_TIMEOUT_MS = 45000;
const AUTH_REMEMBER_KEY = "authRememberMe";

const withBiometricRetry = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    const timedOut =
      error?.code === "ECONNABORTED" ||
      /timeout/i.test(String(error?.message || ""));
    if (!timedOut) throw error;
    return requestFn();
  }
};

const shouldRememberAuth = () => localStorage.getItem(AUTH_REMEMBER_KEY) === "1";

const getPrimaryStorage = () => (shouldRememberAuth() ? localStorage : sessionStorage);

const getStoredAccessToken = () => {
  const primary = getPrimaryStorage();
  return (
    primary.getItem("userToken") ||
    primary.getItem("token") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("userToken") ||
    sessionStorage.getItem("token")
  );
};

const getStoredRefreshToken = () =>
  getPrimaryStorage().getItem("refreshToken") ||
  getPrimaryStorage().getItem("userRefreshToken") ||
  getPrimaryStorage().getItem("refresh_token") ||
  localStorage.getItem("refreshToken") ||
  sessionStorage.getItem("refreshToken") ||
  localStorage.getItem("userRefreshToken") ||
  sessionStorage.getItem("userRefreshToken") ||
  localStorage.getItem("refresh_token") ||
  sessionStorage.getItem("refresh_token");

const persistRefreshToken = (token) => {
  if (!token) return;
  const primary = getPrimaryStorage();
  const secondary = shouldRememberAuth() ? sessionStorage : localStorage;
  secondary.removeItem("refreshToken");
  secondary.removeItem("userRefreshToken");
  secondary.removeItem("refresh_token");
  primary.setItem("refreshToken", token);
  primary.setItem("userRefreshToken", token);
  primary.setItem("refresh_token", token);
};

const clearStoredTokens = () => {
  localStorage.removeItem("userToken");
  sessionStorage.removeItem("userToken");
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("refreshToken");
  localStorage.removeItem("userRefreshToken");
  sessionStorage.removeItem("userRefreshToken");
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("refresh_token");
  localStorage.removeItem(AUTH_REMEMBER_KEY);
};

let refreshHydrationPromise = null;
const hydrateRefreshTokenIfMissing = async () => {
  const token = getStoredAccessToken();
  if (!token || getStoredRefreshToken()) return;
  if (!refreshHydrationPromise) {
    refreshHydrationPromise = axios
      .get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      })
      .then((res) => {
        if (res?.data?.refreshToken) persistRefreshToken(res.data.refreshToken);
      })
      .catch(() => {})
      .finally(() => {
        refreshHydrationPromise = null;
      });
  }
  await refreshHydrationPromise;
};

// -----------------------------------------------------------
// 🔐 Attach access token automatically
// -----------------------------------------------------------
api.interceptors.request.use((config) => {
  return hydrateRefreshTokenIfMissing().then(() => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
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
        const refreshToken = getStoredRefreshToken();
        if (!refreshToken) {
          return Promise.reject(error);
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
        const newRefreshToken = res.data.refreshToken || refreshToken;

        const rememberMe = Boolean(res?.data?.rememberMe ?? shouldRememberAuth());
        localStorage.setItem(AUTH_REMEMBER_KEY, rememberMe ? "1" : "0");
        const primary = rememberMe ? localStorage : sessionStorage;
        const secondary = rememberMe ? sessionStorage : localStorage;
        secondary.removeItem("userToken");
        secondary.removeItem("token");
        primary.setItem("userToken", newAccessToken);
        primary.setItem("token", newAccessToken);
        persistRefreshToken(newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Only clear auth state when refresh token is truly invalid/expired.
        // Avoid force-logout on transient network/proxy issues.
        const refreshStatus = Number(refreshError?.response?.status || 0);
        if (refreshStatus === 401 || refreshStatus === 400) {
          clearStoredTokens();
          delete api.defaults.headers.common.Authorization;
        }

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
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
export const fetchUser = () => api.get("/auth/me");
export const getBiometricStatus = () => api.get("/auth/biometric/status");
export const beginBiometricRegistration = () =>
  withBiometricRetry(() =>
    api.post("/auth/biometric/register/options", {}, { timeout: BIOMETRIC_TIMEOUT_MS })
  );
export const verifyBiometricRegistration = (credential) =>
  withBiometricRetry(() =>
    api.post("/auth/biometric/register/verify", credential, { timeout: BIOMETRIC_TIMEOUT_MS })
  );
export const beginBiometricLogin = (identifier) =>
  withBiometricRetry(() =>
    api.post("/auth/biometric/login/options", { identifier }, { timeout: BIOMETRIC_TIMEOUT_MS })
  );
export const verifyBiometricLogin = (identifier, credential) =>
  withBiometricRetry(() =>
    api.post("/auth/biometric/login/verify", { identifier, ...credential }, { timeout: BIOMETRIC_TIMEOUT_MS })
  );
export const getBiometricLoginAvailability = (identifier) =>
  api.post("/auth/biometric/login/status", { identifier });
export const beginBiometricTransaction = (action, amount) =>
  withBiometricRetry(() =>
    api.post("/auth/biometric/transaction/options", { action, amount }, { timeout: BIOMETRIC_TIMEOUT_MS })
  );
export const verifyBiometricTransaction = (credential) =>
  withBiometricRetry(() =>
    api.post("/auth/biometric/transaction/verify", credential, { timeout: BIOMETRIC_TIMEOUT_MS })
  );
export const disableBiometricAuth = () => api.delete("/auth/biometric");

// -----------------------------------------------------------
// WALLET & PAYMENTS
// -----------------------------------------------------------
export const refreshUserBalance = () => api.get("/wallet/balance");
export const getDepositHistory = () => api.get("/wallet/deposit-history");
export const getDepositFeeSettings = () => api.get("/wallet/deposit-fee-settings");
export const getVirtualAccount = () => api.get("/wallet/virtual-account");

export const verifyFlutterwavePayment = (tx_ref, biometricProof = "", transactionPin = "", amount = 0) =>
  api.post("/wallet/verify-flutterwave", { tx_ref, biometricProof, transactionPin, amount });

export const getDepositStatus = (tx_ref) =>
  api.get(`/wallet/deposit-status/${tx_ref}`);

export const reconcilePayment = (tx_ref, biometricProof = "", transactionPin = "", amount = 0) =>
  api.post("/wallet/reconcile-payment", { tx_ref, biometricProof, transactionPin, amount });

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
  api.get("/monthly-game/eligibility");

export const getMonthlyWinners = (month) => 
  api.get("/monthly-game/winners", month ? { params: { month } } : {});

export const getMonthlyRaffleTickets = (month) =>
  api.get("/monthly-game/tickets", month ? { params: { month } } : {});

export const playMonthlyRaffleTicket = ({ month, code, ticketId } = {}) =>
  api.post("/monthly-game/play", { month, code, ticketId });

export const updateMonthlyPurchase = () => 
  api.post("/monthly-game/purchase");

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
export const getTransactionSecurityStatus = () => api.get("/user/transaction-security");
export const setTransactionPin = (pin, currentPin = "") =>
  api.post("/user/transaction-pin", { pin, currentPin });
export const verifyTransactionPin = (pin) =>
  api.post("/user/transaction-pin/verify", { pin });
export const disableTransactionPin = (currentPin) =>
  api.delete("/user/transaction-pin", { data: { currentPin } });

export const verifyEmailOtp = (payload) =>
  api.post("/auth/verify-email", payload);
export const resendVerificationOtp = (payload) =>
  api.post("/auth/resend-verification", payload);

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
  api.post("/daily-game/claim", { gameId });

export const getWeeklyWinners = (month) =>
  api.get("/daily-game/winners", month ? { params: { month } } : {});

export const claimMonthlyReward = (month) =>
  api.post("/monthly-game/claim", { month });

export const getTopRandomMonthlyStatus = (month) =>
  api.get("/top-random-monthly/status", month ? { params: { month } } : {});

export const getTopRandomMonthlyWinners = (month) =>
  api.get("/top-random-monthly/winners", month ? { params: { month } } : {});

export const claimTopRandomMonthlyReward = (month) =>
  api.post("/top-random-monthly/claim", month ? { month } : {});

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
// ADMIN
// -----------------------------------------------------------
export const getAdminDashboard = (params = {}) => api.get("/admin/dashboard", { params });
export const getAdminUsers = (params = {}) => api.get("/admin/users", { params });
export const getAdminUserById = (id) => api.get(`/admin/users/${id}`);
export const createAdminUser = (payload) => api.post("/admin/users", payload);
export const updateAdminUser = (id, payload) => api.put(`/admin/users/${id}`, payload);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminUnmatchedDeposits = (params = {}) =>
  api.get("/admin/unmatched-deposits", { params });
export const assignUnmatchedDeposit = (id, payload) =>
  api.post(`/admin/unmatched-deposits/${encodeURIComponent(id)}/assign`, payload);

// -----------------------------------------------------------
// ADMIN PLANS
// -----------------------------------------------------------
export const adminSyncProviderCatalog = () => api.post("/plans/admin/sync-provider-catalog");
export const adminResetProviderCatalog = () => api.post("/plans/admin/reset-provider-catalog");
export const getAdminPlans = (params = {}) => api.get("/plans/admin/plans", { params });
export const createAdminPlan = (payload) => api.post("/plans/admin/plans", payload);
export const updateAdminPlan = (planId, payload) =>
  api.put(`/plans/admin/plans/${encodeURIComponent(planId)}`, payload);
export const deleteAdminPlan = (planId) =>
  api.delete(`/plans/admin/plans/${encodeURIComponent(planId)}`);

// -----------------------------------------------------------
// ADMIN PROFIT SWEEP
// -----------------------------------------------------------
export const getAdminProfitSummary = () => api.get("/admin/profit-sweep/summary");
export const getAdminProfitSweepSettings = () => api.get("/admin/profit-sweep/settings");
export const updateAdminProfitSweepSettings = (payload) =>
  api.put("/admin/profit-sweep/settings", payload);
export const getAdminProfitSweeps = () => api.get("/admin/profit-sweep/sweeps");
export const runAdminProfitSweepNow = (force = false) =>
  api.post("/admin/profit-sweep/sweep-now", { force });

// -----------------------------------------------------------
// ADMIN DEPOSIT FEE SETTINGS + LEDGER
// -----------------------------------------------------------
export const getAdminDepositFeeSettings = () => api.get("/admin/deposit-fee/settings");
export const updateAdminDepositFeeSettings = (payload) =>
  api.put("/admin/deposit-fee/settings", payload);
export const getAdminDepositFeeLedger = (params = {}) =>
  api.get("/admin/deposit-fee/ledger", { params });
export const deleteAdminDepositFeeLedger = (id) =>
  api.delete(`/admin/deposit-fee/ledger/${id}`);

// -----------------------------------------------------------
// ADMIN EMAIL SETTINGS
// -----------------------------------------------------------
export const getAdminEmailSettings = () => api.get("/admin/email-settings");
export const updateAdminEmailSettings = (payload) =>
  api.put("/admin/email-settings", payload);

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
