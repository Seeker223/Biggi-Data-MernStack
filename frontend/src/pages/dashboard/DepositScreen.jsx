//frontend/src/pages/dashboard/DepositScreen.jsx
import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Info,
  Clock
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { FEATURE_FLAGS } from '../../constants/featureFlags';

const SERVICE_CHARGE = 0;
const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 20;
const RECONCILE_ATTEMPTS = 3;

const DepositScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);

  // Feature flag check
  if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
    return (
      <PageContainer>
        <ContentContainer>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px'
          }}>
            <AlertCircle size={48} color="#FF7A00" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#000' }}>
              Deposits Temporarily Disabled
            </h2>
            <p style={{ textAlign: 'center', color: '#444', marginBottom: '24px', lineHeight: '1.5' }}>
              Deposits are disabled while we undergo Play Store review.
            </p>
            <PrimaryButton onClick={() => navigate(-1)}>
              Return
            </PrimaryButton>
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [txRef, setTxRef] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  // Refs
  const pollTimer = useRef(null);
  const pollCount = useRef(0);
  const reconcileAttempts = useRef(0);
  const currentTxRef = useRef(null);

  /* ---------------- TOAST ---------------- */
  const showToast = (msg, type = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 3500);
  };

  /* ---------------- CLEANUP ---------------- */
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      currentTxRef.current = null;
    };
  }, []);

  /* ---------------- AMOUNT VALIDATION ---------------- */
  const enteredAmount = Number(amount) > 0 ? Number(amount) : 0;
  const totalAmount = enteredAmount + SERVICE_CHARGE;
  const isValidAmount = () => enteredAmount >= 100 && enteredAmount <= 1000000;

  /* ---------------- STOP POLLING ---------------- */
  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    pollCount.current = 0;
    setIsProcessing(false);
    currentTxRef.current = null;
  };

  /* ---------------- MANUAL RECONCILIATION ---------------- */
  const attemptReconciliation = async (reference) => {
    if (reconcileAttempts.current >= RECONCILE_ATTEMPTS) {
      showToast("Maximum reconciliation attempts reached", "error");
      return false;
    }

    try {
      reconcileAttempts.current += 1;
      showToast(
        `Attempting reconciliation (${reconcileAttempts.current}/${RECONCILE_ATTEMPTS})`,
        "info"
      );

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, simulate success
      showToast("Payment reconciled successfully! 🎉", "success");
      await refreshUser();
      setAmount("");
      setPaymentStatus("success");
      stopPolling();
      return true;

    } catch (error) {
      showToast("Reconciliation failed. Try again.", "error");
      return false;
    }
  };

  /* ---------------- ENHANCED POLLING ---------------- */
  const startPolling = async (reference) => {
    stopPolling();
    currentTxRef.current = reference;
    setPaymentStatus("pending");
    setIsProcessing(true);
    showToast("Payment received. Awaiting confirmation…", "info");

    pollTimer.current = setInterval(async () => {
      if (currentTxRef.current !== reference) {
        stopPolling();
        return;
      }

      pollCount.current += 1;

      // Simulate polling - in real app, call getDepositStatus API
      if (pollCount.current >= 3) {
        // Simulate success after 3 polls
        stopPolling();
        setPaymentStatus("success");
        showToast("Wallet credited successfully! 🎉", "success");
        setAmount("");
        await refreshUser();
        return;
      }

      // Stop polling after max attempts
      if (pollCount.current >= MAX_POLL_ATTEMPTS) {
        stopPolling();
        setPaymentStatus("idle");
        showToast(
          "Payment is still processing. Check your balance shortly.",
          "info"
        );

        // Show manual reconciliation option
        if (window.confirm(
          "Your payment is taking longer than expected. Would you like to manually reconcile?"
        )) {
          await attemptReconciliation(reference);
        }
      }
    }, POLL_INTERVAL);
  };

  /* ---------------- START PAYMENT ---------------- */
  const handleStartPayment = () => {
    if (!isValidAmount()) {
      if (enteredAmount < 100) {
        showToast("Minimum deposit is ₦100", "error");
      } else if (enteredAmount > 1000000) {
        showToast("Maximum deposit is ₦1,000,000", "error");
      }
      return;
    }

    if (isProcessing) {
      showToast("Please wait for current transaction to complete", "info");
      return;
    }

    const reference = `flw_${user?._id || 'user'}_${Date.now()}`;
    setTxRef(reference);
    setShowConfirm(true);
    reconcileAttempts.current = 0;
  };

  /* ---------------- FLUTTERWAVE INTEGRATION ---------------- */
  const handleFlutterwavePayment = () => {
    // Note: For web, you would use the Flutterwave web SDK
    // This is a mock implementation for the demo
    
    setShowConfirm(false);
    setIsProcessing(true);
    showToast("Redirecting to payment gateway...", "info");
    
    // Simulate payment processing
    setTimeout(() => {
      // For demo, simulate successful payment
      const reference = `flw_${user?._id || 'user'}_${Date.now()}`;
      startPolling(reference);
    }, 2000);
  };

  /* ---------------- STATUS BANNER ---------------- */
  const renderStatusBanner = () => {
    if (paymentStatus === "idle") return null;

    const config = {
      pending: { 
        text: "Payment processing…", 
        color: "#FF9800", 
        icon: <Clock size={20} /> 
      },
      success: { 
        text: "Payment successful 🎉", 
        color: "#28a745", 
        icon: <CheckCircle size={20} /> 
      },
      failed: { 
        text: "Payment failed", 
        color: "#ff5252", 
        icon: <XCircle size={20} /> 
      },
    };

    const statusConfig = config[paymentStatus];

    return (
      <StatusBanner $color={statusConfig.color}>
        {statusConfig.icon}
        <StatusText>{statusConfig.text}</StatusText>
      </StatusBanner>
    );
  };

  /* ---------------- MANUAL RECONCILE BUTTON ---------------- */
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
        {/* Toast */}
        {toastVisible && (
          <Toast $type={toastType}>
            <ToastText>{toastMessage}</ToastText>
          </Toast>
        )}

        {renderStatusBanner()}

        {/* Header */}
        <Header>
          <BackButton onClick={() => {
            if (isProcessing) {
              if (window.confirm(
                "A payment is being processed. Are you sure you want to leave?"
              )) {
                navigate(-1);
              }
            } else {
              navigate(-1);
            }
          }}>
            <ChevronLeft size={26} />
          </BackButton>
          <HeaderTitle>Deposit Funds</HeaderTitle>
          <div style={{ width: '26px' }} />
        </Header>

        {/* Main Content */}
        <MainContent>
          <Label>Enter Amount to Deposit</Label>
          <Input
            type="number"
            placeholder="₦ Amount (min ₦100, max ₦1,000,000)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
            $disabled={isProcessing}
          />

          <Breakdown>
            <BreakdownRow>
              <BreakdownLabel>Amount:</BreakdownLabel>
              <BreakdownValue>₦{enteredAmount.toLocaleString()}</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow>
              <BreakdownLabel>Service Charge:</BreakdownLabel>
              <BreakdownValue>₦{SERVICE_CHARGE}</BreakdownValue>
            </BreakdownRow>
            <BreakdownRow $total>
              <TotalLabel>Total:</TotalLabel>
              <TotalValue>₦{totalAmount.toLocaleString()}</TotalValue>
            </BreakdownRow>
          </Breakdown>

          {renderReconcileButton()}

          <PrimaryButton
            onClick={handleStartPayment}
            disabled={!isValidAmount() || isProcessing}
            $disabled={!isValidAmount() || isProcessing}
          >
            {isProcessing ? (
              <ProcessingContainer>
                <Spinner size={16} />
                <PayText>Processing...</PayText>
              </ProcessingContainer>
            ) : (
              <PayText>Pay ₦{totalAmount.toLocaleString()}</PayText>
            )}
          </PrimaryButton>

          <InfoBox>
            <Info size={18} />
            <InfoText>
              • Payments usually complete within 1-2 minutes{"\n"}
              • If balance doesn't update, use the reconcile button{"\n"}
              • Contact support if issues persist
            </InfoText>
          </InfoBox>
        </MainContent>

        {/* CONFIRMATION MODAL */}
        {showConfirm && (
          <ModalOverlay onClick={() => setShowConfirm(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <ModalTitle>Confirm Payment</ModalTitle>

              <ModalDetails>
                <ModalDetailRow>
                  <ModalDetailLabel>Amount:</ModalDetailLabel>
                  <ModalDetailValue>₦{enteredAmount.toLocaleString()}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow>
                  <ModalDetailLabel>Service Charge:</ModalDetailLabel>
                  <ModalDetailValue>₦{SERVICE_CHARGE}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow $total>
                  <ModalDetailLabel>Total:</ModalDetailLabel>
                  <ModalTotal>₦{totalAmount.toLocaleString()}</ModalTotal>
                </ModalDetailRow>
              </ModalDetails>

              <ModalButtons>
                <SecondaryButton onClick={() => setShowConfirm(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton onClick={handleFlutterwavePayment}>
                  {isProcessing ? (
                    <Spinner size={16} />
                  ) : (
                    'Confirm & Pay'
                  )}
                </PrimaryButton>
              </ModalButtons>
            </ModalContent>
          </ModalOverlay>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

export default DepositScreen;

// Animations
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  overflow-y: auto;

  @media (min-height: 700px) {
    align-items: center;
    padding: 40px 20px;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Toast = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => 
    props.$type === "error" ? "#ff5252" :
    props.$type === "success" ? "#28a745" : "#333"
  };
  padding: 12px 24px;
  border-radius: 10px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${slideDown} 0.3s ease-out;
  max-width: 90%;
  text-align: center;
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
  background-color: ${props => props.$color};
  width: 100%;
  gap: 8px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StatusText = styled.span`
  color: #fff;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  
  &:hover {
    opacity: 0.7;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin: 0;
`;

const MainContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
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
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    outline: none;
    border-color: #FF7A00;
    background-color: #fff;
  }
  
  &:disabled {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
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
  margin-bottom: ${props => props.$total ? '0' : '8px'};
  padding-top: ${props => props.$total ? '12px' : '0'};
  border-top: ${props => props.$total ? '1px solid #ddd' : 'none'};
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
  color: #FF7A00;
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
  transition: all 0.2s;
  
  &:hover {
    background-color: #e5e5e5;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const ReconcileText = styled.span`
  color: #FF7A00;
  font-weight: 600;
  font-size: 14px;
`;

const PrimaryButton = styled.button`
  background-color: ${props => props.$disabled ? '#ccc' : '#FF7A00'};
  padding: 18px;
  border-radius: 12px;
  border: none;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: ${props => props.$disabled ? 'none' : '0 4px 12px rgba(255, 122, 0, 0.3)'};
  width: 100%;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.$disabled ? '#ccc' : '#E56A00'};
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const ProcessingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Spinner = styled.div`
  width: ${props => props.size || 16}px;
  height: ${props => props.size || 16}px;
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
  font-family: inherit;
  font-weight: 600;
  font-size: 16px;
  color: #666;
  transition: all 0.2s;
  flex: 1;
  margin-right: 10px;
  
  &:hover {
    background-color: #e5e5e5;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  animation: ${slideDown} 0.3s ease-out;
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
  margin-bottom: ${props => props.$total ? '0' : '12px'};
  padding-top: ${props => props.$total ? '12px' : '0'};
  border-top: ${props => props.$total ? '1px solid #ddd' : 'none'};
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
  color: #FF7A00;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;