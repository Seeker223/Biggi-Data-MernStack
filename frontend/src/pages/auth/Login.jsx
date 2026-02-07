import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import styled, { keyframes } from 'styled-components';
import { Eye, EyeOff, CheckCircle, AlertCircle, Facebook, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('error');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const showModal = (message, type = 'error') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showModal('Please enter your credentials.', 'error');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      showModal('Login successful!', 'success');
      setTimeout(() => {
        setModalVisible(false);
        navigate('/');
      }, 1200);
    } else {
      showModal(res.error || 'Invalid email or password.', 'error');
    }
  };

  return (
    <PageContainer>
      <ContentContainer>
        {/* Header */}
        <HeaderContainer>
          <HeaderText>Welcome</HeaderText>
        </HeaderContainer>

        {/* Main Content Card */}
        <MainCard>
          {/* Form */}
          <FormContainer onSubmit={handleLogin}>
            <InputWrapper>
              <Label>Username or Email</Label>
              <TextInput
                type="email"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
              />
            </InputWrapper>

            <InputWrapper>
              <Label>Password</Label>
              <PasswordContainer>
                <PasswordInput
                  type={secure ? 'password' : 'text'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <ToggleSecureButton 
                  type="button"
                  onClick={() => setSecure(!secure)}
                  aria-label={secure ? 'Show password' : 'Hide password'}
                >
                  {secure ? <EyeOff size={20} /> : <Eye size={20} />}
                </ToggleSecureButton>
              </PasswordContainer>
            </InputWrapper>

            <LoginButton type="submit" disabled={loading}>
              <LoginButtonText>
                {loading ? 'Logging In...' : 'Log In'}
              </LoginButtonText>
            </LoginButton>

            <ForgotButton as={Link} to="/forgot-password">
              Forgot Password?
            </ForgotButton>

            <SignupButton as={Link} to="/signup">
              Sign Up
            </SignupButton>

            <FingerprintText>
              Use <FingerprintHighlight>Fingerprint</FingerprintHighlight> To Access
            </FingerprintText>

            <SocialText>or sign up with</SocialText>
            
            <SocialRow>
              <SocialIcon type="button">
                <Facebook size={22} />
              </SocialIcon>
              <SocialIcon type="button">
                <Mail size={22} />
              </SocialIcon>
            </SocialRow>

            <FooterRow>
              <FooterText>Don't have an account? </FooterText>
              <FooterLink as={Link} to="/signup">
                Sign Up
              </FooterLink>
            </FooterRow>
          </FormContainer>
        </MainCard>
      </ContentContainer>

      {/* Modal */}
      {modalVisible && (
        <ModalOverlay onClick={() => setModalVisible(false)}>
          <ModalContainer 
            $type={modalType} 
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === 'success' ? (
              <CheckCircle size={40} color="#16A34A" />
            ) : (
              <AlertCircle size={40} color="#DC2626" />
            )}
            <ModalText>{modalMessage}</ModalText>
            <ModalButton onClick={() => setModalVisible(false)}>
              <ModalButtonText>OK</ModalButtonText>
            </ModalButton>
          </ModalContainer>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Login;

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
  color: #FF8000;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 22px;
  }

  @media (max-width: 360px) {
    font-size: 20px;
  }
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

  @media (max-width: 480px) {
    padding: 24px 20px;
  }

  @media (max-width: 360px) {
    padding: 20px 16px;
  }
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
  background-color: #E5E7EB;
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
    color: #9CA3AF;
  }
  
  &:focus {
    outline: none;
    background-color: #F3F4F6;
  }

  @media (max-width: 480px) {
    font-size: 15px;
    padding: 11px 16px;
  }

  @media (max-width: 360px) {
    font-size: 14px;
    padding: 10px 14px;
  }
`;

const PasswordContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #E5E7EB;
  border-radius: 50px;
  padding: 0 16px;
  transition: all 0.2s ease;

  &:focus-within {
    background-color: #F3F4F6;
  }
`;

const PasswordInput = styled(TextInput)`
  flex: 1;
  border: none;
  padding-right: 8px;
  background: transparent;
  
  &:focus {
    outline: none;
    background: transparent;
  }
`;

const ToggleSecureButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  
  &:hover {
    color: #374151;
  }
  
  &:focus {
    outline: none;
  }
`;

const LoginButton = styled.button`
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
  
  &:hover:not(:disabled) {
    background-color: #333;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    width: 83%;
    padding: 11px;
  }

  @media (max-width: 360px) {
    width: 85%;
    padding: 10px;
  }
`;

const LoginButtonText = styled.span`
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  display: block;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 15px;
  }

  @media (max-width: 360px) {
    font-size: 14px;
  }
