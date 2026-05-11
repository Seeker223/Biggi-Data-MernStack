const envBaseUrl = (import.meta.env.VITE_BASE_URL || "").trim();
export const API_ORIGIN =
  envBaseUrl || "https://biggi-data-reactnative-mern.onrender.com";
export const API_BASE = `${API_ORIGIN.replace(/\/$/, "")}/api/v1`;

async function request(path, { method = "GET", token, body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Client-App": "biggi-rewards",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || data?.msg || "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function register({ name, email, password, referralCode }) {
  return request("/auth/register", {
    method: "POST",
    body: {
      username: name,
      email,
      password,
      referralCode: referralCode || undefined,
    },
  });
}

export function login({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function me(token) {
  return request("/auth/me", { token });
}

// Rewards game endpoints (optional). If your backend doesn't have these yet,
// the UI falls back to local save + local result generation.
export function submitRewardsGame({ letters, weekKey }, token) {
  return request("/rewards/game/play", {
    method: "POST",
    token,
    body: { letters, weekKey },
  });
}

export function getRewardsGameResult({ weekKey }) {
  const qs = weekKey ? `?weekKey=${encodeURIComponent(weekKey)}` : "";
  return request(`/rewards/game/result${qs}`);
}

