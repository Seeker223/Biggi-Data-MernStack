import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ArrowLeft,
  RefreshCw,
  ShoppingCart,
  Users,
  Wallet,
  Gamepad2,
  ChevronRight,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import {
  getDataPurchaseHistory,
  getReferralStats,
  getUserGameStats,
  getWalletTransactions,
  getDailyGameHistory,
} from "../../services/api";

const safeDate = (value) => {
  try {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
};

const money = (n) => {
  const num = Number(n || 0);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString();
};

export default function UserDashboardScreen() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [purchases, setPurchases] = useState([]);
  const [walletTxns, setWalletTxns] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [refSummary, setRefSummary] = useState({});
  const [gameStats, setGameStats] = useState(null);
  const [dailyHistory, setDailyHistory] = useState([]);

  const load = async () => {
    setError("");
    try {
      const [buyRes, walletRes, refRes, statsRes, dailyRes] = await Promise.allSettled([
        getDataPurchaseHistory(),
        getWalletTransactions({ limit: 60 }),
        getReferralStats(),
        getUserGameStats(),
        getDailyGameHistory(),
      ]);

      const purchaseRows =
        buyRes.status === "fulfilled"
          ? buyRes.value?.data?.history || buyRes.value?.data?.transactions || buyRes.value?.data?.data || []
          : [];

      const walletRows =
        walletRes.status === "fulfilled"
          ? walletRes.value?.data?.transactions ||
            walletRes.value?.data?.wallet?.transactions ||
            walletRes.value?.data?.data ||
            []
          : [];

      const refPayload = refRes.status === "fulfilled" ? refRes.value?.data || {} : {};
      const referralRows =
        Array.isArray(refPayload?.referrals) ? refPayload.referrals : Array.isArray(refPayload?.data) ? refPayload.data : [];

      const statsPayload = statsRes.status === "fulfilled" ? statsRes.value || {} : {};
      const mergedStats =
        statsPayload?.stats ||
        statsPayload?.data?.stats ||
        (statsPayload?.success ? statsPayload?.stats : null) ||
        null;

      const dailyRows =
        dailyRes.status === "fulfilled"
          ? dailyRes.value?.data?.history || dailyRes.value?.data?.games || dailyRes.value?.data?.data || []
          : [];

      setPurchases(Array.isArray(purchaseRows) ? purchaseRows : []);
      setWalletTxns(Array.isArray(walletRows) ? walletRows : []);
      setReferrals(Array.isArray(referralRows) ? referralRows : []);
      setRefSummary({
        totalReferrals:
          Number(refPayload?.totalReferrals || refPayload?.count || refPayload?.total || referralRows?.length || 0) || 0,
        totalReferralPurchases: Number(refPayload?.totalReferralPurchases || refPayload?.purchases || 0) || 0,
        totalReferralPurchasers: Number(refPayload?.totalReferralPurchasers || refPayload?.purchasers || 0) || 0,
      });
      setGameStats(mergedStats);
      setDailyHistory(Array.isArray(dailyRows) ? dailyRows : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load dashboard right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purchaseSummary = useMemo(() => {
    const totalCount = purchases.length;
    const totalSpent = purchases.reduce((sum, p) => sum + Number(p?.amount || 0), 0);
    const last = purchases[0]?.createdAt ? safeDate(purchases[0].createdAt) : null;
    return { totalCount, totalSpent, last };
  }, [purchases]);

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)).slice(0, 8);
  }, [purchases]);

  const sortedWallet = useMemo(() => {
    return [...walletTxns].sort((a, b) => new Date(b?.date || b?.createdAt || 0) - new Date(a?.date || a?.createdAt || 0)).slice(0, 8);
  }, [walletTxns]);

  const referralPurchasers = useMemo(() => {
    const rows = referrals || [];
    const purchasers = rows.filter((r) => Number(r?.purchaseCount || r?.purchases || 0) > 0 || Boolean(r?.hasPurchased));
    return purchasers.slice(0, 8);
  }, [referrals]);

  const gameSummary = useMemo(() => {
    const stats = gameStats || {};
    const dailyWins = Number(stats?.dailyWins || 0);
    const monthlyWins = Number(stats?.monthlyWins || 0);
    const totalWins = Number(stats?.totalWins || dailyWins + monthlyWins);
    const tickets = Number(stats?.tickets || 0);
    return { dailyWins, monthlyWins, totalWins, tickets };
  }, [gameStats]);

  const recentDailyPlays = useMemo(() => {
    return [...dailyHistory]
      .sort((a, b) => new Date(b?.createdAt || b?.date || 0) - new Date(a?.createdAt || a?.date || 0))
      .slice(0, 6);
  }, [dailyHistory]);

  return (
    <Page>
      <Header>
        <HeaderBtn onClick={() => navigate(-1)} type="button">
          <ArrowLeft size={20} />
        </HeaderBtn>
        <HeaderText>
          <Title>User Dashboard</Title>
          <Subtitle>{user?.username || user?.email || "Your overview"}</Subtitle>
        </HeaderText>
        <HeaderBtn
          onClick={() => {
            setRefreshing(true);
            load();
          }}
          type="button"
          aria-label="Refresh"
        >
          <RefreshCw size={18} />
        </HeaderBtn>
      </Header>

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      {loading ? (
        <StateCard>Loading your dashboard…</StateCard>
      ) : (
        <>
          <Grid>
            <StatCard>
              <StatIcon>
                <ShoppingCart size={18} />
              </StatIcon>
              <StatMeta>
                <StatLabel>Data purchases</StatLabel>
                <StatValue>{purchaseSummary.totalCount}</StatValue>
                <StatHint>Total spent: ₦{money(purchaseSummary.totalSpent)}</StatHint>
              </StatMeta>
            </StatCard>

            <StatCard>
              <StatIcon>
                <Users size={18} />
              </StatIcon>
              <StatMeta>
                <StatLabel>Referrals</StatLabel>
                <StatValue>{Number(refSummary.totalReferrals || 0)}</StatValue>
                <StatHint>
                  Purchasers: {Number(refSummary.totalReferralPurchasers || referralPurchasers.length || 0)}
                </StatHint>
              </StatMeta>
            </StatCard>

            <StatCard>
              <StatIcon>
                <Wallet size={18} />
              </StatIcon>
              <StatMeta>
                <StatLabel>Transactions</StatLabel>
                <StatValue>{walletTxns.length}</StatValue>
                <StatHint>Recent wallet activity</StatHint>
              </StatMeta>
            </StatCard>

            <StatCard>
              <StatIcon>
                <Gamepad2 size={18} />
              </StatIcon>
              <StatMeta>
                <StatLabel>Games</StatLabel>
                <StatValue>{gameSummary.totalWins} wins</StatValue>
                <StatHint>
                  Daily: {gameSummary.dailyWins} · Monthly: {gameSummary.monthlyWins} · Tickets: {gameSummary.tickets}
                </StatHint>
              </StatMeta>
            </StatCard>
          </Grid>

          <Section>
            <SectionHead>
              <SectionTitle>Recent data purchases</SectionTitle>
              <SectionBtn type="button" onClick={() => navigate("/transactions")}>
                View all <ChevronRight size={16} />
              </SectionBtn>
            </SectionHead>
            {sortedPurchases.length === 0 ? (
              <MiniState>No purchases yet.</MiniState>
            ) : (
              <List>
                {sortedPurchases.map((p, idx) => (
                  <Row key={p?._id || `p-${idx}`}>
                    <RowLeft>
                      <RowTitle>{p?.network || "Network"} · {p?.plan || p?.plan_name || "Plan"}</RowTitle>
                      <RowSub>{safeDate(p?.createdAt)?.toLocaleString() || "—"}</RowSub>
                    </RowLeft>
                    <RowRight>₦{money(p?.amount)}</RowRight>
                  </Row>
                ))}
              </List>
            )}
          </Section>

          <Section>
            <SectionHead>
              <SectionTitle>Referrals (purchased data)</SectionTitle>
              <SectionBtn type="button" onClick={() => navigate("/referrals")}>
                Leaderboard <ChevronRight size={16} />
              </SectionBtn>
            </SectionHead>
            {referralPurchasers.length === 0 ? (
              <MiniState>No referral purchases found yet.</MiniState>
            ) : (
              <List>
                {referralPurchasers.map((r, idx) => (
                  <Row key={r?._id || r?.email || `r-${idx}`}>
                    <RowLeft>
                      <RowTitle>{r?.username || r?.name || r?.email || "Referral user"}</RowTitle>
                      <RowSub>
                        Purchases: {Number(r?.purchaseCount || r?.purchases || 0)} ·{" "}
                        Last: {safeDate(r?.lastPurchaseAt || r?.updatedAt)?.toLocaleDateString() || "—"}
                      </RowSub>
                    </RowLeft>
                    <RowRight>{r?.state || ""}</RowRight>
                  </Row>
                ))}
              </List>
            )}
          </Section>

          <Section>
            <SectionHead>
              <SectionTitle>Recent wallet transactions</SectionTitle>
              <SectionBtn type="button" onClick={() => navigate("/wallet")}>
                Wallet <ChevronRight size={16} />
              </SectionBtn>
            </SectionHead>
            {sortedWallet.length === 0 ? (
              <MiniState>No wallet transactions yet.</MiniState>
            ) : (
              <List>
                {sortedWallet.map((t, idx) => {
                  const type = t?.type || t?.meta?.action || "transaction";
                  const amount = Number(t?.amount || 0);
                  return (
                    <Row key={t?._id || t?.reference || `t-${idx}`}>
                      <RowLeft>
                        <RowTitle>{String(type).replace(/_/g, " ")}</RowTitle>
                        <RowSub>{safeDate(t?.date || t?.createdAt)?.toLocaleString() || "—"}</RowSub>
                      </RowLeft>
                      <RowRight>₦{money(amount)}</RowRight>
                    </Row>
                  );
                })}
              </List>
            )}
          </Section>

          <Section>
            <SectionHead>
              <SectionTitle>Games played</SectionTitle>
              <SectionBtn type="button" onClick={() => navigate("/daily-history")}>
                Daily history <ChevronRight size={16} />
              </SectionBtn>
            </SectionHead>
            {recentDailyPlays.length === 0 ? (
              <MiniState>No game plays yet.</MiniState>
            ) : (
              <List>
                {recentDailyPlays.map((g, idx) => (
                  <Row key={g?._id || `g-${idx}`}>
                    <RowLeft>
                      <RowTitle>{g?.gameName || "Daily Game"}</RowTitle>
                      <RowSub>
                        {safeDate(g?.createdAt || g?.date)?.toLocaleString() || "—"} ·{" "}
                        {g?.won ? "Win" : g?.status || "Played"}
                      </RowSub>
                    </RowLeft>
                    <RowRight>{g?.prize ? `₦${money(g.prize)}` : ""}</RowRight>
                  </Row>
                ))}
              </List>
            )}
          </Section>
        </>
      )}

      {refreshing ? <Refreshing>Refreshing…</Refreshing> : null}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  padding-bottom: 110px;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 26px;
  border-bottom-right-radius: 26px;
`;

const HeaderBtn = styled.button`
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #fff;
  color: #ff7a00;
  cursor: pointer;
`;

const HeaderText = styled.div`
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #fff;
`;

const Subtitle = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  word-break: break-word;
`;

const ErrorBox = styled.div`
  margin: 14px 16px 0;
  border-radius: 14px;
  background: rgba(220, 53, 69, 0.08);
  border: 1px solid rgba(220, 53, 69, 0.18);
  padding: 12px;
  color: #7f1d1d;
  font-weight: 800;
`;

const StateCard = styled.div`
  margin: 16px;
  border-radius: 14px;
  background: #f7f7f7;
  color: #666;
  font-weight: 700;
  text-align: center;
  padding: 22px 16px;
`;

const Grid = styled.div`
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: #fff;
  border: 1px solid #ededed;
  border-radius: 16px;
  padding: 14px;
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.04);
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff7a00, #ff4d00);
  color: #fff;
  display: grid;
  place-items: center;
`;

const StatMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 800;
`;

const StatValue = styled.div`
  font-size: 18px;
  color: #0b0b0b;
  font-weight: 900;
`;

const StatHint = styled.div`
  font-size: 11px;
  color: #888;
  font-weight: 700;
  line-height: 1.3;
`;

const Section = styled.section`
  padding: 0 16px;
  margin-top: 10px;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 12px 0 10px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #0b0b0b;
`;

const SectionBtn = styled.button`
  border: 1px solid #ededed;
  background: #fff;
  color: #111;
  font-weight: 900;
  font-size: 12px;
  border-radius: 14px;
  padding: 8px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const MiniState = styled.div`
  background: #fafafa;
  border: 1px solid #ededed;
  border-radius: 14px;
  padding: 14px;
  color: #777;
  font-weight: 700;
`;

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  background: #fff;
  border: 1px solid #ededed;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const RowLeft = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const RowTitle = styled.div`
  font-weight: 900;
  font-size: 13px;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowSub = styled.div`
  font-weight: 700;
  font-size: 11px;
  color: #777;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RowRight = styled.div`
  font-weight: 900;
  color: #111;
  font-size: 12px;
  white-space: nowrap;
`;

const Refreshing = styled.div`
  position: fixed;
  bottom: 86px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 10px 12px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 12px;
`;

