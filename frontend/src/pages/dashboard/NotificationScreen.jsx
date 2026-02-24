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
import { getNotifications } from "../../services/api";
import api from "../../utils/api";

const NotificationScreen = () => {
  const navigate = useNavigate();
  const { user, markNotificationsAsSeen } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [depositHistory, setDepositHistory] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [backendNotifications, setBackendNotifications] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [notifRes, depRes, wdRes] = await Promise.allSettled([
        getNotifications(),
        api.get("/wallet/deposit-history"),
        api.get("/wallet/withdraw-history"),
      ]);

      const notifications =
        notifRes.status === "fulfilled"
          ? notifRes.value?.data?.notifications || notifRes.value?.notifications || []
          : [];
      const deposits =
        depRes.status === "fulfilled" ? depRes.value?.data?.deposits || [] : [];
      const withdrawals =
        wdRes.status === "fulfilled" ? wdRes.value?.data?.withdrawals || [] : [];

      setBackendNotifications(Array.isArray(notifications) ? notifications : []);
      setDepositHistory(Array.isArray(deposits) ? deposits : []);
      setWithdrawHistory(Array.isArray(withdrawals) ? withdrawals : []);
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
      amount: g?.isWinner ? Number(g?.prizeAmount || 2000) : null,
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

    return [...deposits, ...withdrawals, ...games, ...notices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [depositHistory, withdrawHistory, gameHistory, backendNotifications]);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return merged;
    return merged.filter((item) => item.type === activeTab);
  }, [merged, activeTab]);

  const stats = {
    deposits: depositHistory.length,
    withdrawals: withdrawHistory.length,
    games: gameHistory.length,
    wins: gameHistory.filter((g) => g?.isWinner).length,
  };

  const iconFor = (item) => {
    if (item.type === "deposits") return <Wallet size={18} color="#15803d" />;
    if (item.type === "withdrawals") return <Landmark size={18} color="#dc2626" />;
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
          <Tab $active={activeTab === "games"} onClick={() => setActiveTab("games")}>
            Games
          </Tab>
        </Tabs>

        {loading ? (
          <Empty>Loading notifications...</Empty>
        ) : filteredItems.length === 0 ? (
          <Empty>No records in this tab yet.</Empty>
        ) : (
          <List>
            {filteredItems.map((item) => (
              <Card key={item.id}>
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
  grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
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

