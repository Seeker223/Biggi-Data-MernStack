import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Bell, RefreshCw } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/api";

const LOCAL_NOTIFICATIONS_KEY = "bd_local_notifications";

const NotificationScreen = () => {
  const navigate = useNavigate();
  const { user, markNotificationsAsSeen } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [localNotifications, setLocalNotifications] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depRes, wdRes] = await Promise.allSettled([
        api.get("/wallet/deposit-history"),
        api.get("/wallet/withdraw-history"),
      ]);

      if (depRes.status === "fulfilled") {
        setDeposits(depRes.value.data?.deposits || []);
      }
      if (wdRes.status === "fulfilled") {
        setWithdrawals(wdRes.value.data?.withdrawals || []);
      }
      try {
        const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setLocalNotifications(Array.isArray(parsed) ? parsed : []);
      } catch {
        setLocalNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    markNotificationsAsSeen();
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => {
    const d = deposits.map((x) => ({
      type: "Deposit",
      status: x.status || "created",
      amount: x.amount || 0,
      createdAt: x.createdAt,
    }));
    const w = withdrawals.map((x) => ({
      type: "Withdrawal",
      status: x.status || "created",
      amount: x.amount || 0,
      createdAt: x.createdAt,
    }));
    const l = localNotifications.map((x) => ({
      type: x.type || "Notification",
      status: x.status || "created",
      amount: x.amount || 0,
      createdAt: x.createdAt,
    }));
    return [...d, ...w, ...l].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [deposits, withdrawals, localNotifications]);

  const redeemCount = useMemo(
    () => localNotifications.filter((item) => item?.type === "Redeem").length,
    [localNotifications]
  );

  return (
    <Page>
      <Container>
        <Header>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </IconButton>
          <Title>Notifications</Title>
          <IconButton onClick={fetchData}>
            <RefreshCw size={18} />
          </IconButton>
        </Header>

        <Stats>
          <Stat>
            <StatNumber>{deposits.length}</StatNumber>
            <StatLabel>Deposits</StatLabel>
          </Stat>
          <Stat>
            <StatNumber>{withdrawals.length}</StatNumber>
            <StatLabel>Withdrawals</StatLabel>
          </Stat>
          <Stat>
            <StatNumber>{user?.dailyNumberDraw?.length || 0}</StatNumber>
            <StatLabel>Games</StatLabel>
          </Stat>
          <Stat>
            <StatNumber>{redeemCount}</StatNumber>
            <StatLabel>Redeems</StatLabel>
          </Stat>
        </Stats>

        {loading && <Empty>Loading notifications...</Empty>}
        {!loading && items.length === 0 && (
          <Empty>
            <Bell size={48} color="#FF7A00" />
            <p>No notifications yet.</p>
          </Empty>
        )}

        {!loading &&
          items.map((item, idx) => (
            <Card key={`${item.type}-${idx}`}>
              <Row>
                <Type>{item.type}</Type>
                <Amount>₦{Number(item.amount).toLocaleString()}</Amount>
              </Row>
              <Meta>{item.status}</Meta>
              <Time>{new Date(item.createdAt).toLocaleString()}</Time>
            </Card>
          ))}
      </Container>
    </Page>
  );
};

export default NotificationScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  justify-content: center;
  padding: 20px;
`;

const Container = styled.div`
  width: 100%;
  max-width: 440px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const IconButton = styled.button`
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
`;

const Stat = styled.div`
  background: #f7f7f7;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 20px;
  font-weight: 800;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
`;

const Card = styled.div`
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const Type = styled.div`
  font-weight: 700;
`;

const Amount = styled.div`
  font-weight: 800;
  color: #FF7A00;
`;

const Meta = styled.div`
  margin-top: 4px;
  color: #444;
  text-transform: capitalize;
`;

const Time = styled.div`
  margin-top: 6px;
  color: #888;
  font-size: 12px;
`;

const Empty = styled.div`
  min-height: 40vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 10px;
  text-align: center;
`;
