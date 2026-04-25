const API_BASE =
  (import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/api/v1`
    : null) || "http://localhost:5000/api/v1";

export async function getHouses() {
  // Legacy helper retained for older backends; BiggiHouse now uses /biggihouse/houses.
  const res = await fetch(`${API_BASE}/houses`);
  if (!res.ok) throw new Error("Failed to fetch houses");
  const data = await res.json();
  return data.houses || [];
}

export async function joinHouse(id, token) {
  // Legacy helper retained for older backends; BiggiHouse now uses /biggihouse/houses/:id/join.
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/houses/${id}/join`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error("Failed to join house");
  const data = await res.json();
  return data.house;
}

export async function getBiggiHouseHouses(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/houses`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || "Failed to fetch houses");
    err.code = data.errorCode;
    throw err;
  }
  return data.houses || [];
}

export async function getBiggiHousePublicConfig() {
  const res = await fetch(`${API_BASE}/biggihouse/config`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load config");
  return data.config || data;
}

export async function updateBiggiHouseAdminConfig(payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/config`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to update config");
  return data.config || data;
}

// Backward-compat: older UI names
export const playBiggiHouseMonthlyCardGame = playBiggiHouseWeeklyCardGame;
export const getBiggiHouseMonthlyCardHistory = getBiggiHouseWeeklyCardHistory;

export async function playBiggiHouseWeeklyCardGame(payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/game/weekly-card/play`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || "Unable to play game");
    err.code = data.errorCode;
    throw err;
  }
  return data;
}

export async function getBiggiHouseWeeklyCardHistory(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/game/weekly-card/history`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load history");
  return data;
}

export async function getBiggiHouseWeeklyCard(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/game/weekly-card/card`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load weekly card");
  return data.card || data;
}

export async function getBiggiHouseWeeklyCardAccess(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/game/weekly-card/access`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load game access");
  return data.access || data;
}

export async function joinBiggiHouseHouse(id, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/houses/${id}/join`, {
    method: "POST",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || "Failed to join house");
    err.code = data.errorCode;
    throw err;
  }
  return data;
}

export async function getBiggiHouseWallet(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/wallet`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load wallet");
  return data.wallet;
}

export async function getBiggiHouseVirtualAccount(token, refresh = false) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${API_BASE}/biggihouse/wallet/virtual-account${refresh ? "?refresh=true" : ""}`;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load virtual account");
  return data;
}

export async function generateBiggiHouseTxRef(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/wallet/generate-tx-ref`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to generate reference");
  return data.tx_ref;
}

export async function verifyBiggiHouseFlutterwavePayment(payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/wallet/verify-flutterwave`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Verification failed");
  return data;
}

export async function getBiggiHouseDepositFeeSettings(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/wallet/deposit-fee-settings`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load fee settings");
  return data.settings || data.feeSettings || data;
}

export async function depositBiggiHouseWallet(amount, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/wallet/deposit`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Deposit failed");
  return data;
}

export async function withdrawBiggiHouseWallet(amount, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/wallet/withdraw`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Withdraw failed");
  return data;
}

export async function getBiggiHouseEligibility(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/eligibility`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Eligibility check failed");
  return data;
}

export async function getBiggiHouseMemberships(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/memberships`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load memberships");
  return data.memberships || [];
}

export async function getBiggiHouseVendors(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/vendors`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load vendors");
  return data.vendors || [];
}

export async function getBiggiHouseAdminOverview(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/overview`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load admin overview");
  return data.overview;
}

