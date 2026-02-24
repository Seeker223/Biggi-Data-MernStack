import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getDepositHistory } from "../../services/api";

const POLL_INTERVAL = 10000;

export default function DepositHistoryScreen() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await getDepositHistory();
      const deposits = res?.data?.deposits || res?.data?.history || [];
      setHistory(Array.isArray(deposits) ? deposits : []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    const timer = window.setInterval(loadHistory, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [loadHistory]);

  return (
    <Page>
      <Container>
        <Header>
          <HeaderBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </HeaderBtn>
          <Title>Deposit History</Title>
          <HeaderBtn
            onClick={() => {
              setRefreshing(true);
              loadHistory();
            }}
          >
            <RefreshCw size={18} />
          </HeaderBtn>
        </Header>

        {loading ? (
          <StateCard>Loading deposit history...</StateCard>
        ) : history.length === 0 ? (
          <StateCard>No deposit history yet.</StateCard>
        ) : (
          <List>
            {history.map((item, index) => {
              const status = String(item?.status || "pending").toLowerCase();
              const amount = Number(item?.amount || 0);
              const createdAt = item?.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "Unknown date";
              return (
                <Item key={item?._id || `${createdAt}-${index}`}>
                  <Top>
                    <Amount>+N{amount.toLocaleString()}</Amount>
                    <Status $status={status}>{status.toUpperCase()}</Status>
                  </Top>
                  <Meta>Method: {item?.method || item?.channel || "Flutterwave"}</Meta>
                  <DateText>{createdAt}</DateText>
                </Item>
              );
            })}
          </List>
        )}

        {refreshing && <Refreshing>Refreshing...</Refreshing>}
      </Container>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  justify-content: center;
  padding: 0;
`;

const Container = styled.div`
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const HeaderBtn = styled.button`
  border: none;
  width: 34px;
  height: 34px;
  border-radius: 17px;
  display: grid;
  place-items: center;
  background: #fff;
  color: #ff7a00;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
`;

const StateCard = styled.div`
  margin: 16px;
  border-radius: 14px;
  background: #f7f7f7;
  color: #666;
  font-weight: 600;
  text-align: center;
  padding: 22px 16px;
`;

const List = styled.div`
  padding: 16px;
  display: grid;
  gap: 10px;
`;

const Item = styled.div`
  background: #fff;
  border: 1px solid #ededed;
  border-radius: 14px;
  padding: 14px;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const Amount = styled.div`
  color: #089981;
  font-size: 18px;
  font-weight: 800;
`;

const Status = styled.span`
  font-size: 11px;
  font-weight: 800;
  border-radius: 8px;
  padding: 4px 8px;
  background: ${(p) =>
    p.$status === "successful" || p.$status === "success"
      ? "#dcfce7"
      : p.$status === "failed" || p.$status === "reversed"
      ? "#fee2e2"
      : "#fef3c7"};
  color: ${(p) =>
    p.$status === "successful" || p.$status === "success"
      ? "#15803d"
      : p.$status === "failed" || p.$status === "reversed"
      ? "#b91c1c"
      : "#a16207"};
`;

const Meta = styled.p`
  margin: 0;
  color: #555;
  font-size: 13px;
`;

const DateText = styled.p`
  margin: 6px 0 0;
  color: #888;
  font-size: 12px;
`;

const Refreshing = styled.p`
  margin: 0 16px 16px;
  color: #666;
  font-size: 12px;
`;

