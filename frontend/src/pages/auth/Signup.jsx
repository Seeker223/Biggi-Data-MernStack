import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import styled, { keyframes } from 'styled-components';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const Signup = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    state: '',
    referralCode: '',
    password: '',
    confirmPassword: '',
  });

  const [secure, setSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref") || params.get("referral") || params.get("code");
    if (ref && !form.referralCode) {
      setForm((prev) => ({ ...prev, referralCode: ref }));
    }
  }, [location.search, form.referralCode]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, email, password, phoneNumber, birthDate, confirmPassword, state, referralCode } = form;

    if (!username || !email || !password || !confirmPassword) {
      showModal('Please fill all required fields.', 'error');
      return;
    }
    if (!state) {
      showModal('Please select your state.', 'error');
      return;
    }

    const phoneDigits = String(phoneNumber || "").replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      showModal('Please enter a valid phone number.', 'error');
      return;
    }

    const birthDateRegex = /^\d{2}-\d{2}-\d{2}$/;
    if (!birthDateRegex.test(birthDate)) {
      showModal('Date of Birth must be in DD-MM-YY format.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showModal('Passwords do not match.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal('Please enter a valid email address.', 'error');
      return;
    }

    if (password.length < 6) {
      showModal('Password must be at least 6 characters long.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        username,
        email: email.trim().toLowerCase(),
        password,
        phoneNumber,
        birthDate,
        state,
        referralCode: referralCode.trim(),
      });
      
      if (res.success && res.requiresVerification) {
        showModal('We sent a 6-digit code to your email. Please verify to continue.', 'success');
        setTimeout(() => {
          setModalVisible(false);
          navigate('/verify-email', { state: { email: email.trim().toLowerCase() } });
        }, 900);
      } else if (res.success) {
        showModal('Registration successful! Welcome to Biggi Data.', 'success');
        setTimeout(() => {
          setModalVisible(false);
          navigate('/');
        }, 1500);
      } else {
        showModal(res.error || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showModal('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (message, type = 'error') => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const formatDate = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      cleaned = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
    }
    if (cleaned.length >= 5) {
      cleaned = cleaned.substring(0, 5) + '-' + cleaned.substring(5, 7);
    }
    setForm({ ...form, birthDate: cleaned.substring(0, 8) });
  };

  const formatPhoneNumber = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    if (cleaned.startsWith('234')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    setForm({ ...form, phoneNumber: cleaned });
  };

  return (
    <PageContainer>
      <ContentContainer>
        {/* Header */}
        <HeaderContainer>
          <HeaderText>Create Account</HeaderText>
          <HeaderSubtitle>Join Biggi Data today</HeaderSubtitle>
        </HeaderContainer>

        {/* Main Content Card */}
        <MainCard>
          {/* Form */}
          <FormContainer onSubmit={handleRegister}>
            {/* Full Name */}
            <InputWrapper>
              <Label>Full Name *</Label>
              <TextInput
                type="text"
                placeholder="John Doe"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoCapitalize="words"
              />
            </InputWrapper>

            {/* Email */}
            <InputWrapper>
              <Label>Email *</Label>
              <TextInput
                type="email"
                placeholder="example@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
                autoCapitalize="none"
              />
            </InputWrapper>

            {/* Phone Number */}
            <InputWrapper>
              <Label>Phone Number *</Label>
              <TextInput
                type="tel"
                placeholder="+2348012345678"
                value={form.phoneNumber}
                onChange={(e) => formatPhoneNumber(e.target.value)}
              />
            </InputWrapper>

            {/* Birth Date */}
            <InputWrapper>
              <Label>Date of Birth *</Label>
              <TextInput
                type="text"
                placeholder="DD-MM-YY"
                value={form.birthDate}
                onChange={(e) => formatDate(e.target.value)}
                maxLength={8}
              />
            </InputWrapper>

            {/* State */}
            <InputWrapper>
              <Label>State *</Label>
              <SelectInput
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                <option value="">Select state</option>
                {NIGERIA_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </SelectInput>
            </InputWrapper>

            {/* Referral Code */}
            <InputWrapper>
              <Label>Invitation Referral Code (optional)</Label>
              <TextInput
                type="text"
                placeholder="Enter referral code"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
              />
            </InputWrapper>

            {/* Password */}
            <InputWrapper>
              <Label>Password *</Label>
              <PasswordContainer>
                <PasswordInput
                  type={secure ? 'password' : 'text'}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <ToggleSecureButton 
                  type="button"
                  onClick={() => setSecure(!secure)}
                  aria-label={secure ? 'Show password' : 'Hide password'}
                >
                  {secure ? <EyeOff size={20} /> : <Eye size={20} />}
                </ToggleSecureButton>
              </PasswordContainer>
              <PasswordHint>Minimum 6 characters</PasswordHint>
            </InputWrapper>

            {/* Confirm Password */}
            <InputWrapper>
              <Label>Confirm Password *</Label>
              <PasswordContainer>
                <PasswordInput
                  type={confirmSecure ? 'password' : 'text'}
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <ToggleSecureButton 
                  type="button"
                  onClick={() => setConfirmSecure(!confirmSecure)}
                  aria-label={confirmSecure ? 'Show password' : 'Hide password'}
                >
                  {confirmSecure ? <EyeOff size={20} /> : <Eye size={20} />}
                </ToggleSecureButton>
              </PasswordContainer>
            </InputWrapper>

            {/* Terms */}
            <TermsText>
              By continuing, you agree to{' '}
              <TermsHighlight href="/terms">Terms of Use</TermsHighlight> and{' '}
              <TermsHighlight href="/privacy">Privacy Policy</TermsHighlight>.
            </TermsText>

            {/* Sign Up Button */}
            <SignupButton type="submit" disabled={loading}>
              <SignupButtonText>
                {loading ? 'Signing Up...' : 'Create Account'}
              </SignupButtonText>
            </SignupButton>

            <LoginButton as={Link} to="/login">
              <LoginButtonText>Log In</LoginButtonText>
            </LoginButton>

            {/* Social signup disabled for now */}

            {/* Footer */}
            <FooterRow>
              <FooterText>Already have an account? </FooterText>
              <FooterLink as={Link} to="/login">
                Log In
              </FooterLink>
            </FooterRow>
          </FormContainer>
        </MainCard>
      </ContentContainer>

      {/* Success/Error Modal */}
      {modalVisible && (
        <ModalOverlay onClick={closeModal}>
          <ModalContainer 
            $type={modalType} 
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === 'success' ? (
              <CheckCircle size={48} color="#16A34A" />
            ) : (
              <AlertCircle size={48} color="#DC2626" />
            )}
            <ModalText>{modalMessage}</ModalText>
            <ModalButton onClick={closeModal}>
              <ModalButtonText>
                {modalType === 'success' ? 'Continue' : 'Try Again'}
              </ModalButtonText>
            </ModalButton>
          </ModalContainer>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Signup;

const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Abuja",
  "Zamfara",
];

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #ffffff;
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
  background-color: #000000;
  border-bottom-left-radius: 60px;
  border-bottom-right-radius: 60px;
  width: 100%;
  max-width: 440px;
  padding-top: 64px;
  padding-bottom: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const HeaderText = styled.h1`
  color: #FF8000;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 26px;
  }

  @media (max-width: 360px) {
    font-size: 24px;
  }
`;

const HeaderSubtitle = styled.p`
  color: #FFFFFF;
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 13px;
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
  padding: 32px 24px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 480px) {
    padding: 28px 20px 40px;
  }

  @media (max-width: 360px) {
    padding: 24px 16px 36px;
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
  margin-bottom: 6px;
  display: block;
  font-size: 14px;
  line-height: 1.4;
`;

const TextInput = styled.input`
  width: 100%;
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  color: #111827;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: #9CA3AF;
  }
  
  &:focus {
    outline: none;
    border-color: #FF8000;
    background-color: #FFFFFF;
  }

  @media (max-width: 480px) {
    font-size: 15px;
    padding: 13px 16px;
  }

  @media (max-width: 360px) {
    font-size: 14px;
    padding: 12px 14px;
  }
`;

const PasswordContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 0 16px;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #FF8000;
    background-color: #FFFFFF;
  }
`;

const PasswordInput = styled(TextInput)`
  border: none;
  padding: 14px 0;
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

const PasswordHint = styled.p`
  color: #6B7280;
  font-size: 12px;
  margin-top: 4px;
  margin-left: 4px;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const TermsText = styled.p`
  color: #4B5563;
  font-size: 12px;
  margin-top: 16px;
  text-align: center;
  line-height: 18px;
  max-width: 360px;
  margin-bottom: 0;

  @media (max-width: 480px) {
    font-size: 11px;
    line-height: 16px;
  }
`;

const TermsHighlight = styled.a`
  font-weight: 600;
  color: #000;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SignupButton = styled.button`
  background-color: #000;
  width: 100%;
  max-width: 360px;
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
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
    padding: 15px;
    margin-top: 20px;
  }

  @media (max-width: 360px) {
    padding: 14px;
  }
`;

const SignupButtonText = styled.span`
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



const FooterRow = styled.div`
  display: flex;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
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
  width: 100%;
  max-width: 400px;
  padding: 24px;
  border-radius: 16px;
  align-items: center;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.$type === 'success' ? '#16A34A' : '#DC2626'};
  animation: ${fadeIn} 0.3s ease-out;

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 14px;
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
  text-align: center;
  margin: 16px 0;
  line-height: 24px;
  width: 100%;

  @media (max-width: 480px) {
    font-size: 15px;
    margin: 14px 0;
    line-height: 22px;
  }

  @media (max-width: 360px) {
    font-size: 14px;
    margin: 12px 0;
    line-height: 20px;
  }
`;

const ModalButton = styled.button`
  background-color: #000;
  border-radius: 8px;
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  min-width: 120px;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #333;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    padding: 11px 20px;
    min-width: 110px;
  }

  @media (max-width: 360px) {
    padding: 10px 18px;
    min-width: 100px;
  }
`;

const ModalButtonText = styled.span`
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  display: block;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const LoginButton = styled.button`
  background-color: #FF8000;
  width: 100%;
  max-width: 360px;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #E56A00;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(209, 213, 219, 0.3);
  }
`;

const LoginButtonText = styled.span`
  color: #FFFFFF;
  font-weight: 600;
  font-size: 15px;
`;

const SelectInput = styled.select`
  width: 100%;
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  color: #111827;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #FF8000;
    background-color: #FFFFFF;
  }

  @media (max-width: 480px) {
    font-size: 15px;
    padding: 13px 16px;
  }

  @media (max-width: 360px) {
    font-size: 14px;
    padding: 12px 14px;
  }
`;
