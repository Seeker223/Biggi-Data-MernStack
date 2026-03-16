export const FEATURE_FLAGS = {
  // Web app is not constrained by Play Store review restrictions.
  DISABLE_GAME_AND_REDEEM: String(import.meta.env.VITE_DISABLE_GAME_AND_REDEEM || "false").toLowerCase() === "true",

  // Temporary toggle for withdrawals (launch-day safety switch).
  // Set `VITE_DISABLE_WITHDRAWALS=true` to hide Withdraw buttons and show a disabled screen on /withdraw.
  DISABLE_WITHDRAWALS: String(import.meta.env.VITE_DISABLE_WITHDRAWALS || "false").toLowerCase() === "true",
};
