import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { CheckCircle, AlertCircle } from "lucide-react";
import { forgotPassword } from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");
  const navigate = useNavigate();

  const showModal = (message, type = "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (!trimmedEmail) {
      showModal("Please enter your email address.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(trimmedEmail);
      showModal(res?.data?.message || "Reset instructions sent to your email.", "success");
      setTimeout(() => {
        setModalVisible(false);
        navigate("/login");
      }, 800);
    } catch (error) {
      showModal(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "We couldn't send a reset link right now. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <ContentContainer>
        <HeaderContainer>
          <HeaderText>Reset Password</HeaderText>
        </HeaderContainer>

        <MainCard>
          <FormContainer onSubmit={handleSubmit}>
            <Title>Forgot your password?</Title>
            <Subtitle>
              Enter your email and we will send reset instructions if the account exists.
            </Subtitle>

            <InputWrapper>
              <Label>Email Address</Label>
              <TextInput
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
              />
            </InputWrapper>

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </PrimaryButton>

            <BackButton as={Link} to="/login">
              Back to Login
            </BackButton>
          </FormContainer>
        </MainCard>
      </ContentContainer>

      {modalVisible && (
        <ModalOverlay onClick={() => setModalVisible(false)}>
          <ModalContainer
            $type={modalType}
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === "success" ? (
              <CheckCircle size={40} color="#16A34A" />
            ) : (
              <AlertCircle size={40} color="#DC2626" />
            )}
            <ModalText>{modalMessage}</ModalText>
            <ModalButton onClick={() => setModalVisible(false)}>
              OK
            </ModalButton>
          </ModalContainer>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}

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

const HeaderContainer = styled.div`
  background-color: #000;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  width: 100%;
  max-width: 440px;
  padding: 50px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const HeaderText = styled.h1`
  color: #ff8000;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-align: center;
`;

const MainCard = styled.div`
  width: 100%;
  max-width: 440px;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FormContainer = styled.form`
  width: 100%;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h2`
  margin: 8px 0 6px;
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const Subtitle = styled.p`
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
  max-width: 360px;
`;

const InputWrapper = styled.div`
  width: 100%;
  margin-bottom: 16px;
  max-width: 360px;
`;

const Label = styled.label`
  color: #374151;
  font-weight: 600;
  margin-bottom: 4px;
  display: block;
  font-size: 14px;
  line-height: 1.4;
`;

const TextInput = styled.input`
  background-color: #e5e7eb;
  border-radius: 50px;
  padding: 12px 16px;
  font-size: 16px;
  color: #111827;
  border: none;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.2s ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    background-color: #f3f4f6;
  }
`;

const PrimaryButton = styled.button`
  background-color: #000;
  width: 83%;
  max-width: 300px;
  border-radius: 50px;
  padding: 12px;
  margin-top: 16px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  color: #fff;
  font-weight: 600;

  &:hover:not(:disabled) {
    background-color: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BackButton = styled(Link)`
  margin-top: 14px;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  font-size: 14px;
  padding: 4px;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease-out;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background-color: #fff;
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  align-items: center;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border-left: 5px solid
    ${(props) => (props.$type === "success" ? "#16A34A" : "#DC2626")};
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalText = styled.p`
  font-size: 16px;
  color: #111827;
  margin: 12px 0;
  text-align: center;
  line-height: 1.5;
  width: 100%;
`;

const ModalButton = styled.button`
  background-color: #ff8000;
  border-radius: 50px;
  padding: 10px 24px;
  border: none;
  cursor: pointer;
  margin-top: 8px;
  font-family: inherit;
  transition: all 0.2s ease;
  min-width: 100px;
  color: #fff;
  font-weight: bold;
`;
