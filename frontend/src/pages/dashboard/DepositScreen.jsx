import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Info,
  Clock,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import {
  getTransactionSecurityStatus,
  getDepositStatus,
  getDepositFeeSettings,
  reconcilePayment,
  setTransactionPin,
  verifyTransactionPin,
  verifyFlutterwavePayment,
} from "../../services/api";
import TransactionAuthSheet from "../../components/TransactionAuthSheet";

const SERVICE_CHARGE = 5;
const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 20;
const RECONCILE_ATTEMPTS = 3;
const FLUTTERWAVE_PUBLIC_KEY =
  import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY ||
  import.meta.env.VITE_FLUTTERWAVE_KEY ||
  import.meta.env.EXPO_PUBLIC_FLUTTERWAVE_KEY ||
  "";

const DepositScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser } = useContext(AuthContext);

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [txRef, setTxRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionPin, setTransactionPin] = useState("");
  const [pinConfigured, setPinConfigured] = useState(Boolean(user?.transactionPinEnabled));
  const [feeSettings, setFeeSettings] = useState({
    enabled: true,
    flatFee: SERVICE_CHARGE,
    percentFee: 0,
    minFee: 0,
    maxFee: 0,
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  const pollTimer = useRef(null);
  const pollCount = useRef(0);
  const reconcileAttempts = useRef(0);
  const currentTxRef = useRef("");
  const pendingAmountRef = useRef(0);

  const showToast = (msg, type = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      currentTxRef.current = "";
    };
  }, []);

  useEffect(() => {
    setPinConfigured(Boolean(user?.transactionPinEnabled));
  }, [user?.transactionPinEnabled]);

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

  const enteredAmount = Number(amount) > 0 ? Number(amount) : 0;
  const computeFee = (value) => {
    if (!feeSettings?.enabled) return 0;
    const flat = Number(feeSettings.flatFee || 0);
    const pct = Number(feeSettings.percentFee || 0);
    let fee = flat + (pct > 0 ? (value * pct) / 100 : 0);
    const minFee = Number(feeSettings.minFee || 0);
    const maxFee = Number(feeSettings.maxFee || 0);
    if (minFee > 0 && fee < minFee) fee = minFee;
    if (maxFee > 0 && fee > maxFee) fee = maxFee;
    return Math.max(0, Math.round(fee));
  };
  const serviceCharge = computeFee(enteredAmount);
  const totalAmount = enteredAmount + serviceCharge;
  const isValidAmount = () => enteredAmount >= 100 && enteredAmount <= 1000000;

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    pollCount.current = 0;
    setIsProcessing(false);
    currentTxRef.current = "";
    pendingAmountRef.current = 0;
    setTransactionPin("");
  };

  const loadFlutterwaveCheckout = async () => {
    if (window.FlutterwaveCheckout) return true;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.flutterwave.com/v3.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const attemptReconciliation = async (reference) => {
    if (reconcileAttempts.current >= RECONCILE_ATTEMPTS) {
      showToast("Maximum reconciliation attempts reached", "error");
      return false;
    }

    try {
      reconcileAttempts.current += 1;
      showToast(`Attempting reconciliation (${reconcileAttempts.current}/${RECONCILE_ATTEMPTS})`, "info");
      const res = await reconcilePayment(reference, "", transactionPin.trim(), pendingAmountRef.current);
      if (res?.data?.success) {
        showToast("Payment reconciled successfully!", "success");
        await refreshUser();
        setAmount("");
        setPaymentStatus("success");
        stopPolling();
        return true;
      }
      showToast(res?.data?.message || "Reconciliation failed. Try again.", "error");
      return false;
    } catch (error) {
      showToast(error?.response?.data?.message || "Reconciliation failed. Try again.", "error");
      return false;
    }
  };

  const startPolling = (reference) => {
    stopPolling();
    currentTxRef.current = reference;
    setPaymentStatus("pending");
    setIsProcessing(true);
    showToast("Payment received. Awaiting confirmation...", "info");

    pollTimer.current = setInterval(async () => {
      if (currentTxRef.current !== reference) {
        stopPolling();
        return;
      }

      pollCount.current += 1;
      try {
        const res = await getDepositStatus(reference);
        const status = String(res?.data?.status || "").toLowerCase();
        if (status === "successful") {
          stopPolling();
          setPaymentStatus("success");
          showToast("Wallet credited successfully!", "success");
          setAmount("");
          await refreshUser();
          return;
        }
        if (status === "failed") {
          stopPolling();
          setPaymentStatus("failed");
          showToast("Payment failed", "error");
          return;
        }
      } catch {
        // keep polling
      }

      if (pollCount.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setPaymentStatus("idle");
        showToast("Payment is still processing. Check your balance shortly.", "info");
      }
    }, POLL_INTERVAL);
  };

  const handleStartPayment = () => {
    if (!isValidAmount()) {
      if (enteredAmount < 100) showToast("Minimum deposit is N100", "error");
      else if (enteredAmount > 1000000) showToast("Maximum deposit is N1,000,000", "error");
      return;
    }

    if (isProcessing) {
      showToast("Please wait for current transaction to complete", "info");
      return;
    }
    (async () => {
      try {
        const res = await getTransactionSecurityStatus();
        setPinConfigured(Boolean(res?.data?.security?.transactionPinEnabled));
      } catch {
        // keep current local status
      }
      setShowAuthSheet(true);
    })();
  };

  const handleAuthSelection = async ({ transactionPin: selectedPin = "", setupPin = "" }) => {
    const pinValue = String(selectedPin || "").trim();
    const setupPinValue = String(setupPin || pinValue).trim();
    let pinJustCreated = false;
    if (!pinConfigured) {
      try {
        await setTransactionPin(setupPinValue);
        setPinConfigured(true);
        updateUser?.({ transactionPinEnabled: true });
        await refreshUser();
        pinJustCreated = true;
        showToast("Transaction PIN created successfully.", "success");
      } catch (error) {
        showToast(error?.response?.data?.message || "Failed to create transaction PIN.", "error");
        return;
      }
    }
    if (!/^\d{4}$/.test(pinValue)) {
      showToast("Enter your 4-digit transaction PIN.", "error");
      return;
    }
    if (!pinJustCreated) {
      try {
        await verifyTransactionPin(pinValue);
        showToast("PIN verified successfully.", "success");
      } catch (error) {
        const message = error?.response?.data?.message || "Invalid transaction PIN.";
        if (/not enabled/i.test(message)) {
          setPinConfigured(false);
          showToast("PIN is not enabled yet. Please create a new PIN to continue.", "info");
        } else {
          showToast(message, "error");
        }
        return;
      }
    }

    setTransactionPin(pinValue);
    const reference = `flw_${user?._id || "user"}_${Date.now()}`;
    setTxRef(reference);
    reconcileAttempts.current = 0;
    pendingAmountRef.current = enteredAmount;
    setShowAuthSheet(false);
    setShowConfirm(true);
  };

  const handleFlutterwavePayment = async () => {
    setShowConfirm(false);
    setIsProcessing(true);

    if (!FLUTTERWAVE_PUBLIC_KEY) {
      showToast("Flutterwave key missing. Set VITE_FLUTTERWAVE_PUBLIC_KEY.", "error");
      setIsProcessing(false);
      return;
    }

    const loaded = await loadFlutterwaveCheckout();
    if (!loaded || !window.FlutterwaveCheckout) {
      showToast("Unable to load payment gateway", "error");
      setIsProcessing(false);
      return;
    }

    window.FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: totalAmount,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: user?.email || "user@example.com",
        name: user?.username || "User",
      },
      customizations: {
        title: "Biggi Data Company",
        description: "Wallet funding",
      },
      callback: async () => {
        try {
          const res = await verifyFlutterwavePayment(
            txRef,
            "",
            transactionPin.trim(),
            pendingAmountRef.current
          );
          if (res?.data?.success) {
            setPaymentStatus("success");
            showToast("Payment verified and wallet credited!", "success");
            setAmount("");
            await refreshUser();
            stopPolling();
            return;
          }
          startPolling(txRef);
        } catch (error) {
          const message = error?.response?.data?.message || "";
          if (/biometric/i.test(message)) {
            showToast(message, "error");
            setIsProcessing(false);
            return;
          }
          startPolling(txRef);
        }
      },
      onclose: () => {
        if (paymentStatus === "idle") setIsProcessing(false);
      },
    });
  };

  const renderStatusBanner = () => {
    if (paymentStatus === "idle") return null;
    const config = {
      pending: { text: "Payment processing...", color: "#FF9800", icon: <Clock size={20} /> },
      success: { text: "Payment successful", color: "#28a745", icon: <CheckCircle size={20} /> },
      failed: { text: "Payment failed", color: "#ff5252", icon: <XCircle size={20} /> },
    };
    const statusConfig = config[paymentStatus];
    return (
      <StatusBanner $color={statusConfig.color}>
        {statusConfig.icon}
        <StatusText>{statusConfig.text}</StatusText>
      </StatusBanner>
    );
  };

  const renderReconcileButton = () => {
    if (paymentStatus !== "pending" || !txRef || !isProcessing) return null;
    return (
      <ReconcileButton onClick={() => attemptReconciliation(txRef)}>
        <RefreshCw size={20} />
        <ReconcileText>Having issues? Tap here to reconcile</ReconcileText>
      </ReconcileButton>
    );
  };

  return (
    <PageContainer>
      <ContentContainer>
        {toastVisible && (
          <Toast $type={toastType}>
            <ToastText>{toastMessage}</ToastText>
          </Toast>
        )}

        {renderStatusBanner()}

        <Header>
          <BackButton
            onClick={() => {
              if (isProcessing) {
                setShowLeaveConfirm(true);
              } else {
                navigate(-1);
              }
            }}
          >
            <ChevronLeft size={26} />
          </BackButton>
          <HeaderTitle>Deposit Funds</HeaderTitle>
          <div style={{ width: "26px" }} />
        </Header>

        <MainContent>
          <Label>Enter Amount to Deposit</Label>
          <Input
            type="number"
            placeholder="N Amount (min N100, max N1,000,000)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
          />

          <Breakdown>
            <BreakdownRow>
              <BreakdownLabel>Amount:</BreakdownLabel>
              <BreakdownValue>N{enteredAmount.toLocaleString()}</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow>
              <BreakdownLabel>Service Charge:</BreakdownLabel>
              <BreakdownValue>N{serviceCharge}</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow $total>
              <TotalLabel>Total:</TotalLabel>
              <TotalValue>N{totalAmount.toLocaleString()}</TotalValue>
            </BreakdownRow>
          </Breakdown>

          {renderReconcileButton()}

          <PrimaryButton onClick={handleStartPayment} disabled={!isValidAmount() || isProcessing}>
            {isProcessing ? (
              <ProcessingContainer>
                <Spinner size={16} />
                <PayText>Processing...</PayText>
              </ProcessingContainer>
            ) : (
              <PayText>Pay N{totalAmount.toLocaleString()}</PayText>
            )}
          </PrimaryButton>

          <InfoBox>
            <Info size={18} />
            <InfoText>
              - Payments usually complete within 1-2 minutes{"\n"}- If balance doesn't update, use the
              reconcile button{"\n"}- Contact support if issues persist
            </InfoText>
          </InfoBox>
        </MainContent>

        {showConfirm && (
          <ModalOverlay onClick={() => setShowConfirm(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Confirm Payment</ModalTitle>
              <ModalDetails>
                <ModalDetailRow>
                  <ModalDetailLabel>Amount:</ModalDetailLabel>
                  <ModalDetailValue>N{enteredAmount.toLocaleString()}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow>
                  <ModalDetailLabel>Service Charge:</ModalDetailLabel>
                  <ModalDetailValue>N{serviceCharge}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow $total>
                  <ModalDetailLabel>Total:</ModalDetailLabel>
                  <ModalTotal>N{totalAmount.toLocaleString()}</ModalTotal>
                </ModalDetailRow>
              </ModalDetails>
              <ModalButtons>
                <SecondaryButton onClick={() => setShowConfirm(false)}>Cancel</SecondaryButton>
                <PrimaryButton onClick={handleFlutterwavePayment}>Confirm & Pay</PrimaryButton>
              </ModalButtons>
            </ModalContent>
          </ModalOverlay>
        )}

        {showLeaveConfirm && (
          <ModalOverlay onClick={() => setShowLeaveConfirm(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Transaction In Progress</ModalTitle>
              <ModalDetails>
                <ModalDetailLabel>
                  A payment is being processed. Are you sure you want to leave this page?
                </ModalDetailLabel>
              </ModalDetails>
              <ModalButtons>
                <SecondaryButton onClick={() => setShowLeaveConfirm(false)}>
                  Stay
                </SecondaryButton>
                <PrimaryButton
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    navigate(-1);
                  }}
                >
                  Leave
                </PrimaryButton>
              </ModalButtons>
            </ModalContent>
          </ModalOverlay>
        )}

        <TransactionAuthSheet
          visible={showAuthSheet}
          loading={isProcessing}
          title="Authorize Deposit"
          subtitle={pinConfigured ? "Enter your 4-digit PIN." : "Create a new 4-digit PIN to continue."}
          pinConfigured={pinConfigured}
          onClose={() => setShowAuthSheet(false)}
          onSubmit={handleAuthSelection}
        />
      </ContentContainer>
    </PageContainer>
  );
};

export default DepositScreen;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

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

const StatusBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin: 10px 0 20px;
  border-radius: 8px;
  background-color: ${(props) => props.$color};
  width: 100%;
  gap: 8px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StatusText = styled.span`
  color: #fff;
  font-weight: 600;
  font-size: 14px;
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

const ReconcileButton = styled.button`
  background-color: #f0f0f0;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
`;

const ReconcileText = styled.span`
  color: #ff7a00;
  font-weight: 600;
  font-size: 14px;
`;

const PrimaryButton = styled.button`
  background-color: ${(props) => (props.disabled ? "#ccc" : "#ff7a00")};
  padding: 18px;
  border-radius: 12px;
  border: none;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  width: 100%;
`;

const ProcessingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Spinner = styled.div`
  width: ${(props) => props.size || 16}px;
  height: ${(props) => props.size || 16}px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: ${spin} 1s linear infinite;
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
