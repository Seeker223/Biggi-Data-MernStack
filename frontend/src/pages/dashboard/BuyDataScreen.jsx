import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { ChevronLeft, ChevronDown, CheckCircle } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { buyData, getTransactionSecurityStatus, setTransactionPin, verifyTransactionPin } from "../../services/api";
import TransactionAuthSheet from "../../components/TransactionAuthSheet";

const BuyDataScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser, updateUser } = useContext(AuthContext);

  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState(null);
  const [networkCode, setNetworkCode] = useState(null);
  const [plan, setPlan] = useState(null);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pinConfigured, setPinConfigured] = useState(Boolean(user?.transactionPinEnabled));

  useEffect(() => {
    setPinConfigured(Boolean(user?.transactionPinEnabled));
  }, [user?.transactionPinEnabled]);

  useEffect(() => {
    if (location.state?.selectedNetwork) {
      const selectedNetwork = location.state.selectedNetwork;
      setNetwork(selectedNetwork);
      setNetworkCode(selectedNetwork?.code || selectedNetwork?.network || null);
    }
    if (location.state?.networkCode) setNetworkCode(location.state.networkCode);
    if (location.state?.selectedPlan) {
      const p = location.state.selectedPlan;
      setPlan(p);
      setPrice(Number(p.amount || p.price || 0));
    }
  }, [location.state]);

  const validate = () => {
    if (!phone) return "Enter phone number";
    if (phone.length !== 11) return "Phone number must be 11 digits";
    if (!networkCode) return "Select a network";
    if (!plan) return "Select a data plan";
    if (!price || price <= 0) return "Invalid plan price";
    return null;
  };

  const handlePay = async () => {
    const err = validate();
    if (err) return setErrorMsg(err);
    try {
      const res = await getTransactionSecurityStatus();
      setPinConfigured(Boolean(res?.data?.security?.transactionPinEnabled));
    } catch {
      // keep current local status
    }
    setShowAuthSheet(true);
  };

  const processPay = async ({ transactionPin = "" } = {}) => {
    setErrorMsg("");
    setLoading(true);

    const backendPlanId = plan.plan_id || plan.code || plan.id || plan._id;

    try {
      const pinValue = transactionPin.trim();
      if (!/^\d{4}$/.test(pinValue)) {
        setErrorMsg("Enter your 4-digit transaction PIN.");
        return;
      }

      const res = await buyData({
        mobile_no: phone,
        plan_id: backendPlanId,
        biometricProof: "",
        transactionPin: pinValue,
      });

      if (!res?.success) {
        setErrorMsg(res?.msg || "Unable to process request");
        return;
      }

      setSuccessModal(true);
      await refreshUser();

      setTimeout(() => {
        setSuccessModal(false);
        navigate("/buy-data-success", {
          state: {
            phone,
            network: network?.label || network?.network || network,
            plan: plan.name || plan.plan_name,
            price,
            reference: res?.reference,
          },
        });
      }, 1300);
    } catch (error) {
      console.log("BUY DATA ERROR:", error);
      const message =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to process request";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSelection = async (authPayload) => {
    const pinValue = String(authPayload?.transactionPin || "").trim();
    const setupPinValue = String(authPayload?.setupPin || pinValue).trim();
    let pinJustCreated = false;
    if (!pinConfigured) {
      try {
        await setTransactionPin(setupPinValue);
        setPinConfigured(true);
        updateUser?.({ transactionPinEnabled: true });
        await refreshUser();
        pinJustCreated = true;
      } catch (error) {
        setErrorMsg(error?.response?.data?.message || "Failed to create transaction PIN.");
        return;
      }
    }
    if (!pinJustCreated) {
      try {
        await verifyTransactionPin(pinValue);
      } catch (error) {
        const message = error?.response?.data?.message || "Invalid transaction PIN.";
        if (/not enabled/i.test(message)) {
          setPinConfigured(false);
          setErrorMsg("PIN is not enabled yet. Please create a new PIN to continue.");
        } else {
          setErrorMsg(message);
        }
        return;
      }
    }
    setShowAuthSheet(false);
    await processPay({ transactionPin: pinValue });
  };

  const goToSelectNetwork = () => {
    navigate("/select-network", {
      state: { returnTo: "/buy-data", selectedNetwork: network },
    });
  };

  const goToSelectPlan = () => {
    if (!network) return setErrorMsg("Select network first");
    navigate("/select-plan", {
      state: {
        selectedNetwork: network,
        networkCode,
        returnTo: "/buy-data",
      },
    });
  };

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </BackButton>
          <HeaderTitle>Buy Data</HeaderTitle>
          <div style={{ width: "22px" }} />
        </Header>

        <FormContainer>
          <FormTitle>Purchase Data Bundle</FormTitle>

          <Form>
            <InputGroup>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="08012345678"
                value={phone}
                maxLength={11}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                disabled={loading}
              />
            </InputGroup>

            <InputGroup>
              <Label>Select Network</Label>
              <Dropdown onClick={goToSelectNetwork} disabled={loading}>
                <DropdownText $placeholder={!network}>
                  {network?.label || network?.network || network || "Choose network"}
                </DropdownText>
                <ChevronDown size={18} />
              </Dropdown>
            </InputGroup>

            <InputGroup>
              <Label>Select Data Plan</Label>
              <Dropdown onClick={goToSelectPlan} disabled={loading || !network}>
                <DropdownText $placeholder={!plan}>
                  {plan ? plan.name || plan.plan_name : "Choose data plan"}
                </DropdownText>
                <ChevronDown size={18} />
              </Dropdown>
            </InputGroup>

            {price > 0 && (
              <PriceDisplay>
                <PriceLabel>Plan Amount:</PriceLabel>
                <PriceValue>N{price.toLocaleString()}</PriceValue>
              </PriceDisplay>
            )}

            {errorMsg && <ErrorMsg>{errorMsg}</ErrorMsg>}

            <PayButton onClick={handlePay} disabled={loading}>
              {loading ? (
                <LoadingContainer>
                  <Spinner />
                  <PayText>Processing...</PayText>
                </LoadingContainer>
              ) : (
                <PayText>Pay Now</PayText>
              )}
            </PayButton>

            <InfoText>
              - Ensure phone number is correct
              <br />
              - Network must match SIM card
              <br />
              - Data will be delivered instantly
            </InfoText>
          </Form>
        </FormContainer>
      </ContentContainer>

      {successModal && (
        <ModalOverlay>
          <SuccessBox>
            <CheckCircle size={70} color="#4CAF50" />
            <SuccessText>Transaction Successful</SuccessText>
            <SuccessSubtext>Redirecting to confirmation...</SuccessSubtext>
          </SuccessBox>
        </ModalOverlay>
      )}

      <TransactionAuthSheet
        visible={showAuthSheet}
        loading={loading}
        title="Authorize Data Purchase"
        subtitle={pinConfigured ? "Enter your 4-digit PIN." : "Create a new 4-digit PIN to continue."}
        pinConfigured={pinConfigured}
        onClose={() => setShowAuthSheet(false)}
        onSubmit={handleAuthSelection}
      />
    </PageContainer>
  );
};