export async function getBiggiHouseAdminUsers(token, params = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const q = new URLSearchParams();
  if (params.q) q.set("q", params.q);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(`${API_BASE}/biggihouse/admin/users${q.toString() ? `?${q}` : ""}`, {
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load users");
  return data;
}

export async function updateBiggiHouseAdminUser(userId, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/users/${userId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to update user");
  return data.user;
}

export async function adjustBiggiHouseAdminUserWallet(userId, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/users/${userId}/wallet-adjust`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to update wallet");
  return data.wallet;
}

export async function getBiggiHouseAdminHouses(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/houses`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load houses");
  return data.houses || [];
}

export async function createBiggiHouseAdminHouse(payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/houses`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to create house");
  return data.house;
}

export async function updateBiggiHouseAdminHouse(houseId, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/houses/${houseId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to update house");
  return data.house;
}

export async function deleteBiggiHouseAdminHouse(houseId, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/houses/${houseId}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to delete house");
  return data;
}

export async function getBiggiHouseAdminMemberships(token, params = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const q = new URLSearchParams();
  if (params.houseId) q.set("houseId", params.houseId);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(
    `${API_BASE}/biggihouse/admin/memberships${q.toString() ? `?${q}` : ""}`,
    { headers }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load memberships");
  return data;
}

export async function getBiggiHouseAdminWinners(token, params = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const q = new URLSearchParams();
  if (params.houseId) q.set("houseId", params.houseId);
  if (params.status) q.set("status", params.status);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(
    `${API_BASE}/biggihouse/admin/winners${q.toString() ? `?${q}` : ""}`,
    { headers }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load winners");
  return data;
}

export async function triggerBiggiHouseWinnerSelection(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/winners/select`, {
    method: "POST",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to select winners");
  return data;
}

export async function triggerBiggiHouseWinnerPayouts(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/winners/payout`, {
    method: "POST",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to process payouts");
  return data;
}

export async function deleteBiggiHouseAdminMembership(membershipId, token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/memberships/${membershipId}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to remove membership");
  return data;
}

export async function getBiggiHouseAdminVendorRequests(token, params = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(
    `${API_BASE}/biggihouse/admin/vendor-requests${q.toString() ? `?${q}` : ""}`,
    { headers }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load requests");
  return data;
}

export async function updateBiggiHouseAdminVendorRequest(requestId, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/admin/vendor-requests/${requestId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to update request");
  return data.request;
}

export async function createBiggiHouseVendorRequest(payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/biggihouse/vendor-requests`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data.request;
}

export async function getBiggiDataBalance(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/wallet/balance`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load balance");
  return data.balance;
}

export async function getBiggiDataDepositFeeSettings(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/wallet/deposit-fee-settings`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load fee settings");
  return data.settings || data.feeSettings || data;
}

export async function getBiggiDataVirtualAccount(token, refresh = false) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const url = `${API_BASE}/wallet/virtual-account${refresh ? "?refresh=true" : ""}`;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load virtual account");
  return data;
}

// Subscription endpoints
export async function getSubscriptionStatus(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/subscription/status`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch subscription status");
  return data;
}

export async function subscribe(payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/subscription/subscribe`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to subscribe");
  return data;
}

export async function cancelSubscription(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/subscription/cancel`, {
    method: "POST",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to cancel subscription");
  return data;
}

export async function renewSubscription(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/subscription/renew`, {
    method: "POST",
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to renew subscription");
  return data;
}

export async function generateBiggiDataTxRef(token) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/wallet/generate-tx-ref`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to generate reference");
  return data.tx_ref;
}

export async function verifyBiggiDataFlutterwavePayment(payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/wallet/verify-flutterwave`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Verification failed");
  return data;
}

export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-App": "biggi-house" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || data.message || "Registration failed");
    err.requiresVerification = data.requiresVerification;
    err.email = data.email;
    throw err;
  }
  return data;
}

export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-App": "biggi-house" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || data.message || "Login failed");
    err.requiresVerification = data.requiresVerification;
    err.email = data.email;
    throw err;
  }
  return data;
}

export async function verifyEmailOtp(payload) {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Verification failed");
  return data;
}

export async function resendVerification(payload) {
  const res = await fetch(`${API_BASE}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Resend failed");
  return data;
}

export async function forgotPassword(payload) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, "X-Client-App": "biggi-house" },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function getDataPlans(token) {
  const res = await fetch(`${API_BASE}/plans`, {
    headers: { Authorization: `Bearer ${token}`, "X-Client-App": "biggi-house" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch plans");
  return Array.isArray(data.plans) ? data.plans : [];
}

export async function getNetworkPlans(network, token) {
  const n = encodeURIComponent(String(network || "").trim());
  const res = await fetch(`${API_BASE}/plans/network/${n}`, {
    headers: { Authorization: `Bearer ${token}`, "X-Client-App": "biggi-house" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch plans");
  return Array.isArray(data.plans) ? data.plans : [];
}

export async function buyData(payload, token) {
  const res = await fetch(`${API_BASE}/data/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Client-App": "biggi-house",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || "Purchase failed");
  return data;
}

export async function getTransactionSecurityStatus(token) {
  const res = await fetch(`${API_BASE}/profile/transaction-security`, {
    headers: { Authorization: `Bearer ${token}`, "X-Client-App": "biggi-house" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to load security status");
  return data.security || data;
}

export async function setTransactionPin(pin, token) {
  const res = await fetch(`${API_BASE}/profile/transaction-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Client-App": "biggi-house",
    },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Failed to set transaction PIN");
  return data;
}

export async function verifyTransactionPin(pin, token) {
  const res = await fetch(`${API_BASE}/profile/transaction-pin/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Client-App": "biggi-house",
    },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Invalid transaction PIN");
  return data;
}
