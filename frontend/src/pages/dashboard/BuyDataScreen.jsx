// frontend/src/pages/dashboard/BuyDataScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { 
  ChevronLeft, 
  ChevronDown, 
  CheckCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const BuyDataScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useContext(AuthContext);

  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState(null);
  const [networkCode, setNetworkCode] = useState(null);
  const [plan, setPlan] = useState(null);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (location.state?.selectedNetwork) setNetwork(location.state.selectedNetwork);
    if (location.state?.networkCode) setNetworkCode(location.state.networkCode);
    if (location.state?.selectedPlan) {
      const p = location.state.selectedPlan;
      setPlan(p);
      setPrice(p.amount || p.price || 0);
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

  const generateReference = () => `BD${Date.now()}`;

  const handlePay = async () => {
    const err = validate();
    if (err) return setErrorMsg(err);

    setErrorMsg("");
    setLoading(true);

    const backendPlanId = plan.plan_id || plan.code || plan.id || plan._id;

    const payload = { 
      network: networkCode, 
      mobile_no: phone, 
      amount: price, 
      plan_id: backendPlanId, 
      reference: generateReference() 
    };

    console.log("Sending plan payload →", payload);

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock success response
      setSuccessModal(true);
      await refreshUser();
      
      setTimeout(() => {
        setSuccessModal(false);
        navigate('/buy-data-success', { 
          state: { 
            phone, 
            network, 
            plan: plan.name || plan.plan_name, 
            price 
          }
        });
      }, 1300);
      
    } catch (error) {
      console.log("BUY DATA ERROR →", error);
      setErrorMsg(error?.response?.data?.msg || "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  const goToSelectNetwork = () => {
    navigate('/select-network');
  };

  const goToSelectPlan = () => {
    if (!network) return setErrorMsg("Select network first");
    navigate('/select-plan', { 
      state: { 
        selectedNetwork: network, 
        networkCode, 
        categories: ["SME", "GIFTING", "CG"] 
      }
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
          <div style={{ width: '22px' }} /> {/* Spacer for alignment */}
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
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                disabled={loading}
              />
            </InputGroup>

            <InputGroup>
              <Label>Select Network</Label>
              <Dropdown onClick={goToSelectNetwork} disabled={loading}>
                <DropdownText $placeholder={!network}>
                  {network || "Choose network"}
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
                <PriceValue>₦{price.toLocaleString()}</PriceValue>
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
              • Ensure phone number is correct<br />
              • Network must match SIM card<br />
              • Data will be delivered instantly
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
    </PageContainer>
  );
};

export default BuyDataScreen;

// Animations
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;

  @media (min-height: 700px) {
    align-items: center;
    padding: 40px 20px;
  }
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;

  @media (max-width: 480px) {
    margin-bottom: 20px;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  border-radius: 8px;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin: 0;
  text-align: center;
  flex: 1;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const FormContainer = styled.div`
  background-color: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  width: 100%;

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 12px;
  }
`;

const FormTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #000;
  margin-bottom: 24px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 18px;
    margin-bottom: 20px;
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  display: block;
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
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    outline: none;
    border-color: #FF7A00;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
  }
  
  &:disabled {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
  }
`;

const Dropdown = styled.div`
  background-color: ${props => props.disabled ? '#f0f0f0' : '#f8f9fa'};
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    border-color: #FF7A00;
    background-color: #fff;
  }
`;

const DropdownText = styled.span`
  font-size: 16px;
  color: ${props => props.$placeholder ? '#999' : '#000'};
`;

const PriceDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  margin-top: 8px;
`;

const PriceLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const PriceValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #FF7A00;
`;

const ErrorMsg = styled.div`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
`;

const PayButton = styled.button`
  background-color: #FF7A00;
  border: none;
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  width: 100%;
  margin-top: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3);
  
  &:hover:not(:disabled) {
    background-color: #E56A00;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(255, 122, 0, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
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
  border-left: 4px solid #FF7A00;
`;

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

  @media (max-width: 480px) {
    padding: 24px 20px;
    max-width: 280px;
  }
`;

const SuccessText = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #000;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const SuccessSubtext = styled.div`
  font-size: 14px;
  color: #666;
  text-align: center;
`;

// // frontend/src/pages/dashboard/BuyDataScreen.jsx
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import styled from 'styled-components';
// import { ChevronLeft } from 'lucide-react';

// const BuyDataScreen = () => {
//   const navigate = useNavigate();

//   return (
//     <Container>
//       <Header>
//         <BackButton onClick={() => navigate(-1)}>
//           <ChevronLeft size={26} />
//         </BackButton>
//         <HeaderTitle>Buy Data Bundle</HeaderTitle>
//         <div style={{ width: '26px' }} />
//       </Header>
      
//       <Content>
//         <h2>Coming Soon</h2>
//         <p>Data bundle purchase functionality will be available soon.</p>
//       </Content>
//     </Container>
//   );
// };

// export default BuyDataScreen;

// const Container = styled.div`
//   min-height: 100vh;
//   background-color: #fff;
//   padding: 20px;
// `;

// const Header = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   width: 100%;
//   margin-bottom: 24px;
//   padding-bottom: 16px;
//   border-bottom: 1px solid #f0f0f0;
// `;

// const BackButton = styled.button`
//   background: none;
//   border: none;
//   cursor: pointer;
//   padding: 4px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   color: #000;
  
//   &:hover {
//     opacity: 0.7;
//   }
// `;

// const HeaderTitle = styled.h1`
//   font-size: 18px;
//   font-weight: 700;
//   color: #000;
//   margin: 0;
// `;

// const Content = styled.div`
//   padding: 40px 20px;
//   text-align: center;
// `;