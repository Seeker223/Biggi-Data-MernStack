import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  getDataPurchaseHistory,
  getDepositHistory,
  getWithdrawalHistory,
} from "../../services/api";

export default function TransactionHistoryScreen() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const [depRes, wdRes, buyRes] = await Promise.allSettled([
        getDepositHistory(),
        getWithdrawalHistory(),
        getDataPurchaseHistory(),
      ]);

      const deposits =
        depRes.status === "fulfilled"
          ? depRes.value?.data?.deposits || depRes.value?.data?.history || []
          : [];
      const withdrawals =
        wdRes.status === "fulfilled"
          ? wdRes.value?.withdrawals || wdRes.value?.data?.withdrawals || []
          : [];
      const purchases =
        buyRes.status === "fulfilled"
          ? buyRes.value?.data?.history ||
            buyRes.value?.data?.transactions ||
            buyRes.value?.data?.data ||
            []
          : [];

      const merged = [
        ...deposits.map((t) => ({ ...t, type: "deposit" })),
        ...withdrawals.map((t) => ({ ...t, type: "withdrawal" })),
        ...purchases.map((t) => ({ ...t, type: "purchase" })),
      ].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));

      setTransactions(merged);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const grouped = useMemo(() => {
    const map = {};
    transactions.forEach((txn) => {
      const date = txn?.createdAt ? new Date(txn.createdAt) : new Date();
      const label = date.toLocaleDateString();
      if (!map[label]) map[label] = [];
      map[label].push(txn);
    });
    return Object.entries(map);
  }, [transactions]);

  return (
    <Page>
      <Container>
        <Header>
          <HeaderBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </HeaderBtn>
          <Title>Transaction History</Title>
          <HeaderBtn
            onClick={() => {
              setRefreshing(true);
              fetchHistory();
            }}
          >
            <RefreshCw size={18} />
          </HeaderBtn>
        </Header>

        {loading ? (
          <StateCard>Loading transactions...</StateCard>
        ) : grouped.length === 0 ? (
          <StateCard>No transactions yet.</StateCard>
        ) : (
          <List>
            {grouped.map(([label, items]) => (
              <Group key={label}>
                <GroupTitle>{label}</GroupTitle>
                {items.map((item, idx) => {
                  const type = item?.type || "transaction";
                  const amount = Number(item?.amount || 0);
                  const sign = type === "deposit" ? "+" : "-";
                  const color = type === "deposit" ? "#089981" : "#d9534f";
                  const title =
                    type === "deposit"
                      ? "Deposit"
                      : type === "withdrawal"
                      ? "Withdrawal"
                      : "Data Purchase";
                  return (
                    <Item key={item?._id || `${label}-${idx}`}>
                      <Top>
                        <ItemTitle>{title}</ItemTitle>
                        <ItemAmount style={{ color }}>
                          {sign}N{amount.toLocaleString()}
                        </ItemAmount>
                      </Top>
                      {type === "purchase" && (
                        <SubText>
                          {item?.network || "Network"} - {item?.plan || item?.plan_name || "Plan"}
                        </SubText>
                      )}
                      {type === "withdrawal" && (
                        <SubText>Status: {item?.status || "pending"}</SubText>
                      )}
                      <DateText>
                        {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown date"}
                      </DateText>
                    </Item>
                  );
                })}
              </Group>
            ))}
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

const Group = styled.div`
  display: grid;
  gap: 8px;
`;

const GroupTitle = styled.h3`
  margin: 0;
  font-size: 13px;
  color: #666;
  font-weight: 700;
`;

const Item = styled.div`
  background: #fff;
  border: 1px solid #ededed;
  border-radius: 14px;
  padding: 14px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111;
`;

const ItemAmount = styled.div`
  font-size: 16px;
  font-weight: 800;
`;

const SubText = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  color: #555;
`;

const DateText = styled.p`
  margin: 6px 0 0;
  font-size: 11px;
  color: #888;
`;

const Refreshing = styled.p`
  margin: 0 16px 16px;
  color: #666;
  font-size: 12px;
`;

