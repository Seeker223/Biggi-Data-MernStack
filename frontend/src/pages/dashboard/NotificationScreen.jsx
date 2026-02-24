import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Bell, RefreshCw } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { getNotifications } from "../../services/api";

const NotificationScreen = () => {
  const navigate = useNavigate();
  const { user, markNotificationsAsSeen } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      const backendItems = res?.data?.notifications || res?.notifications || [];
      setItems(Array.isArray(backendItems) ? backendItems : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    markNotificationsAsSeen();
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
      ),
    [items]
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
            <StatNumber>{sortedItems.length}</StatNumber>
            <StatLabel>Total</StatLabel>
          </Stat>
          <Stat>
            <StatNumber>{sortedItems.filter((x) => x?.type === "Welcome").length}</StatNumber>
            <StatLabel>Welcome</StatLabel>
          </Stat>
          <Stat>
            <StatNumber>{sortedItems.filter((x) => x?.type === "Redeem").length}</StatNumber>
            <StatLabel>Redeems</StatLabel>
          </Stat>
          <Stat>
            <StatNumber>{sortedItems.filter((x) => x?.type === "Signout").length}</StatNumber>
            <StatLabel>Signouts</StatLabel>
          </Stat>
        </Stats>

        {loading && <Empty>Loading notifications...</Empty>}
        {!loading && sortedItems.length === 0 && (
          <Empty>
            <Bell size={48} color="#FF7A00" />
            <p>No notifications yet.</p>
          </Empty>
        )}

        {!loading &&
          sortedItems.map((item, idx) => (
            <Card key={item?._id || `${item?.type || "Notification"}-${idx}`}>
              <Row>
                <Type>{item?.type || "Notification"}</Type>
                {item?.amount !== null && item?.amount !== undefined ? (
                  <Amount>₦{Number(item.amount).toLocaleString()}</Amount>
                ) : null}
              </Row>
              <Meta>{item?.message || item?.status || "info"}</Meta>
              <Time>{new Date(item?.createdAt || Date.now()).toLocaleString()}</Time>
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
