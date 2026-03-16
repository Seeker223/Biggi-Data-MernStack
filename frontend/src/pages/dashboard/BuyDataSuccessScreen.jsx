import React, { useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import { CheckCircle2 } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

const BuyDataSuccessScreen = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useContext(AuthContext);

  const phone = state?.phone || "";
  const network = state?.network || "";
  const plan = state?.plan || "";
  const price = Number(state?.price || 0);
  const reference = state?.reference || "";

  const raffleProgress = useMemo(() => {
    const purchases = Math.max(0, Number(user?.currentMonthPurchases || 0));
    const ticketsEarned = Math.floor(purchases / 5);
    const mod = purchases % 5;
    const nextIn = purchases === 0 ? 5 : mod === 0 ? 5 : 5 - mod;
    const qualifyIn = purchases >= 5 ? 0 : 5 - purchases;
    const progressPct = purchases === 0 ? 0 : mod * 20; // progress toward the NEXT ticket
    return { purchases, ticketsEarned, nextIn, qualifyIn, progressPct };
  }, [user?.currentMonthPurchases]);

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

        <RaffleCard>
          <RaffleTitle>Monthly Raffle Progress</RaffleTitle>
          <RaffleLine>
            Purchases this month: <strong>{raffleProgress.purchases}</strong>
          </RaffleLine>
          {raffleProgress.purchases < 5 ? (
            <RaffleHint>
              You need <strong>{raffleProgress.qualifyIn}</strong> more purchase
              {raffleProgress.qualifyIn === 1 ? "" : "s"} to earn your first raffle ticket.
            </RaffleHint>
          ) : (
            <RaffleHint>
              You have earned <strong>{raffleProgress.ticketsEarned}</strong> raffle ticket
              {raffleProgress.ticketsEarned === 1 ? "" : "s"} this month. Next ticket in{" "}
              <strong>{raffleProgress.nextIn}</strong> purchase{raffleProgress.nextIn === 1 ? "" : "s"}.
            </RaffleHint>
          )}
          <ProgressBar aria-label="Monthly raffle progress">
            <ProgressFill $pct={Math.min(100, raffleProgress.progressPct)} />
          </ProgressBar>
          <RaffleFoot>Raffle ticket is issued for every 5 data purchases.</RaffleFoot>
        </RaffleCard>

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

const RaffleCard = styled.div`
  margin-top: 14px;
  text-align: left;
  border: 1px solid #ffe0c2;
  background: #fff7ef;
  border-radius: 14px;
  padding: 14px;
`;

const RaffleTitle = styled.div`
  font-weight: 900;
  color: #111;
  margin-bottom: 6px;
`;

const RaffleLine = styled.div`
  font-size: 14px;
  color: #222;
  margin-bottom: 6px;
  strong {
    color: #ff7a00;
  }
`;

const RaffleHint = styled.div`
  font-size: 13px;
  color: #444;
  line-height: 1.35;
  strong {
    color: #111;
  }
`;

const ProgressBar = styled.div`
  margin-top: 10px;
  height: 10px;
  background: #ffe8d4;
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => `${Number($pct || 0)}%`};
  background: linear-gradient(90deg, #ff7a00 0%, #111 100%);
`;

const RaffleFoot = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: #666;
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
