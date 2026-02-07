// frontend/src/pages/dashboard/WithdrawScreen.jsx
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
  Clock,
  Wallet,
  Shield,
  Search,
  X,
  Building,
  Flash
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { FEATURE_FLAGS } from '../../constants/featureFlags';

// Biggi Data Brand Colors
const BRAND_COLORS = {
  primary: "#FF7A00", // Orange
  primaryDark: "#E56A00", // Darker orange
  secondary: "#000000", // Black
  background: "#FFFFFF", // White
  cardBg: "#F8F9FA", // Light gray
  textPrimary: "#000000", // Black
  textSecondary: "#666666", // Gray
  success: "#28A745", // Green
  error: "#DC3545", // Red
  warning: "#FFC107", // Yellow
  info: "#17A2B8", // Teal
};

// Nigerian banks with codes (required for Flutterwave) - SORTED ALPHABETICALLY
const banks = [
  { name: "Access Bank", code: "044" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Guarantee Trust Bank (GTB)", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint", code: "50515" },
  { name: "Opay", code: "099" },
  { name: "Palmpay", code: "100" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Suntrust Bank", code: "100" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Union Bank", code: "032" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

const WITHDRAWAL_CHARGE = 0;
const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 1000000;

const WithdrawScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);

  // Feature flag check
  if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
    return (
      <PageContainer>
        <ContentContainer>
          <DisabledContainer>
            <AlertCircle size={48} color={BRAND_COLORS.primary} style={{ marginBottom: '16px' }} />
            <DisabledTitle>Withdrawals Temporarily Disabled</DisabledTitle>
            <DisabledText>Withdrawals are disabled while we undergo Play Store review.</DisabledText>
            <PrimaryButton onClick={() => navigate(-1)}>
              Return
            </PrimaryButton>
          </DisabledContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankList, setShowBankList] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  // Filter banks based on search
  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ---------------- TOAST ---------------- */
  const showToast = (msg, type = "info") => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);

    setTimeout(() => {
      setToastVisible(false);
    }, 3500);
  };

  /* ---------------- AMOUNT VALIDATION ---------------- */
  const enteredAmount = Number(amount) > 0 ? Number(amount) : 0;
  const totalAmount = enteredAmount + WITHDRAWAL_CHARGE;
  const isValidAmount = () => enteredAmount >= MIN_WITHDRAWAL && enteredAmount <= MAX_WITHDRAWAL;

  /* ---------------- VALIDATE ACCOUNT NUMBER ---------------- */
  const validateAccountNumber = async () => {
    if (!selectedBank || !accountNumber || accountNumber.length < 10) {
      showToast("Please select a bank and enter a valid account number", "error");
      return false;
    }

    try {
      setIsProcessing(true);
      
      // Simulate API call for account verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock verification response
      const mockAccountName = "John Doe"; // In real app, get from API
      setAccountName(mockAccountName);
      showToast("Account verified successfully", "success");
      return true;
      
    } catch (error) {
      console.log("Account verification error:", error);
      showToast("Account verification failed. Please check details.", "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------------- VALIDATE FORM ---------------- */
  const validateForm = () => {
    if (!isValidAmount()) {
      if (enteredAmount < MIN_WITHDRAWAL) {
        showToast(`Minimum withdrawal is ₦${MIN_WITHDRAWAL}`, "error");
      } else if (enteredAmount > MAX_WITHDRAWAL) {
        showToast(`Maximum withdrawal is ₦${MAX_WITHDRAWAL.toLocaleString()}`, "error");
      }
      return false;
    }

    if (!accountNumber || accountNumber.length < 10) {
      showToast("Please enter a valid 10-digit account number", "error");
      return false;
    }

    if (!selectedBank) {
      showToast("Please select a bank", "error");
      return false;
    }

    if (!accountName || accountName.trim().length < 2) {
      showToast("Please verify account name", "error");
      return false;
    }

    if (enteredAmount > (user?.mainBalance || 0)) {
      showToast("Insufficient balance", "error");
      return false;
    }

    return true;
  };

  /* ---------------- START WITHDRAWAL ---------------- */
  const handleStartWithdrawal = async () => {
    if (isProcessing) {
      showToast("Please wait for current transaction to complete", "info");
      return;
    }

    if (!validateForm()) return;

    setShowConfirm(true);
  };

  /* ---------------- PROCESS WITHDRAWAL ---------------- */
  const processWithdrawal = async () => {
    setIsProcessing(true);
    setShowConfirm(false);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user balance (in real app, this would be done via backend)
      showToast("Withdrawal initiated successfully! 🎉", "success");
      
      // Reset form
      setAmount("");
      setAccountNumber("");
      setAccountName("");
      setSelectedBank(null);
      
      // Refresh user data
      await refreshUser();
      
    } catch (error) {
      console.log("Withdrawal error:", error);
      showToast("Failed to process withdrawal. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------------- RENDER VERIFY BUTTON ---------------- */
  const renderVerifyButton = () => {
    if (!selectedBank || !accountNumber || accountNumber.length < 10 || isProcessing) {
      return null;
    }

    return (
      <VerifyButton onClick={validateAccountNumber} disabled={isProcessing}>
        <CheckCircle size={16} color={BRAND_COLORS.primary} />
        <VerifyText>Verify Account</VerifyText>
      </VerifyButton>
    );
  };

  /* ---------------- POPULAR BANKS ---------------- */
  const popularBanks = ["Opay", "GTB", "UBA", "First Bank", "Zenith", "Access"];

  return (
    <PageContainer>
      <ContentContainer>
        {/* Toast */}
        {toastVisible && (
          <Toast $type={toastType}>
            <ToastText>{toastMessage}</ToastText>
          </Toast>
        )}

        {/* HEADER */}
        <Header>
          <BackButton onClick={() => {
            if (isProcessing) {
              if (window.confirm(
                "A withdrawal is being processed. Are you sure you want to leave?"
              )) {
                navigate(-1);
              }
            } else {
              navigate(-1);
            }
          }}>
            <ChevronLeft size={26} />
          </BackButton>
          <HeaderTitle>Withdraw Funds</HeaderTitle>
          <div style={{ width: '26px' }} />
        </Header>

        {/* CONTENT */}
        <ScrollContainer>
          {/* BALANCE DISPLAY */}
          <BalanceCard>
            <BalanceRow>
              <div>
                <BalanceLabel>Available Balance</BalanceLabel>
                <BalanceAmount>
                  ₦{(user?.mainBalance || 0).toLocaleString()}
                </BalanceAmount>
              </div>
              <WalletIcon size={32} color={BRAND_COLORS.primary} />
            </BalanceRow>
            <BalanceDivider />
            <BalanceInfo>
              <Info size={16} color={BRAND_COLORS.textSecondary} />
              <BalanceInfoText>
                Min: ₦{MIN_WITHDRAWAL} • Max: ₦{MAX_WITHDRAWAL.toLocaleString()}
              </BalanceInfoText>
            </BalanceInfo>
          </BalanceCard>

          {/* FLUTTERWAVE LOGO */}
          <FlutterwaveBadge>
            <FlutterwaveLogo>
              <Flash size={20} color="#F5A623" />
              <FlutterwaveText>Flutterwave</FlutterwaveText>
            </FlutterwaveLogo>
            <FlutterwaveSubtext>Secure Payouts</FlutterwaveSubtext>
          </FlutterwaveBadge>

          {/* INPUT FIELDS */}
          <FormSection>
            <SectionTitle>Withdrawal Details</SectionTitle>

            {/* Bank Selection */}
            <InputContainer>
              <InputLabel>Select Bank</InputLabel>
              <BankSelect onClick={() => setShowBankList(true)} $disabled={isProcessing}>
                <BankSelectText $placeholder={!selectedBank}>
                  {selectedBank ? selectedBank.name : "Select bank..."}
                </BankSelectText>
                <ChevronIcon size={20} color={BRAND_COLORS.textSecondary} />
              </BankSelect>
            </InputContainer>

            {/* Account Number with Verify Button */}
            <InputContainer>
              <InputHeader>
                <InputLabel>Account Number</InputLabel>
                {renderVerifyButton()}
              </InputHeader>
              <Input
                type="text"
                placeholder="10-digit account number"
                value={accountNumber}
                onChange={(e) => {
                  const text = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAccountNumber(text);
                  if (text.length !== accountNumber.length) {
                    setAccountName("");
                  }
                }}
                disabled={isProcessing || !selectedBank}
                $disabled={isProcessing || !selectedBank}
              />
            </InputContainer>

            {/* Account Name (auto-filled or verified) */}
            <InputContainer>
              <InputLabel>Account Name</InputLabel>
              <AccountNameDisplay $verified={!!accountName}>
                <AccountNameText $verified={!!accountName}>
                  {accountName || "Account name will appear after verification"}
                </AccountNameText>
                {accountName && (
                  <CheckCircle size={20} color={BRAND_COLORS.success} />
                )}
              </AccountNameDisplay>
            </InputContainer>

            {/* Amount */}
            <InputContainer>
              <InputLabel>Amount to Withdraw</InputLabel>
              <Input
                type="number"
                placeholder="₦ Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
                $disabled={isProcessing}
                min={MIN_WITHDRAWAL}
                max={MAX_WITHDRAWAL}
              />
            </InputContainer>

            {/* BREAKDOWN */}
            <Breakdown>
              <BreakdownRow>
                <BreakdownLabel>Amount:</BreakdownLabel>
                <BreakdownValue>
                  ₦{enteredAmount.toLocaleString()}
                </BreakdownValue>
              </BreakdownRow>
              <BreakdownRow>
                <BreakdownLabel>Processing Fee:</BreakdownLabel>
                <BreakdownValue>₦{WITHDRAWAL_CHARGE}</BreakdownValue>
              </BreakdownRow>
              <BreakdownRow $total>
                <TotalLabel>Total Deducted:</TotalLabel>
                <TotalValue>
                  ₦{totalAmount.toLocaleString()}
                </TotalValue>
              </BreakdownRow>
            </Breakdown>
          </FormSection>

          {/* WITHDRAW BUTTON */}
          <WithdrawButton
            onClick={handleStartWithdrawal}
            disabled={!isValidAmount() || isProcessing || !accountName}
            $disabled={!isValidAmount() || isProcessing || !accountName}
          >
            {isProcessing ? (
              <ProcessingContainer>
                <Spinner size={16} />
                <WithdrawText>Processing...</WithdrawText>
              </ProcessingContainer>
            ) : (
              <WithdrawText>
                Withdraw ₦{totalAmount.toLocaleString()}
              </WithdrawText>
            )}
          </WithdrawButton>

          {/* INFO BOX */}
          <InfoBox>
            <ClockIcon size={18} color={BRAND_COLORS.textSecondary} />
            <InfoContent>
              <InfoText>
                • Powered by Flutterwave for secure transfers{"\n"}
                • Processing time: 24-48 hours{"\n"}
                • Ensure all details are correct before confirming
              </InfoText>
              <SecurityBadge>
                <Shield size={14} color={BRAND_COLORS.success} />
                <SecurityText>Secured by Flutterwave</SecurityText>
              </SecurityBadge>
            </InfoContent>
          </InfoBox>
        </ScrollContainer>

        {/* BANK SELECTION MODAL */}
        {showBankList && (
          <ModalOverlay onClick={() => setShowBankList(false)}>
            <BankModalContent onClick={e => e.stopPropagation()}>
              <BankModalHeader>
                <BankModalTitle>Select Bank</BankModalTitle>
                <CloseButton onClick={() => setShowBankList(false)}>
                  <X size={24} color={BRAND_COLORS.textPrimary} />
                </CloseButton>
              </BankModalHeader>
              
              {/* Search Input */}
              <SearchContainer>
                <Search size={20} color={BRAND_COLORS.textSecondary} />
                <SearchInput
                  type="text"
                  placeholder="Search bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <ClearSearch onClick={() => setSearchQuery("")}>
                    <X size={20} color={BRAND_COLORS.textSecondary} />
                  </ClearSearch>
                )}
              </SearchContainer>
              
              {/* Scrollable Bank List */}
              <BankListContainer>
                {filteredBanks.length > 0 ? (
                  <BankList>
                    {filteredBanks.map((bank) => (
                      <BankItem
                        key={bank.code}
                        $selected={selectedBank?.code === bank.code}
                        onClick={() => {
                          setSelectedBank(bank);
                          setShowBankList(false);
                          setSearchQuery("");
                          setAccountName("");
                        }}
                      >
                        <BankItemContent>
                          <BankIconContainer>
                            <Building size={22} color={selectedBank?.code === bank.code ? BRAND_COLORS.primary : BRAND_COLORS.textSecondary} />
                          </BankIconContainer>
                          <BankName $selected={selectedBank?.code === bank.code}>
                            {bank.name}
                          </BankName>
                        </BankItemContent>
                        {selectedBank?.code === bank.code && (
                          <CheckCircle size={22} color={BRAND_COLORS.primary} />
                        )}
                      </BankItem>
                    ))}
                  </BankList>
                ) : (
                  <EmptyContainer>
                    <AlertCircle size={40} color={BRAND_COLORS.textSecondary} />
                    <EmptyText>No banks found</EmptyText>
                  </EmptyContainer>
                )}
              </BankListContainer>
              
              {/* Popular Banks Section */}
              <PopularSection>
                <PopularTitle>Popular Banks</PopularTitle>
                <PopularScroll>
                  {popularBanks.map((bankName, index) => {
                    const popularBank = banks.find(b => b.name.includes(bankName));
                    if (!popularBank) return null;
                    
                    return (
                      <PopularChip
                        key={index}
                        onClick={() => {
                          setSelectedBank(popularBank);
                          setShowBankList(false);
                          setSearchQuery("");
                          setAccountName("");
                        }}
                      >
                        <PopularChipText>{bankName}</PopularChipText>
                      </PopularChip>
                    );
                  })}
                </PopularScroll>
              </PopularSection>
            </BankModalContent>
          </ModalOverlay>
        )}

        {/* CONFIRMATION MODAL */}
        {showConfirm && (
          <ModalOverlay onClick={() => !isProcessing && setShowConfirm(false)}>
            <ConfirmModalContent onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <Wallet size={32} color={BRAND_COLORS.primary} />
                <ModalTitle>Confirm Withdrawal</ModalTitle>
                <ModalSubtitle>via Flutterwave</ModalSubtitle>
              </ModalHeader>

              <ModalDetails>
                <ModalDetailRow>
                  <ModalDetailLabel>Bank:</ModalDetailLabel>
                  <ModalDetailValue>{selectedBank?.name}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow>
                  <ModalDetailLabel>Account Number:</ModalDetailLabel>
                  <ModalDetailValue>{accountNumber}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow>
                  <ModalDetailLabel>Account Name:</ModalDetailLabel>
                  <ModalDetailValue>{accountName}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow>
                  <ModalDetailLabel>Amount:</ModalDetailLabel>
                  <ModalDetailValue>
                    ₦{enteredAmount.toLocaleString()}
                  </ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow>
                  <ModalDetailLabel>Fee:</ModalDetailLabel>
                  <ModalDetailValue>₦{WITHDRAWAL_CHARGE}</ModalDetailValue>
                </ModalDetailRow>
                <ModalDetailRow $total>
                  <ModalDetailLabel>Total:</ModalDetailLabel>
                  <ModalTotal>
                    ₦{totalAmount.toLocaleString()}
                  </ModalTotal>
                </ModalDetailRow>
              </ModalDetails>

              <ModalWarning>
                <AlertCircle size={20} color={BRAND_COLORS.warning} />
                <ModalWarningText>
                  Please confirm all details are correct. Transactions cannot be reversed.
                </ModalWarningText>
              </ModalWarning>

              <ModalButtons>
                <ModalButton $cancel onClick={() => setShowConfirm(false)} disabled={isProcessing}>
                  <ModalButtonCancelText>Cancel</ModalButtonCancelText>
                </ModalButton>

                <ModalButton $confirm onClick={processWithdrawal} disabled={isProcessing}>
                  {isProcessing ? (
                    <Spinner size={16} />
                  ) : (
                    <ModalButtonConfirmText>Confirm Withdrawal</ModalButtonConfirmText>
                  )}
                </ModalButton>
              </ModalButtons>
            </ConfirmModalContent>
          </ModalOverlay>
        )}
      </ContentContainer>
    </PageContainer>
  );
};

export default WithdrawScreen;

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

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${BRAND_COLORS.background};
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

const DisabledContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
  background-color: ${BRAND_COLORS.background};
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
`;

const DisabledTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  color: ${BRAND_COLORS.textPrimary};
`;

const DisabledText = styled.p`
  text-align: center;
  color: ${BRAND_COLORS.textSecondary};
  margin-bottom: 24px;
  line-height: 1.5;
`;

const Toast = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${props => 
    props.$type === "error" ? BRAND_COLORS.error :
    props.$type === "success" ? BRAND_COLORS.success : BRAND_COLORS.secondary
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
  color: ${BRAND_COLORS.textPrimary};
  
  &:hover {
    opacity: 0.7;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: ${BRAND_COLORS.textPrimary};
  margin: 0;
`;

const ScrollContainer = styled.div`
  width: 100%;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  padding-bottom: 20px;
`;

const BalanceCard = styled.div`
  background-color: ${BRAND_COLORS.cardBg};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const BalanceLabel = styled.div`
  font-size: 14px;
  color: ${BRAND_COLORS.textSecondary};
  font-weight: 500;
`;

const BalanceAmount = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: ${BRAND_COLORS.textPrimary};
  margin-top: 4px;
`;

const WalletIcon = styled(Wallet)``;

const BalanceDivider = styled.div`
  height: 1px;
  background-color: #e0e0e0;
  margin: 12px 0;
`;

const BalanceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BalanceInfoText = styled.span`
  font-size: 12px;
  color: ${BRAND_COLORS.textSecondary};
  font-weight: 500;
`;

const FlutterwaveBadge = styled.div`
  background-color: #F5A62310;
  border: 1px solid #F5A62330;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
`;

const FlutterwaveLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const FlutterwaveText = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #F5A623;
`;

const FlutterwaveSubtext = styled.span`
  font-size: 12px;
  color: ${BRAND_COLORS.textSecondary};
`;

const FormSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${BRAND_COLORS.textPrimary};
  margin-bottom: 16px;
`;

const InputContainer = styled.div`
  margin-bottom: 16px;
`;

const InputHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${BRAND_COLORS.textPrimary};
`;

const VerifyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #FF7A0010;
  padding: 4px 8px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #FF7A0020;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const VerifyText = styled.span`
  font-size: 12px;
  color: ${BRAND_COLORS.primary};
  font-weight: 600;
`;

const Input = styled.input`
  background-color: ${BRAND_COLORS.cardBg};
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  border: 1px solid #e0e0e0;
  color: ${BRAND_COLORS.textPrimary};
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
  
  &::placeholder {
    color: ${BRAND_COLORS.textSecondary};
  }
  
  &:focus {
    outline: none;
    border-color: ${BRAND_COLORS.primary};
    background-color: #fff;
  }
  
  &:disabled {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
`;

const BankSelect = styled.div`
  background-color: ${props => props.$disabled ? '#f0f0f0' : BRAND_COLORS.cardBg};
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  border: 1px solid #e0e0e0;
  color: ${BRAND_COLORS.textPrimary};
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    border-color: ${BRAND_COLORS.primary};
  }
`;

const BankSelectText = styled.span`
  color: ${props => props.$placeholder ? BRAND_COLORS.textSecondary : BRAND_COLORS.textPrimary};
`;

const ChevronIcon = styled(ChevronLeft)`
  transform: rotate(-90deg);
`;

const AccountNameDisplay = styled.div`
  background-color: ${props => props.$verified ? '#28A74510' : BRAND_COLORS.cardBg};
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  border: 1px solid ${props => props.$verified ? BRAND_COLORS.success : '#e0e0e0'};
  color: ${BRAND_COLORS.textPrimary};
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccountNameText = styled.span`
  color: ${props => props.$verified ? BRAND_COLORS.success : BRAND_COLORS.textSecondary};
  font-weight: ${props => props.$verified ? '600' : '400'};
`;

const Breakdown = styled.div`
  background-color: ${BRAND_COLORS.cardBg};
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
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
  color: ${BRAND_COLORS.textSecondary};
`;

const BreakdownValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${BRAND_COLORS.textPrimary};
`;

const TotalLabel = styled(BreakdownLabel)`
  font-size: 16px;
  font-weight: 600;
  color: ${BRAND_COLORS.textPrimary};
`;

const TotalValue = styled(BreakdownValue)`
  font-size: 18px;
  font-weight: 700;
  color: ${BRAND_COLORS.primary};
`;

const WithdrawButton = styled.button`
  background-color: ${props => props.$disabled ? '#ccc' : BRAND_COLORS.primary};
  padding: 18px;
  border-radius: 12px;
  border: none;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: ${props => props.$disabled ? 'none' : '0 4px 12px rgba(255, 122, 0, 0.3)'};
  width: 100%;
  margin-top: 10px;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.$disabled ? '#ccc' : BRAND_COLORS.primaryDark};
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

const WithdrawText = styled.span`
  color: ${BRAND_COLORS.background};
  font-weight: 700;
  font-size: 16px;
`;

const InfoBox = styled.div`
  display: flex;
  background-color: #F8F9FA;
  padding: 16px;
  border-radius: 12px;
  margin-top: 20px;
  border-left: 4px solid ${BRAND_COLORS.primary};
`;

const ClockIcon = styled(Clock)``;

const InfoContent = styled.div`
  flex: 1;
  margin-left: 12px;
`;

const InfoText = styled.p`
  font-size: 12px;
  color: ${BRAND_COLORS.textSecondary};
  line-height: 18px;
  margin-bottom: 8px;
  white-space: pre-line;
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  background-color: #28A74510;
  padding: 4px 8px;
  border-radius: 6px;
`;

const SecurityText = styled.span`
  font-size: 11px;
  color: ${BRAND_COLORS.success};
  font-weight: 600;
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

const BankModalContent = styled.div`
  background-color: ${BRAND_COLORS.background};
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.3s ease-out;
`;

const BankModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
`;

const BankModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: ${BRAND_COLORS.textPrimary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: ${BRAND_COLORS.cardBg};
  margin: 10px 20px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  gap: 10px;
`;

const SearchInput = styled.input`
  flex: 1;
  font-size: 16px;
  color: ${BRAND_COLORS.textPrimary};
  border: none;
  background: none;
  outline: none;
  
  &::placeholder {
    color: ${BRAND_COLORS.textSecondary};
  }
`;

const ClearSearch = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BankListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
`;

const BankList = styled.div`
  display: flex;
  flex-direction: column;
`;

const BankItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  background-color: ${props => props.$selected ? '#FFF5E6' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.$selected ? '#FFF5E6' : '#f9f9f9'};
  }
`;

const BankItemContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const BankIconContainer = styled.div`
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BankName = styled.span`
  font-size: 16px;
  color: ${props => props.$selected ? BRAND_COLORS.primary : BRAND_COLORS.textPrimary};
  margin-left: 12px;
  flex: 1;
  font-weight: ${props => props.$selected ? '600' : '400'};
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

const EmptyText = styled.span`
  margin-top: 12px;
  font-size: 14px;
  color: ${BRAND_COLORS.textSecondary};
`;

const PopularSection = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
`;

const PopularTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${BRAND_COLORS.textSecondary};
  margin-bottom: 10px;
  display: block;
`;

const PopularScroll = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 5px 0;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const PopularChip = styled.button`
  background-color: #FF7A0010;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #FF7A0030;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
  
  &:hover {
    background-color: #FF7A0020;
  }
`;

const PopularChipText = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${BRAND_COLORS.primary};
`;

const ConfirmModalContent = styled.div`
  background-color: ${BRAND_COLORS.background};
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80%;
  animation: ${slideUp} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  margin-top: 12px;
  text-align: center;
  color: ${BRAND_COLORS.textPrimary};
`;

const ModalSubtitle = styled.span`
  font-size: 14px;
  color: ${BRAND_COLORS.textSecondary};
  margin-top: 4px;
  display: block;
`;

const ModalDetails = styled.div`
  background-color: ${BRAND_COLORS.cardBg};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const ModalDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${props => props.$total ? '0' : '12px'};
  padding-top: ${props => props.$total ? '12px' : '0'};
  border-top: ${props => props.$total ? '1px solid #ddd' : 'none'};
`;

const ModalDetailLabel = styled.span`
  font-size: 14px;
  color: ${BRAND_COLORS.textSecondary};
`;

const ModalDetailValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${BRAND_COLORS.textPrimary};
  text-align: right;
  flex: 1;
  margin-left: 10px;
`;

const ModalTotal = styled(ModalDetailValue)`
  font-size: 16px;
  font-weight: 700;
  color: ${BRAND_COLORS.primary};
`;

const ModalWarning = styled.div`
  display: flex;
  align-items: flex-start;
  background-color: #FFC10710;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 24px;
  gap: 8px;
`;

const ModalWarningText = styled.span`
  font-size: 12px;
  color: ${BRAND_COLORS.warning};
  flex: 1;
  line-height: 16px;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 10px;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  background-color: ${props => props.$cancel ? BRAND_COLORS.cardBg : props.disabled ? '#ccc' : BRAND_COLORS.primary};
  border: ${props => props.$cancel ? '1px solid #ddd' : 'none'};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

const ModalButtonCancelText = styled.span`
  color: ${BRAND_COLORS.textSecondary};
  font-weight: 600;
  font-size: 16px;
`;

const ModalButtonConfirmText = styled.span`
  color: ${BRAND_COLORS.background};
  font-weight: 700;
  font-size: 16px;
`;

const PrimaryButton = styled.button`
  background-color: ${BRAND_COLORS.primary};
  padding: 14px 28px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  color: ${BRAND_COLORS.background};
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${BRAND_COLORS.primaryDark};
  }
  
  &:active {
    transform: scale(0.98);
  }
`;