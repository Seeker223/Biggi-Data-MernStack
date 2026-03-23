import React, { useContext, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { AuthContext } from "../context/AuthContext";

const formatAmount = (value) => {
  const num = Number(value || 0);
  return `N${num.toLocaleString()}`;
};

const BalanceUpdateModalHost = () => {
  const { balanceUpdate, clearBalanceUpdate } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (balanceUpdate) {
      setVisible(true);
    }
  }, [balanceUpdate]);

  if (!balanceUpdate || !visible) return null;

  const delta = Number(balanceUpdate.delta || 0);
  const isCredit = delta >= 0;

  return (
    <Overlay>
      <ModalCard>
        <Title>Wallet Updated</Title>
        <Subtitle>
          {isCredit ? "Credit received" : "Debit applied"} on your main balance
        </Subtitle>

        <Row>
          <Label>Amount</Label>
          <Value $tone={isCredit ? "positive" : "negative"}>
            {isCredit ? "+" : "-"}
            {formatAmount(Math.abs(delta))}
          </Value>
        </Row>
        <Row>
          <Label>Previous Balance</Label>
          <Value>{formatAmount(balanceUpdate.previousBalance)}</Value>
        </Row>
        <Row>
          <Label>New Balance</Label>
          <Value>{formatAmount(balanceUpdate.newBalance)}</Value>
        </Row>

        <MetaText>Updated just now</MetaText>

        <Actions>
          <PrimaryButton
            type="button"
            onClick={() => {
              setVisible(false);
              clearBalanceUpdate();
            }}
          >
            Okay
          </PrimaryButton>
        </Actions>
      </ModalCard>
    </Overlay>
  );
};

export default BalanceUpdateModalHost;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1200;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
  animation: ${slideUp} 0.22s ease-out;
`;

const Title = styled.h3`
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
  color: #111;
`;

const Subtitle = styled.p`
  margin: 0 0 16px;
  color: #666;
  font-size: 13px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
`;

const Label = styled.span`
  color: #777;
  font-size: 12px;
  font-weight: 600;
`;

const Value = styled.span`
  color: ${(props) =>
    props.$tone === "positive" ? "#2e7d32" : props.$tone === "negative" ? "#c62828" : "#111"};
  font-weight: 700;
  font-size: 14px;
`;

const MetaText = styled.div`
  margin-top: 10px;
  color: #9a9a9a;
  font-size: 12px;
  text-align: center;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 16px;
`;

const PrimaryButton = styled.button`
  background: #ff7a00;
  border: none;
  color: #fff;
  font-weight: 700;
  border-radius: 10px;
  padding: 10px 24px;
  cursor: pointer;
  font-size: 14px;
`;
