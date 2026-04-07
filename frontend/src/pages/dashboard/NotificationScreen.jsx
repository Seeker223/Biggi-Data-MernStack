import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ArrowLeft,
  RefreshCw,
  Bell,
  Wallet,
  Landmark,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { getNotifications, getReferralStats, getWalletTransactions } from "../../services/api";
import api from "../../utils/api";

const NotificationScreen = () => {
  const navigate = useNavigate();
  const { user, markNotificationsAsSeen } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [depositHistory, setDepositHistory] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [depositDetail, setDepositDetail] = useState(null);
  const [buyDataDetail, setBuyDataDetail] = useState(null);
  const [buyDataHistory, setBuyDataHistory] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [notifRes, depRes, wdRes, referralRes, walletTxRes] = await Promise.allSettled([
        getNotifications(),
        api.get("/wallet/deposit-history"),
        api.get("/wallet/withdraw-history"),
        getReferralStats(),
        getWalletTransactions({ type: "purchase", limit: 100 }),
      ]);

      const notifications =
        notifRes.status === "fulfilled"
          ? notifRes.value?.data?.notifications || notifRes.value?.notifications || []
          : [];
      const deposits =
        depRes.status === "fulfilled" ? depRes.value?.data?.deposits || [] : [];
      const withdrawals =
        wdRes.status === "fulfilled" ? wdRes.value?.data?.withdrawals || [] : [];
      const referralList =
        referralRes.status === "fulfilled"
          ? referralRes.value?.data?.referrals || referralRes.value?.referrals || []
          : [];
      const walletTx =
        walletTxRes.status === "fulfilled"
          ? walletTxRes.value?.data?.transactions || walletTxRes.value?.transactions || []
          : [];

      setBackendNotifications(Array.isArray(notifications) ? notifications : []);
      setDepositHistory(Array.isArray(deposits) ? deposits : []);
      setWithdrawHistory(Array.isArray(withdrawals) ? withdrawals : []);
      setReferrals(Array.isArray(referralList) ? referralList : []);
      setBuyDataHistory(Array.isArray(walletTx) ? walletTx : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    markNotificationsAsSeen();
    fetchData();
  }, [markNotificationsAsSeen, fetchData]);

  const gameHistory = useMemo(
    () =>
      (Array.isArray(user?.dailyNumberDraw) ? user.dailyNumberDraw : [])
        .slice()
        .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0)),
    [user?.dailyNumberDraw]
  );

  const merged = useMemo(() => {
    const deposits = depositHistory.map((d) => ({
      id: d?._id || `d-${d?.reference || Math.random()}`,
      type: "deposits",
      title: "Deposit",
      message: `${d?.status || "pending"}${d?.reference ? ` • ${d.reference}` : ""}`,
      amount: Number(d?.amount || 0),
      createdAt: d?.createdAt || new Date().toISOString(),
      status: d?.status || "pending",
      raw: d,
    }));

    const withdrawals = withdrawHistory.map((w) => ({
      id: w?._id || `w-${w?.reference || Math.random()}`,
      type: "withdrawals",
      title: "Withdrawal",
      message: `${w?.status || "pending"}${w?.bank ? ` • ${w.bank}` : ""}`,
      amount: Number(w?.amount || 0),
      createdAt: w?.createdAt || new Date().toISOString(),
      status: w?.status || "pending",
    }));

    const games = gameHistory.map((g, idx) => ({
      id: g?._id || `g-${idx}`,
      type: "games",
      title: "Weekly Draw",
      message: g?.isWinner ? "Winner ticket" : "Played ticket",
      amount: g?.isWinner ? Number(g?.prizeAmount || 10000) : null,
      createdAt: g?.createdAt || new Date().toISOString(),
      status: g?.isWinner ? "winner" : "played",
    }));

    const notices = backendNotifications.map((n, idx) => ({
      id: n?._id || `n-${idx}`,
      type: "all",
      title: n?.type || "Notification",
      message: n?.message || n?.status || "info",
      amount: n?.amount ?? null,
      createdAt: n?.createdAt || new Date().toISOString(),
      status: n?.status || "info",
    }));

    const referralItems = referrals.map((r, idx) => ({
      id: r?._id || `r-${idx}`,
      type: "referrals",
      title: "Referral",
      message: `${r?.username || "User"} joined using your referral code.`,
      amount: null,
      createdAt: r?.createdAt || new Date().toISOString(),
      status: "success",
    }));

    const purchases = buyDataHistory.map((p, idx) => ({
      id: p?._id || p?.reference || `p-${idx}`,
      type: "buydata",
      title: "Buy Data",
      message: `${p?.status || "pending"}${p?.meta?.network ? ` • ${p.meta.network}` : ""}`,
      amount: Number(p?.amount || 0),
      createdAt: p?.date || new Date().toISOString(),
      status: p?.status || "pending",
      raw: p,
    }));

    return [...deposits, ...withdrawals, ...purchases, ...games, ...notices, ...referralItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [depositHistory, withdrawHistory, buyDataHistory, gameHistory, backendNotifications, referrals]);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return merged;
    return merged.filter((item) => item.type === activeTab);
  }, [merged, activeTab]);

  const stats = {
    deposits: depositHistory.length,
    withdrawals: withdrawHistory.length,
    buydata: buyDataHistory.length,
    games: gameHistory.length,
    wins: gameHistory.filter((g) => g?.isWinner).length,
    referrals: referrals.length,
  };

  const iconFor = (item) => {
    if (item.type === "deposits") return <Wallet size={18} color="#15803d" />;
    if (item.type === "withdrawals") return <Landmark size={18} color="#dc2626" />;
    if (item.type === "buydata") return <Wallet size={18} color="#0f172a" />;
    if (item.type === "games") {
      return item.status === "winner" ? (
        <Trophy size={18} color="#ca8a04" />
      ) : (
        <Gamepad2 size={18} color="#2563eb" />
      );
    }
    return <Bell size={18} color="#ff7a00" />;
  };

  return (
    <Page>
      <Container>
        <Header>
          <IconButton onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={20} />
          </IconButton>
          <HeaderTitle>Notifications</HeaderTitle>
          <IconButton onClick={fetchData} aria-label="Refresh">
            <RefreshCw size={18} />
          </IconButton>
        </Header>

        <StatsCard>
          <StatItem>
            <StatValue>{stats.deposits}</StatValue>
            <StatLabel>Deposits</StatLabel>
          </StatItem>
          <Divider />
          <StatItem>
            <StatValue>{stats.withdrawals}</StatValue>
            <StatLabel>Withdrawals</StatLabel>
          </StatItem>
          <Divider />
          <StatItem>
            <StatValue>{stats.games}</StatValue>
            <StatLabel>Games</StatLabel>
          </StatItem>
          <Divider />
          <StatItem>
            <StatValue>{stats.wins}</StatValue>
            <StatLabel>Wins</StatLabel>
          </StatItem>
          <Divider />
          <StatItem>
            <StatValue>{stats.referrals}</StatValue>
            <StatLabel>Referrals</StatLabel>
          </StatItem>
        </StatsCard>

        <Tabs>
          <Tab $active={activeTab === "all"} onClick={() => setActiveTab("all")}>
            All
          </Tab>
          <Tab
            $active={activeTab === "deposits"}
            onClick={() => setActiveTab("deposits")}
          >
            Deposits
          </Tab>
          <Tab
            $active={activeTab === "withdrawals"}
            onClick={() => setActiveTab("withdrawals")}
          >
            Withdrawals
          </Tab>
          <Tab
            $active={activeTab === "buydata"}
            onClick={() => setActiveTab("buydata")}
          >
            Buy Data
          </Tab>
          <Tab $active={activeTab === "games"} onClick={() => setActiveTab("games")}>
            Games
          </Tab>
          <Tab
            $active={activeTab === "referrals"}
            onClick={() => setActiveTab("referrals")}
          >
            Referrals
          </Tab>
        </Tabs>

        <ReferralStrip>
          {referrals.length === 0 ? (
            <ReferralEmpty>No referrals yet.</ReferralEmpty>
          ) : (
            referrals.map((ref) => (
              <ReferralCard key={ref?._id || ref?.username}>
                <ReferralName>{ref?.username || "User"}</ReferralName>
                <ReferralMeta>{ref?.state || "Nigeria"}</ReferralMeta>
                <ReferralTime>
                  {ref?.createdAt
                    ? new Date(ref.createdAt).toLocaleDateString()
                    : "—"}
                </ReferralTime>
              </ReferralCard>
            ))
          )}
        </ReferralStrip>

        {loading ? (
          <Empty>Loading notifications...</Empty>
        ) : filteredItems.length === 0 ? (
          <Empty>No records in this tab yet.</Empty>
        ) : (
          <List>
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                $clickable={item.type === "deposits" || item.type === "buydata"}
                onClick={() => {
                  if (item.type === "deposits") setDepositDetail(item.raw || null);
                  if (item.type === "buydata") setBuyDataDetail(item.raw || null);
                }}
              >
                <IconWrap>{iconFor(item)}</IconWrap>
                <CardContent>
                  <CardTop>
                    <CardTitle>{item.title}</CardTitle>
                    {item.amount !== null && item.amount !== undefined ? (
                      <Amount>₦{Number(item.amount).toLocaleString()}</Amount>
                    ) : null}
                  </CardTop>
                  <CardMessage>{item.message}</CardMessage>
                  <CardTime>{new Date(item.createdAt).toLocaleString()}</CardTime>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Container>

      {depositDetail ? (
        <ModalOverlay onClick={() => setDepositDetail(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Deposit Details</ModalTitle>
            <DetailRow>
              <DetailLabel>Status</DetailLabel>
              <DetailValue>{depositDetail?.status || "pending"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Amount Credited</DetailLabel>
              <DetailValue>₦{Number(depositDetail?.amount || 0).toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Service Charge</DetailLabel>
              <DetailValue>₦{Number(depositDetail?.serviceCharge || 0).toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Total Paid</DetailLabel>
              <DetailValue>₦{Number(depositDetail?.totalAmount || 0).toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Reference</DetailLabel>
              <DetailValue>{depositDetail?.reference || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Channel</DetailLabel>
              <DetailValue>{depositDetail?.channel || "flutterwave"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Transaction ID</DetailLabel>
              <DetailValue>{depositDetail?.flutterwaveTransactionId || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Created</DetailLabel>
              <DetailValue>
                {depositDetail?.createdAt
                  ? new Date(depositDetail.createdAt).toLocaleString()
                  : "—"}
              </DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Updated</DetailLabel>
              <DetailValue>
                {depositDetail?.updatedAt
                  ? new Date(depositDetail.updatedAt).toLocaleString()
                  : "—"}
              </DetailValue>
            </DetailRow>
            <CloseBtn onClick={() => setDepositDetail(null)}>Close</CloseBtn>
          </ModalCard>
        </ModalOverlay>
      ) : null}

      {buyDataDetail ? (
        <ModalOverlay onClick={() => setBuyDataDetail(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Buy Data Details</ModalTitle>
            <DetailRow>
              <DetailLabel>Status</DetailLabel>
              <DetailValue>{buyDataDetail?.status || "pending"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Amount</DetailLabel>
              <DetailValue>₦{Number(buyDataDetail?.amount || 0).toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Network</DetailLabel>
              <DetailValue>{buyDataDetail?.meta?.network || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Category</DetailLabel>
              <DetailValue>{buyDataDetail?.meta?.category || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Plan</DetailLabel>
              <DetailValue>{buyDataDetail?.meta?.plan_id || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Phone</DetailLabel>
              <DetailValue>{buyDataDetail?.meta?.mobile_no || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Reference</DetailLabel>
              <DetailValue>{buyDataDetail?.reference || "—"}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Created</DetailLabel>
              <DetailValue>
                {buyDataDetail?.date
                  ? new Date(buyDataDetail.date).toLocaleString()
                  : "—"}
              </DetailValue>
            </DetailRow>
            <CloseBtn onClick={() => setBuyDataDetail(null)}>Close</CloseBtn>
          </ModalCard>
        </ModalOverlay>
      ) : null}
    </Page>
  );
};

export default NotificationScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #ffffff;
  padding: 16px;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 460px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const IconButton = styled.button`
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f2f2f2;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  color: #111;
`;

const StatsCard = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr;
  align-items: center;
  background: #f8f8f8;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 14px 10px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #111;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
`;

const Divider = styled.div`
  width: 1px;
  height: 34px;
  background: #ff7a0050;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin: 12px 0;
  overflow-x: auto;
`;

const Tab = styled.button`
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
  color: ${(p) => (p.$active ? "#fff" : "#666")};
  background: ${(p) => (p.$active ? "#ff7a00" : "#f0f0f0")};
`;

const ReferralStrip = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 8px;
`;

const ReferralCard = styled.div`
  min-width: 160px;
  background: #fff7f0;
  border: 1px solid #ffe3cc;
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
`;

const ReferralName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #111;
`;

const ReferralMeta = styled.div`
  font-size: 12px;
  color: #666;
`;

const ReferralTime = styled.div`
  font-size: 11px;
  color: #888;
  margin-top: 6px;
`;

const ReferralEmpty = styled.div`
  font-size: 13px;
  color: #777;
  padding: 6px 2px;
`;

const List = styled.div`
  display: grid;
  gap: 10px;
  padding-bottom: 80px;
`;

const Card = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #fff;
  border: 1px solid #efefef;
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
`;

const IconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #f3f4f6;
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

const CardContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  color: #111;
`;

const Amount = styled.div`
  color: #ff7a00;
  font-size: 15px;
  font-weight: 800;
`;

const CardMessage = styled.p`
  margin: 4px 0 0;
  color: #444;
  font-size: 13px;
`;

const CardTime = styled.p`
  margin: 6px 0 0;
  color: #888;
  font-size: 11px;
`;

const Empty = styled.div`
  min-height: 40vh;
  display: grid;
  place-items: center;
  color: #666;
  font-weight: 600;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  z-index: 1200;
  padding: 16px;
`;

const ModalCard = styled.div`
  background: #fff;
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.h2`
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #111;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f2f2f2;
`;

const DetailLabel = styled.span`
  color: #666;
  font-size: 13px;
`;

const DetailValue = styled.span`
  color: #111;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
`;

const CloseBtn = styled.button`
  margin-top: 14px;
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 12px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;

