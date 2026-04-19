export const getUserDataPurchaseCount = (userLike) => {
  const direct = Number(userLike?.dataBundleCount ?? userLike?.data_bundle_count ?? 0);
  const nested = Number(userLike?.balances?.dataBundleCount ?? 0);
  const count = Number.isFinite(direct) && direct > 0 ? direct : nested;
  return Number.isFinite(count) ? count : 0;
};

export const isBiggiHouseMember = (userLike) => {
  const role = String(userLike?.userRole || userLike?.role || "").toLowerCase();
  return getUserDataPurchaseCount(userLike) > 0 || role === "merchant";
};

