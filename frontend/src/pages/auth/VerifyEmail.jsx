import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { CheckCircle, AlertCircle } from "lucide-react";
import { verifyEmailOtp, resendVerificationOtp } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithBiometricPayload } = useContext(AuthContext);

  const initialEmail = useMemo(() => {
    const stateEmail = location.state?.email || "";
    const params = new URLSearchParams(location.search);
    return stateEmail || params.get("email") || "";
  }, [location.state, location.search]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (message, type = "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const trimmedEmail = String(email || "").trim().toLowerCase();
    const code = String(otp || "").trim();
    if (!trimmedEmail) {
      showModal("Please enter your email.", "error");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      showModal("Enter the 6-digit code sent to your email.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmailOtp({ email: trimmedEmail, otp: code });
      if (res?.data?.token && res?.data?.user) {
        await loginWithBiometricPayload({
          token: res.data.token,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        });
      }
      showModal(res?.data?.message || "Email verified successfully.", "success");
      setTimeout(() => navigate("/"), 600);
    } catch (error) {
      showModal(
        error?.response?.data?.error || error?.response?.data?.message || "Verification failed.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = String(email || "").trim().toLowerCase();
    if (!trimmedEmail) {
      showModal("Please enter your email first.", "error");
      return;
    }
    setResending(true);
    try {
      const res = await resendVerificationOtp({ email: trimmedEmail });
      showModal(res?.data?.message || "Verification code sent.", "success");
    } catch (error) {
      showModal(
        error?.response?.data?.error || error?.response?.data?.message || "Failed to resend code.",
        "error"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <PageContainer>
      <Card>
        <Title>Verify Your Email</Title>
        <Subtitle>Enter the 6-digit code sent to your email.</Subtitle>

        <Form onSubmit={handleVerify}>
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="text"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify Email"}
          </PrimaryButton>
        </Form>

        <ResendRow>
          <ResendButton type="button" onClick={handleResend} disabled={resending}>
            {resending ? "Sending..." : "Resend code"}
          </ResendButton>
          <LinkText to="/login">Back to login</LinkText>
        </ResendRow>
      </Card>

      {modalVisible && (
        <ModalOverlay onClick={() => setModalVisible(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            {modalType === "success" ? (
              <CheckCircle size={40} color="#16A34A" />
            ) : (
              <AlertCircle size={40} color="#DC2626" />
            )}
            <ModalText>{modalMessage}</ModalText>
            <ModalButton onClick={() => setModalVisible(false)}>
              OK
            </ModalButton>
          </ModalCard>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default VerifyEmail;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 18px;
  padding: 28px 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  animation: ${fadeIn} 0.25s ease-out;
`;

const Title = styled.h1`
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 800;
  color: #000;
  text-align: center;
`;

const Subtitle = styled.p`
  margin: 0 0 18px;
  color: #666;
  font-size: 14px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Input = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  outline: none;
  &:focus {
    border-color: #ff7a00;
    box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.12);
  }
`;

const PrimaryButton = styled.button`
  background: #ff7a00;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResendRow = styled.div`
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ResendButton = styled.button`
  border: none;
  background: none;
  color: #ff7a00;
  font-weight: 700;
  cursor: pointer;
`;

const LinkText = styled(Link)`
  color: #666;
  font-size: 13px;
  text-decoration: none;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1200;
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 22px;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const ModalText = styled.p`
  text-align: center;
  color: #222;
  font-size: 14px;
  margin: 0;
`;

const ModalButton = styled.button`
  border: none;
  background: #ff7a00;
  color: #fff;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
`;