`;

const ForgotButton = styled.button`
  margin-top: 12px;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  color: #6B7280;
  font-weight: 500;
  font-size: 14px;
  padding: 4px;
  
  &:hover {
    color: #4B5563;
  }
  
  &:focus {
    outline: none;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const SignupButton = styled.button`
  background-color: #E5E7EB;
  width: 83%;
  max-width: 300px;
  border-radius: 50px;
  padding: 12px;
  margin-top: 16px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #D1D5DB;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(209, 213, 219, 0.3);
  }

  @media (max-width: 480px) {
    width: 83%;
    padding: 11px;
  }

  @media (max-width: 360px) {
    width: 85%;
    padding: 10px;
  }
`;

const SignupButtonText = styled.span`
  color: #111827;
  font-weight: 600;
  font-size: 16px;
  display: block;
  text-align: center;
`;

const FingerprintText = styled.p`
  margin-top: 24px;
  color: #4B5563;
  text-align: center;
  font-size: 14px;
  margin-bottom: 0;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-top: 20px;
  }
`;

const FingerprintHighlight = styled.span`
  color: #FF8000;
  font-weight: 600;
`;

const SocialText = styled.p`
  margin-top: 16px;
  color: #6B7280;
  text-align: center;
  font-size: 14px;
  margin-bottom: 12px;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-top: 14px;
  }
`;

const SocialRow = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 12px;
  justify-content: center;
  gap: 24px;

  @media (max-width: 480px) {
    gap: 20px;
  }

  @media (max-width: 360px) {
    gap: 16px;
  }
`;

const SocialIcon = styled.button`
  padding: 8px;
  border: 1px solid #D1D5DB;
  border-radius: 50px;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #4B5563;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #F9FAFB;
    border-color: #9CA3AF;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.3);
  }

  @media (max-width: 480px) {
    width: 38px;
    height: 38px;
    padding: 7px;
  }

  @media (max-width: 360px) {
    width: 36px;
    height: 36px;
    padding: 6px;
  }
`;

const FooterRow = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 24px;
  justify-content: center;
  margin-bottom: 0;
  flex-wrap: wrap;
  gap: 4px;

  @media (max-width: 480px) {
    margin-top: 20px;
  }
`;

const FooterText = styled.span`
  color: #4B5563;
  font-size: 14px;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const FooterLink = styled(Link)`
  color: #FF8000;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  line-height: 1.5;
  
  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

// Modal Styles
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  border-left: 5px solid ${props => props.$type === 'success' ? '#16A34A' : '#DC2626'};
  animation: ${fadeIn} 0.3s ease-out;

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 16px;
    max-width: 320px;
  }

  @media (max-width: 360px) {
    padding: 16px;
    max-width: 280px;
  }
`;

const ModalText = styled.p`
  font-size: 16px;
  color: #111827;
  margin: 12px 0;
  text-align: center;
  line-height: 1.5;
  width: 100%;

  @media (max-width: 480px) {
    font-size: 15px;
    margin: 10px 0;
  }

  @media (max-width: 360px) {
    font-size: 14px;
  }
`;

const ModalButton = styled.button`
  background-color: #FF8000;
  border-radius: 50px;
  padding: 10px 24px;
  border: none;
  cursor: pointer;
  margin-top: 8px;
  font-family: inherit;
  transition: all 0.2s ease;
  min-width: 100px;
  
  &:hover {
    background-color: #E56A00;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 128, 0, 0.3);
  }

  @media (max-width: 480px) {
    padding: 9px 20px;
    min-width: 90px;
  }
`;

const ModalButtonText = styled.span`
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  display: block;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;