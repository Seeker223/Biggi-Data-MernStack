import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ChevronLeft, Gift, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import { redeemRewards } from "../../services/api";

const MIN_REDEEM = 100;
const REDEEM_RATE_LABEL = "1 Reward Naira = 1 Naira";
const LOCAL_NOTIFICATIONS_KEY = "bd_local_notifications";

const RedeemScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser, incrementNotificationCount } = useContext(AuthContext);

  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: "info", message: "" });
  const [success, setSuccess] = useState({ visible: false, amount: 0 });

  const rewardBalance = Number(user?.rewardBalance || 0);
  const mainBalance = Number(user?.mainBalance || 0);
  const redeemAmount = Number(amount) > 0 ? Number(amount) : 0;
  const canSubmit =
    !submitting &&
    redeemAmount >= MIN_REDEEM &&
    redeemAmount <= rewardBalance &&
    !FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM;

  const helperText = useMemo(() => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
      return "Redeem is temporarily disabled for Play Store review.";
    }
    if (!amount) return `Minimum redeem amount is N${MIN_REDEEM}.`;
    if (redeemAmount < MIN_REDEEM) return `Enter at least N${MIN_REDEEM}.`;
    if (redeemAmount > rewardBalance) return "Insufficient reward balance.";
    return "Redeem amount will be moved to your main balance.";
  }, [amount, redeemAmount, rewardBalance]);

  const showToast = (message, type = "info") => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3200);
  };

  const addRedeemNotification = (amountValue) => {
    try {
      const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      const current = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(current) ? current : [];
      list.unshift({
        id: `redeem_${Date.now()}`,
        type: "Redeem",
        status: "success",
        amount: amountValue,
        createdAt: new Date().toISOString(),
        seen: false,
        userKey: user?._id || user?.email || "anonymous",
      });
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 50)));
      incrementNotificationCount?.();
    } catch {
      // Ignore local notification write errors silently.
    }
  };

  const handleRedeem = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await redeemRewards({ amount: redeemAmount });
      const data = res?.data || {};
      const redeemedAmount = Number(
        data.amountRedeemed ?? data.redeemedAmount ?? data.amount ?? redeemAmount
      );
      const creditedAmount = Number(data.amountCredited ?? redeemedAmount);

      const updatedRewardBalance = Number(
        data.rewardBalance ??
          data.updatedRewardBalance ??
          data.user?.rewardBalance ??
          Math.max(0, rewardBalance - redeemedAmount)
      );
      const updatedMainBalance = Number(
        data.mainBalance ??
          data.updatedMainBalance ??
          data.user?.mainBalance ??
          mainBalance + creditedAmount
      );

      updateUser({
        rewardBalance: updatedRewardBalance,
        mainBalance: updatedMainBalance,
      });
      await refreshUser();

      setAmount("");
      setSuccess({ visible: true, amount: redeemedAmount });
      addRedeemNotification(redeemedAmount);
      showToast(data?.message || "Reward redeemed successfully.", "success");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to redeem rewards. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <ContentContainer>
        {toast.visible && (
          <Toast $type={toast.type}>
            <ToastText>{toast.message}</ToastText>
          </Toast>
        )}

        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ChevronLeft size={26} />
          </BackButton>
          <HeaderTitle>Redeem Rewards</HeaderTitle>
          <div style={{ width: "26px" }} />
        </Header>

        <BalanceCard>
          <BalanceTop>
            <div>
              <BalanceLabel>Redeem Balance</BalanceLabel>
              <BalanceValue>N{rewardBalance.toLocaleString()}</BalanceValue>
            </div>
            <Gift size={32} color="#FF7A00" />
          </BalanceTop>
          <BalanceDivider />
          <RateRow>
            <Wallet size={16} color="#666" />
            <RateText>{REDEEM_RATE_LABEL}</RateText>
          </RateRow>
        </BalanceCard>

        <Card>
          <SectionTitle>Redeem Price</SectionTitle>
          <InputLabel>Amount to Redeem</InputLabel>
          <Input
            type="number"
            min={MIN_REDEEM}
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting || FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
          />

          <HelperText $error={Boolean(amount) && !canSubmit}>
            {helperText}
          </HelperText>

          <Breakdown>
            <BreakdownRow>
              <BreakdownLabel>Redeem Amount</BreakdownLabel>
              <BreakdownValue>N{redeemAmount.toLocaleString()}</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow>
              <BreakdownLabel>Rate</BreakdownLabel>
              <BreakdownValue>1:1</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow $total>
              <BreakdownLabel $total>Main Balance Credit</BreakdownLabel>
              <BreakdownValue $total>N{redeemAmount.toLocaleString()}</BreakdownValue>
            </BreakdownRow>
          </Breakdown>

          <RedeemButton onClick={handleRedeem} disabled={!canSubmit}>
            {submitting ? "Processing..." : `Redeem N${redeemAmount.toLocaleString()}`}
          </RedeemButton>
        </Card>
      </ContentContainer>

      {success.visible && (
        <ModalOverlay>
          <ModalCard>
            <CheckCircle size={42} color="#28A745" />
            <ModalTitle>Redeem Successful</ModalTitle>
            <ModalMessage>
              N{success.amount.toLocaleString()} has been added to your main balance.
            </ModalMessage>
            <ModalButton
              onClick={() => {
                setSuccess({ visible: false, amount: 0 });
                navigate("/");
              }}
            >
              Back to Home
            </ModalButton>
            <ModalButton
              $secondary
              onClick={() => setSuccess({ visible: false, amount: 0 })}
            >
              Close
            </ModalButton>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default RedeemScreen;

const PageContainer = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  justify-content: center;
  padding: 20px;
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 440px;
`;

const Toast = styled.div`
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 10px;
  padding: 12px 20px;
  z-index: 2000;
  background: ${(props) =>
    props.$type === "success" ? "#28A745" : props.$type === "error" ? "#DC3545" : "#333"};
`;

const ToastText = styled.span`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #000;
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  margin: 0;
`;

const BalanceCard = styled.div`
  background: #f8f9fa;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
`;

const BalanceTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BalanceLabel = styled.div`
  font-size: 14px;
  color: #666;
  font-weight: 600;
`;

const BalanceValue = styled.div`
  margin-top: 4px;
  font-size: 28px;
  font-weight: 800;
  color: #000;
`;

const BalanceDivider = styled.div`
  height: 1px;
  background: #e2e2e2;
  margin: 12px 0;
`;

const RateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RateText = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #666;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #ececec;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  padding: 18px;
`;

const SectionTitle = styled.h2`
  margin: 0 0 14px;
  font-size: 16px;
  color: #111;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 14px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #ff7a00;
  }
`;

const HelperText = styled.p`
  font-size: 12px;
  margin: 8px 0 14px;
  color: ${(props) => (props.$error ? "#DC3545" : "#666")};
`;

const Breakdown = styled.div`
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #ededed;
  padding: 14px;
`;

const BreakdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  border-top: ${(props) => (props.$total ? "1px solid #ddd" : "none")};
  margin-top: ${(props) => (props.$total ? "6px" : "0")};
`;

const BreakdownLabel = styled.span`
  font-size: ${(props) => (props.$total ? "15px" : "14px")};
  font-weight: ${(props) => (props.$total ? "700" : "500")};
  color: #333;
`;

const BreakdownValue = styled.span`
  font-size: ${(props) => (props.$total ? "16px" : "14px")};
  font-weight: ${(props) => (props.$total ? "800" : "600")};
  color: ${(props) => (props.$total ? "#FF7A00" : "#222")};
`;

const RedeemButton = styled.button`
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: #ff7a00;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1200;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 340px;
  background: #fff;
  border-radius: 16px;
  padding: 22px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 10px 0 8px;
  font-size: 20px;
`;

const ModalMessage = styled.p`
  margin: 0 0 14px;
  color: #555;
  line-height: 1.4;
`;

const ModalButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: ${(props) => (props.$secondary ? "#777" : "#ff7a00")};
  margin-top: ${(props) => (props.$secondary ? "8px" : "0")};
  cursor: pointer;
`;
