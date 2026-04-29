import styled from "styled-components";

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const CardTop = styled.div`
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  padding: 20px 22px;
`;

const CardLabel = styled.div`
  font-size: 13px;
  opacity: 0.85;
`;

const BalanceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
`;

const Currency = styled.span`
  font-size: 18px;
  font-weight: 600;
`;

const Amount = styled.span`
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const Body = styled.div`
  padding: 16px 22px 18px;
  display: grid;
  gap: 12px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
`;

const RowValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  text-align: right;
`;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function WalletCard({
  balance = 0,
  currentHouse = "Not joined",
  lastBalance = 0,
  weeklyPayoutTime = "Sunday · 22:00",
}) {
  return (
    <Card>
      <CardTop>
        <CardLabel>Wallet Balance</CardLabel>
        <BalanceRow>
          <Currency>{"\u20A6"}</Currency>
          <Amount>{Number(balance || 0).toLocaleString()}</Amount>
        </BalanceRow>
      </CardTop>
      <Body>
        <Row>
          <span>Current house</span>
          <RowValue>{currentHouse}</RowValue>
        </Row>
        <Divider />
        <Row>
          <span>Last balance</span>
          <RowValue>{formatCurrency(lastBalance)}</RowValue>
        </Row>
        <Divider />
        <Row>
          <span>Weekly payout time</span>
          <RowValue>{weeklyPayoutTime}</RowValue>
        </Row>
      </Body>
    </Card>
  );
}
