import styled from "styled-components";
import { useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import WalletCard from "../components/WalletCard";
import { useAuth } from "../utils/AuthContext";
import { getAuthToken } from "../utils/auth";
import {
  generateBiggiHouseTxRef,
  getBiggiHouseDepositFeeSettings,
  getBiggiHouseVirtualAccount,
  getBiggiHouseWallet,
  verifyBiggiHouseFlutterwavePayment,
} from "../services/api";

const Wrapper = styled.div`
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  justify-content: center;
  padding: 24px 0 60px;
`;

const Phone = styled(Container)`
  max-width: 380px;

  @media (min-width: 900px) {
    max-width: 880px;
  }
`;

const Layout = styled.div`
  display: grid;
  gap: 20px;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
    gap: 26px;
    align-items: start;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const Burger = styled.div`
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
`;

const HeaderTitle = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 600;
`;

const ActivityTitle = styled.div`
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 600;
  margin: 20px 0 12px;
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 12px 0 6px;
`;

const PrimaryButton = styled.button`
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
`;

const GhostButton = styled.button`
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 600;
`;

const ActivityPanel = styled.div`
  @media (min-width: 900px) {
    background: #fff;
    border-radius: 18px;
    box-shadow: ${({ theme }) => theme.shadows.card};
    padding: 18px;
  }
`;

const ActivityItem = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;

  svg {
    width: 18px;
    height: 18px;
  }

  background: ${({ $variant }) =>
    $variant === "green"
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(59, 130, 246, 0.15)"};
`;

const ItemTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
`;

const ItemSub = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;

const ItemValue = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
`;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function Wallet() {
  const { user } = useAuth();
  const userId = user?.id || user?._id || user?.userId;
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState("");
  const [va, setVa] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;
  const fundPanelRef = useRef(null);
  const fundInputRef = useRef(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    setLoadingWallet(true);
    getBiggiHouseWallet(token)
      .then((data) => setWallet(data))
      .catch((err) => setError(err?.message || "Unable to load wallet."))
      .finally(() => setLoadingWallet(false));

    // Optional: older backends may not expose the VA endpoint yet.
    getBiggiHouseVirtualAccount(token)
      .then((data) => setVa(data))
      .catch(() => null);
  }, []);

  const walletBalance = Number(wallet?.balance || 0);
  const latestJoin = (wallet?.transactions || []).find((item) => item.type === "house_join");
  const recentTransactions = (wallet?.transactions || []).slice(0, 4).map((item) => ({
    id: item._id || item.reference || String(item.date || Date.now()),
    label:
      item.type === "deposit"
        ? "Deposit"
        : item.type === "withdraw"
        ? "Withdraw"
        : "House Contribution",
    note:
      item.type === "house_join"
        ? `House ${item?.meta?.houseNumber || ""}`.trim()
        : item.type === "deposit"
        ? "Wallet top-up"
        : "Wallet withdrawal",
    amount: Number(item.amount || 0),
    variant: item.type === "deposit" ? "green" : "blue",
  }));

  return (
    <Wrapper>
      <Phone>
        <Header>
          <Burger aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Burger>
          <HeaderTitle>Selection House</HeaderTitle>
        </Header>
        <Layout>
          <div>
            <WalletCard
              balance={walletBalance}
              currentHouse={latestJoin?.meta?.houseNumber ? `House ${latestJoin.meta.houseNumber}` : "Not joined"}
              lastBalance={latestJoin?.meta?.previousBalance ?? walletBalance}
            />
            <Actions>
              <PrimaryButton
                type="button"
                onClick={() => {
                  // UX: take the user to the funding panel (Flutterwave / VA).
                  const node = fundPanelRef.current;
                  if (node && typeof node.scrollIntoView === "function") {
                    node.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                  setTimeout(() => fundInputRef.current?.focus?.(), 200);
                }}
              >
                Fund Wallet
              </PrimaryButton>
            </Actions>

            <div
              ref={fundPanelRef}
              style={{
                marginTop: "16px",
                padding: "16px",
                borderRadius: "18px",
                border: "1px solid rgba(15, 23, 42, 0.08)",
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: "6px" }}>Fund Wallet</div>
              <div style={{ color: "#5b6475", fontSize: "14px" }}>
                Payments here are recorded in your BiggiHouse wallet only (independent from Biggi Data).
              </div>
              <div style={{ color: "#5b6475", fontSize: "13px", marginTop: "6px" }}>
                Weekly payout time is Sunday.
              </div>
              <div style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <span style={{ color: "#5b6475", fontSize: "14px" }}>Current wallet balance</span>
                  <strong style={{ fontSize: "14px" }}>{formatCurrency(walletBalance)}</strong>
                </div>

                <label style={{ display: "grid", gap: "6px", fontSize: "14px" }}>
                  Amount to fund (NGN)
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "14px",
                      border: "1px solid rgba(15, 23, 42, 0.14)",
                      background: "#f8fafc",
                    }}
                  >
                    <span style={{ fontWeight: 900, color: "#0f172a" }}>₦</span>
                    <input
                      ref={fundInputRef}
                      value={depositAmount}
                      onChange={(e) => {
                        const cleaned = String(e.target.value || "").replace(/[^\d]/g, "").slice(0, 9);
                        setDepositAmount(cleaned);
                      }}
                      inputMode="numeric"
                      placeholder="1000"
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontSize: "18px",
                        fontWeight: 800,
                      }}
                    />
                  </div>
                </label>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <PrimaryButton
                    type="button"
                    disabled={depositLoading || !publicKey}
                    onClick={async () => {
                      try {
                        setError("");
                        setDepositLoading(true);
                        const token = getAuthToken();
                        if (!token) return;

                        const amount = Number(depositAmount || 0);
                        if (!Number.isFinite(amount) || amount <= 0) {
                          setError("Enter a valid funding amount.");
                          return;
                        }

                        let fee = 0;
                        try {
                          const feeSettings = await getBiggiHouseDepositFeeSettings(token);
                          const flat = Number(feeSettings?.flatFee || 0);
                          const pct = Number(feeSettings?.percentFee || 0);
                          const minFee = Number(feeSettings?.minFee || 0);
                          const maxFee = Number(feeSettings?.maxFee || 0);
                          const enabled = feeSettings?.enabled !== false;
                          fee = enabled ? flat + (pct > 0 ? (amount * pct) / 100 : 0) : 0;
                          if (minFee > 0 && fee < minFee) fee = minFee;
                          if (maxFee > 0 && fee > maxFee) fee = maxFee;
                          fee = Math.max(0, Math.round(fee));
                        } catch {
                          // If the endpoint isn't available yet, we'll proceed with no fee and let the backend respond.
                          fee = 0;
                        }
                        const total = amount + fee;

                        const tx_ref = await generateBiggiHouseTxRef(token);

                        const fw = window.FlutterwaveCheckout;
                        if (typeof fw !== "function") {
                          setError("Flutterwave checkout script is not available yet. Refresh and try again.");
                          return;
                        }

                        fw({
                          public_key: publicKey,
                          tx_ref,
                          amount: total,
                          currency: "NGN",
                          payment_options: "card,banktransfer,ussd",
                          customer: {
                            email: user?.email || "member@biggihouse.com",
                            phonenumber: user?.phoneNumber || "",
                            name: user?.username || user?.email || "BiggiHouse user",
                          },
                          customizations: {
                            title: "BiggiHouse",
                            description: "Fund BiggiHouse wallet",
                            logo: "",
                          },
                          callback: async () => {
                            await verifyBiggiHouseFlutterwavePayment({ tx_ref, amount }, token);
                            const [bhWallet, bhVa] = await Promise.all([
                              getBiggiHouseWallet(token),
                              getBiggiHouseVirtualAccount(token).catch(() => null),
                            ]);
                            setWallet(bhWallet);
                            if (bhVa) setVa(bhVa);
                            setDepositAmount("");
                          },
                          onclose: () => {
                            // user closed modal
                          },
                        });
                      } catch (err) {
                        setError(err?.message || "Deposit failed.");
                      } finally {
                        setDepositLoading(false);
                      }
                    }}
                  >
                    {depositLoading ? "Opening..." : "Fund Wallet"}
                  </PrimaryButton>
                  <GhostButton
                    type="button"
                    onClick={async () => {
                      try {
                        setError("");
                        const token = getAuthToken();
                        if (!token) return;
                        const data = await getBiggiHouseVirtualAccount(token, true);
                        setVa(data);
                      } catch (err) {
                        setError(err?.message || "Unable to refresh virtual account.");
                      }
                    }}
                  >
                    Refresh VA
                  </GhostButton>
                  {!publicKey && (
                    <div style={{ color: "#b45309", fontSize: "13px" }}>
                      Add `VITE_FLUTTERWAVE_PUBLIC_KEY` to enable Flutterwave checkout.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "6px" }}>
                  <div style={{ fontWeight: 700, marginBottom: "6px" }}>Static virtual account (bank transfer)</div>
                  {va?.success && va?.mode === "static" ? (
                    <div style={{ display: "grid", gap: "6px", color: "#111827", fontSize: "14px" }}>
                      <div>
                        <span style={{ color: "#5b6475" }}>Bank: </span>
                        <strong>{va.account.bankName}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#5b6475" }}>Account number: </span>
                        <strong>{va.account.accountNumber}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#5b6475" }}>Account name: </span>
                        <strong>{va.account.accountName}</strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "#5b6475", fontSize: "14px" }}>
                      {va?.message ||
                        "Your BiggiHouse virtual account isn't available yet. You can still fund your wallet via Flutterwave above."}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loadingWallet && (
              <p style={{ marginTop: "8px", color: "#5b6475" }}>Loading wallet...</p>
            )}
            {error && <p style={{ marginTop: "8px", color: "#c02626" }}>{error}</p>}
          </div>
          <ActivityPanel>
            <ActivityTitle>Recent Activity</ActivityTitle>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((item) => (
              <ActivityItem key={item.id}>
                <ItemLeft>
                  <IconCircle $variant={item.variant || "blue"} aria-hidden="true">
                    {item.variant === "green" ? (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M6 12l4 4 8-8"
                          stroke="#16a34a"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 4z"
                          stroke="#2563eb"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </IconCircle>
                  <div>
                    <ItemTitle>{item.label}</ItemTitle>
                    <ItemSub>{item.note}</ItemSub>
                  </div>
                </ItemLeft>
                <ItemValue>{formatCurrency(item.amount)}</ItemValue>
              </ActivityItem>
              ))
            ) : (
              <p style={{ color: "#5b6475" }}>No transactions yet.</p>
            )}
          </ActivityPanel>
        </Layout>
      </Phone>
    </Wrapper>
  );
}
