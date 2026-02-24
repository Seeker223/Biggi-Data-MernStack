import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import { CheckCircle2 } from "lucide-react";

const BuyDataSuccessScreen = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const phone = state?.phone || "";
  const network = state?.network || "";
  const plan = state?.plan || "";
  const price = Number(state?.price || 0);
  const reference = state?.reference || "";

  return (
    <Wrap>
      <Card>
        <Check>
          <CheckCircle2 size={72} color="#4CAF50" />
        </Check>
        <Title>Data Purchase Successful</Title>
        <Meta>Phone: {phone || "-"}</Meta>
        <Meta>Network: {network || "-"}</Meta>
        <Meta>Plan: {plan || "-"}</Meta>
        <Meta>Amount: N{price.toLocaleString()}</Meta>
        {reference ? <Meta>Ref: {reference}</Meta> : null}

        <Btn onClick={() => navigate("/")}>Go Home</Btn>
        <Btn
          onClick={() => navigate("/daily-draw")}
          disabled={FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
        >
          Play Weekly Game
        </Btn>
      </Card>
    </Wrap>
  );
};

export default BuyDataSuccessScreen;

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  background: #fff;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.08);
`;

const Check = styled.div`
  color: #12a150;
  font-weight: 800;
  display: grid;
  place-items: center;
`;

const Title = styled.h1`
  font-size: 22px;
  margin: 8px 0 12px;
`;

const Meta = styled.p`
  margin: 6px 0;
  color: #444;
`;

const Btn = styled.button`
  width: 100%;
  margin-top: 10px;
  border: 0;
  border-radius: 10px;
  padding: 12px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