export default BuyDataScreen;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0;
  @media (min-height: 700px) {
    align-items: flex-start;
    padding: 0;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 18px;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const BackButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 8px;
  &:hover { background-color: rgba(255, 255, 255, 0.15); }
`;

const HeaderTitle = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  text-align: center;
  flex: 1;
`;

const FormContainer = styled.div`
  background-color: #fff;
  border-radius: 20px;
  padding: 20px;
  margin: 0 16px 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  width: 100%;
`;

const FormTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin-bottom: 24px;
  text-align: center;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  color: #000;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
  &::placeholder { color: #999; }
  &:focus {
    outline: none;
    border-color: #ff7a00;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
  }
  &:disabled {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
`;

const Dropdown = styled.button`
  background-color: ${(props) => (props.disabled ? "#f0f0f0" : "#f8f9fa")};
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
`;

const DropdownText = styled.span`
  font-size: 16px;
  color: ${(props) => (props.$placeholder ? "#999" : "#000")};
`;

const PriceDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
`;

const PriceLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const PriceValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #ff7a00;
`;

const ErrorMsg = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  text-align: center;
`;

const PayButton = styled.button`
  background-color: #ff7a00;
  border: none;
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3);
  &:disabled {
    background-color: #ccc;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
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

const InfoText = styled.div`
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #ff7a00;
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

const SuccessBox = styled.div`
  background-color: #fff;
  padding: 32px 24px;
  border-radius: 20px;
  width: 100%;
  max-width: 320px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: ${slideUp} 0.3s ease-out;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
`;

const SuccessText = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #000;
`;

const SuccessSubtext = styled.div`
  font-size: 14px;
  color: #666;
`;
