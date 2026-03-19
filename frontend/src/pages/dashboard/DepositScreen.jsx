import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  ChevronLeft,
  AlertCircle,
  Info,
} from "lucide-react";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import {
  getDepositFeeSettings,
  getVirtualAccount,
  refreshUserBalance,
} from "../../services/api";

const SERVICE_CHARGE = 5;
const VIRTUAL_ACCOUNT_FALLBACK =
  "We are unable to process your request right now. Please try again shortly. Virtual account not ready yet. Please try again later.";

const DepositScreen = () => {
  const navigate = useNavigate();

  if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
    return (
      <PageContainer>
        <ContentContainer>
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              backgroundColor: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <AlertCircle size={48} color="#FF7A00" style={{ marginBottom: "16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "#000" }}>
              Deposits Temporarily Disabled
            </h2>
            <p style={{ textAlign: "center", color: "#444", marginBottom: "24px", lineHeight: "1.5" }}>
              Deposits are disabled while we undergo Play Store review.
            </p>
            <PrimaryButton onClick={() => navigate(-1)}>Return</PrimaryButton>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  const [amount, setAmount] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);
  const [feeSettings, setFeeSettings] = useState({
    enabled: true,
    flatFee: SERVICE_CHARGE,
    percentFee: 0,
    minFee: 0,
    maxFee: 0,
  });
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [virtualLoading, setVirtualLoading] = useState(false);
  const [virtualError, setVirtualError] = useState("");
  const [showBvnModal, setShowBvnModal] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const useStaticVirtualAccount = FEATURE_FLAGS.USE_STATIC_VIRTUAL_ACCOUNT;
  const [awaitingCredit, setAwaitingCredit] = useState(false);
  const [baselineBalance, setBaselineBalance] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState("");


  const showToast = (msg, type = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  const loadVirtualAccount = async (amountToUse) => {
    setVirtualLoading(true);
    try {
      const res = await getVirtualAccount(amountToUse);
      setVirtualAccount(res?.data?.account || null);
      setVirtualError("");
      return res?.data?.account || null;
    } catch (err) {
      const msg = err?.response?.data?.message || VIRTUAL_ACCOUNT_FALLBACK;
      setVirtualError(msg);
      if (/bvn|nin/i.test(msg)) {
        setShowBvnModal(true);
      }
      return null;
    } finally {
      setVirtualLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getDepositFeeSettings()
      .then((res) => {
        if (!mounted) return;
        const settings = res?.data?.settings;
        if (settings) setFeeSettings(settings);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!useStaticVirtualAccount) return;
    loadVirtualAccount();
  }, [useStaticVirtualAccount]);

  const enteredAmount = Number(amount) > 0 ? Number(amount) : 0;
  const computeFee = (value) => {
    if (!feeSettings?.enabled) return 0;
    const flat = Number(feeSettings.flatFee || 0);
    const pct = Number(feeSettings.percentFee || 0);
    const rate = pct > 1 ? pct / 100 : pct;
    let fee = flat + (rate > 0 ? value * rate : 0);
    const minFee = Number(feeSettings.minFee || 0);
    const maxFee = Number(feeSettings.maxFee || 0);
    if (minFee > 0 && fee < minFee) fee = minFee;
    if (maxFee > 0 && fee > maxFee) fee = maxFee;
    return Math.max(0, Math.round(fee));
  };
  const computeTransferForCredit = (creditTarget) => {
    if (creditTarget <= 0) return { transfer: 0, fee: 0 };
    let transfer = creditTarget + computeFee(creditTarget);
    let fee = computeFee(transfer);
    for (let i = 0; i < 5; i += 1) {
      const nextTransfer = creditTarget + fee;
      if (Math.abs(nextTransfer - transfer) < 0.5) break;
      transfer = nextTransfer;
      fee = computeFee(transfer);
    }
    return { transfer: Math.round(transfer), fee };
  };

  const creditedAmount = Math.max(0, enteredAmount);
  const { transfer: transferAmount, fee: serviceCharge } = computeTransferForCredit(creditedAmount);
  const isValidAmount = () => enteredAmount >= 100 && transferAmount <= 1000000;

  const handleShowBankDetails = async () => {
    if (!isValidAmount()) {
      if (enteredAmount < 100) showToast("Minimum credit amount is N100", "error");
      else if (transferAmount > 1000000) showToast("Transfer amount cannot exceed N1,000,000", "error");
      return;
    }
    if (!useStaticVirtualAccount || (!virtualAccount && !virtualLoading)) {
      const account = await loadVirtualAccount(transferAmount);
      if (!account) {
        showToast(virtualError || VIRTUAL_ACCOUNT_FALLBACK, "error");
        return;
      }
    }
    setShowBankModal(true);
  };

  const handlePaymentTransferred = async () => {
    setShowBankModal(false);
    try {
      const res = await refreshUserBalance();
      const currentBalance = Number(res?.data?.balance?.main || 0);
      setBaselineBalance(currentBalance);
    } catch {
      setBaselineBalance(null);
    }
    setAwaitingCredit(true);
    showToast("Payment received. Waiting for confirmation...", "info");
  };

  useEffect(() => {
    if (!awaitingCredit) return;

    let attempts = 0;
    const maxAttempts = 12;
    const intervalMs = 5000;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await refreshUserBalance();
        const currentBalance = Number(res?.data?.balance?.main || 0);
        const baseline = Number.isFinite(baselineBalance) ? baselineBalance : currentBalance;
        if (currentBalance >= baseline + creditedAmount) {
          setAwaitingCredit(false);
          setSuccessModalMessage(
            `Deposit confirmed. Main balance credited with N${creditedAmount.toLocaleString()}.`
          );
          setSuccessModalVisible(true);
        }
      } catch {
        // Silent retry
      }

      if (attempts >= maxAttempts) {
        setAwaitingCredit(false);
        showToast("Payment still pending. It may take a few minutes to confirm.", "info");
      }
    };

    const timer = setInterval(poll, intervalMs);
    poll();

    return () => clearInterval(timer);
  }, [awaitingCredit, baselineBalance, creditedAmount]);

  return (
    <PageContainer>
      <ContentContainer>
        {toastVisible && (
          <Toast $type={toastType}>
            <ToastText>{toastMessage}</ToastText>
          </Toast>
        )}

        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ChevronLeft size={26} />
          </BackButton>
          <HeaderTitle>Deposit Funds</HeaderTitle>
          <div style={{ width: "26px" }} />
        </Header>

        <MainContent>
          <Label>Enter Amount to Credit</Label>
          <Input
            type="number"
            placeholder="N Wallet Credit (min N100)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Breakdown>
            <BreakdownRow>
              <BreakdownLabel>Main Balance Credit:</BreakdownLabel>
              <BreakdownValue>N{creditedAmount.toLocaleString()}</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow>
              <BreakdownLabel>Biggi Gain (Service Charge):</BreakdownLabel>
              <BreakdownValue>N{serviceCharge.toLocaleString()}</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow $total>
              <TotalLabel>Transfer Amount (You Pay):</TotalLabel>
              <TotalValue>N{transferAmount.toLocaleString()}</TotalValue>
            </BreakdownRow>
          </Breakdown>

          <PrimaryButton onClick={handleShowBankDetails} disabled={!isValidAmount()}>
            <PayText>
              {virtualLoading
                ? "Loading Account..."
                : useStaticVirtualAccount
                ? "Get Virtual Account"
                : "Generate Virtual Account"}
            </PayText>
          </PrimaryButton>

          <InfoBox>
            <Info size={18} />
            <InfoText>
              - Transfer amount = wallet credit + service charge{"\n"}- Wallet credits automatically after payment is detected{"\n"}- Contact support if issues persist
            </InfoText>
          </InfoBox>
        </MainContent>

        {showBankModal && (
          <ModalOverlay onClick={() => setShowBankModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Your Virtual Account</ModalTitle>
              {virtualError ? <ErrorText>{virtualError}</ErrorText> : null}
              {virtualLoading && !virtualAccount ? (
                <ModalDetails>
                  <ModalDetailLabel>Loading virtual account...</ModalDetailLabel>
                </ModalDetails>
              ) : (
                <ModalDetails>
                  <ModalDetailRow>
                    <ModalDetailLabel>Bank Name:</ModalDetailLabel>
                    <ModalDetailValue>{virtualAccount?.bankName || "Loading"}</ModalDetailValue>
                  </ModalDetailRow>
                  <ModalDetailRow>
                    <ModalDetailLabel>Account Number:</ModalDetailLabel>
                    <ModalDetailValue>{virtualAccount?.accountNumber || "Loading"}</ModalDetailValue>
                  </ModalDetailRow>
                  <ModalDetailRow>
                    <ModalDetailLabel>Account Name:</ModalDetailLabel>
                    <ModalDetailValue>{virtualAccount?.accountName || "Loading"}</ModalDetailValue>
                  </ModalDetailRow>
                  <ModalDetailRow>
                    <ModalDetailLabel>Main Balance Credit:</ModalDetailLabel>
                    <ModalDetailValue>N{creditedAmount.toLocaleString()}</ModalDetailValue>
                  </ModalDetailRow>
                  <ModalDetailRow>
                  <ModalDetailLabel>Biggi Gain (Service Charge):</ModalDetailLabel>
                  <ModalDetailValue>N{serviceCharge.toLocaleString()}</ModalDetailValue>
                </ModalDetailRow>
                  <ModalDetailRow $total>
                    <ModalDetailLabel>Transfer Amount (You Pay):</ModalDetailLabel>
                    <ModalTotal>N{transferAmount.toLocaleString()}</ModalTotal>
                  </ModalDetailRow>
                </ModalDetails>
              )}
              <InfoBox>
                <Info size={18} />
                <InfoText>
                  Transfer the exact amount shown. Service charge is added, and the wallet credit shown above is what you will receive.
                </InfoText>
              </InfoBox>
              <ModalButtons>
                <SecondaryButton onClick={() => setShowBankModal(false)}>Close</SecondaryButton>
                <PrimaryButton onClick={handlePaymentTransferred}>I Have Transferred</PrimaryButton>
              </ModalButtons>
            </ModalContent>
          </ModalOverlay>
        )}

        {successModalVisible && (
          <ModalOverlay onClick={() => setSuccessModalVisible(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Deposit Confirmed</ModalTitle>
              <ModalDetails>
                <ModalDetailLabel>{successModalMessage}</ModalDetailLabel>
              </ModalDetails>
              <ModalButtons>
                <PrimaryButton onClick={() => setSuccessModalVisible(false)}>Close</PrimaryButton>
              </ModalButtons>
            </ModalContent>
          </ModalOverlay>
        )}

        {showBvnModal && (
          <ModalOverlay onClick={() => setShowBvnModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>BVN or NIN Required</ModalTitle>
              <ModalDetails>
                <ModalDetailLabel>
                  To enable virtual account deposits, please add your BVN or NIN in your profile.
                </ModalDetailLabel>
              </ModalDetails>
              <ModalButtons>
                <SecondaryButton onClick={() => setShowBvnModal(false)}>Close</SecondaryButton>
                <PrimaryButton onClick={() => navigate("/edit-profile")}>Go to Profile</PrimaryButton>
              </ModalButtons>
            </ModalContent>
          </ModalOverlay>
        )}

      </ContentContainer>
    </PageContainer>
  );
};

export default DepositScreen;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0;
  overflow-y: auto;
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
`;

const Toast = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${(props) =>
    props.$type === "error" ? "#ff5252" : props.$type === "success" ? "#28a745" : "#333"};
  padding: 12px 24px;
  border-radius: 10px;
  z-index: 1000;
  animation: ${slideDown} 0.3s ease-out;
`;

const ToastText = styled.span`
  color: #fff;
  font-weight: 600;
  font-size: 14px;
`;

const ErrorText = styled.p`
  margin: 10px 0 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff2f2;
  border: 1px solid #ffd1d1;
  color: #9a1111;
  font-size: 12px;
  font-weight: 600;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 16px;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
`;

const HeaderTitle = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
`;

const MainContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 16px 20px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`;

const Input = styled.input`
  background-color: #f8f8f8;
  border-radius: 12px;
  padding: 16px;
  font-size: 18px;
  border: 1px solid #e0e0e0;
  margin-bottom: 20px;
  color: #000;
  width: 100%;
  box-sizing: border-box;
`;

const Breakdown = styled.div`
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #eee;
`;

const BreakdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => (props.$total ? "0" : "8px")};
  padding-top: ${(props) => (props.$total ? "12px" : "0")};
  border-top: ${(props) => (props.$total ? "1px solid #ddd" : "none")};
`;

const BreakdownLabel = styled.span`
  font-size: 14px;
  color: #666;
`;

const BreakdownValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const TotalLabel = styled(BreakdownLabel)`
  font-size: 16px;
  font-weight: 600;
  color: #000;
`;

const TotalValue = styled(BreakdownValue)`
  font-size: 18px;
  font-weight: 700;
  color: #ff7a00;
`;

const PrimaryButton = styled.button`
  background-color: ${(props) => (props.disabled ? "#ccc" : "#ff7a00")};
  padding: 18px;
  border-radius: 12px;
  border: none;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  width: 100%;
`;

const PayText = styled.span`
  color: #fff;
  font-weight: 700;
  font-size: 16px;
`;

const InfoBox = styled.div`
  display: flex;
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-top: 20px;
`;

const InfoText = styled.p`
  flex: 1;
  font-size: 12px;
  color: #666;
  margin-left: 8px;
  line-height: 18px;
  white-space: pre-line;
`;

const SecondaryButton = styled.button`
  background-color: #f0f0f0;
  padding: 14px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  color: #666;
  flex: 1;
  margin-right: 10px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background-color: #fff;
  padding: 24px;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
  color: #000;
`;

const ModalDetails = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const ModalDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${(props) => (props.$total ? "0" : "12px")};
  padding-top: ${(props) => (props.$total ? "12px" : "0")};
  border-top: ${(props) => (props.$total ? "1px solid #ddd" : "none")};
`;

const ModalDetailLabel = styled.span`
  font-size: 16px;
  color: #666;
`;

const ModalDetailValue = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #333;
`;

const ModalTotal = styled(ModalDetailValue)`
  font-size: 18px;
  font-weight: 700;
  color: #ff7a00;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;








