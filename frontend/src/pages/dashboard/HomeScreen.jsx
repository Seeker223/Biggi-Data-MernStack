//frontend/src/pages/dashboard/HomeScreen.jsx
// This is the HomeScreen component for the dashboard, providing an overview of the user's account, balances, and access to games and features.
import React, { useContext, useCallback, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { 
  Wifi, 
  Ticket, 
  Gamepad2, 
  Trophy, 
  Bell, 
  RefreshCw, 
  Camera, 
  Image as ImageIcon,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  ChevronRight,
  Wallet,
  LogOut,
  User
} from 'lucide-react';

import FloatingBottomNav from '../../components/FloatingBottomNav';
import { AuthContext } from '../../context/AuthContext';
import { FEATURE_FLAGS } from '../../constants/featureFlags';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { 
    user, 
    refreshUser, 
    authLoading, 
    updateUser,
    notificationCount,
    markNotificationsAsSeen,
    logout
  } = useContext(AuthContext);

  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [monthlyEligibility, setMonthlyEligibility] = useState({
    purchases: 0,
    required: 5,
    progress: 0,
    daysLeft: 0,
    isEligible: false
  });

  // Modal states
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permissionModalData, setPermissionModalData] = useState({
    title: "",
    message: "",
    type: "info"
  });
  
  const [monthlyGameModalVisible, setMonthlyGameModalVisible] = useState(false);
  const [monthlyGameModalData, setMonthlyGameModalData] = useState({
    title: "",
    message: "",
    isEligible: false
  });
  
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadModalData, setUploadModalData] = useState({
    title: "",
    message: "",
    type: "success"
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    refreshUser();
    calculateMonthlyEligibility();
  }, [user]);

  const calculateMonthlyEligibility = () => {
    const purchases = user?.dataBundleCount || 0;
    const required = 5;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    
    setMonthlyEligibility({
      purchases,
      required,
      progress: Math.min(100, (purchases / required) * 100),
      daysLeft: Math.max(0, daysLeft),
      isEligible: purchases >= required
    });
  };

  // Permission modal function
  const showPermissionModal = (title, message, type = "info") => {
    setPermissionModalData({ title, message, type });
    setPermissionModalVisible(true);
  };

  // Monthly game modal function
  const showMonthlyGameModal = (title, message, isEligible) => {
    setMonthlyGameModalData({ title, message, isEligible });
    setMonthlyGameModalVisible(true);
  };

  // Upload result modal function
  const showUploadModal = (title, message, type = "success") => {
    setUploadModalData({ title, message, type });
    setUploadModalVisible(true);
  };

  if (authLoading || !user) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    );
  }

  const mainBalance = Number(user.mainBalance || 0);
  const rewardBalance = Number(user.rewardBalance || 0);
  const tickets = Number(user.tickets || 0);

  const goToDeposit = () => navigate('./deposit');
  const goToWithdraw = () => navigate('/withdraw');
  const goToBundle = () => navigate('/buy-data');
  const goToRedeem = () => navigate('/redeem');
  const goToDraws = () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) return;
    navigate('/daily-draw');
  };
  
  const goToNotification = () => {
    markNotificationsAsSeen();
    navigate('/notifications');
  };

  const handleDailyGame = () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) return;
    if (tickets <= 0) return setTicketModalVisible(true);
    navigate('/daily-game');
  };

  const handleMonthlyGame = () => {
    if (monthlyEligibility.isEligible) {
      showMonthlyGameModal(
        "Monthly Draw Eligible! 🎉",
        FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
          ? `You've made ${monthlyEligibility.purchases} purchases this month.\n\nYou're automatically entered into the monthly draw (prize hidden).\n\nDraw happens at the end of the month (${monthlyEligibility.daysLeft} days left).`
          : `You've made ${monthlyEligibility.purchases} purchases this month.\n\nYou're automatically entered into the ₦5,000 monthly draw!\n\nDraw happens at the end of the month (${monthlyEligibility.daysLeft} days left).`,
        true
      );
    } else {
      showMonthlyGameModal(
        "Monthly Draw Eligibility",
        FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
          ? `You need ${monthlyEligibility.required} data purchases this month to qualify for the monthly draw (prize hidden).\n\nYour purchases this month: ${monthlyEligibility.purchases}/${monthlyEligibility.required}\nProgress: ${Math.round(monthlyEligibility.progress)}%\nDays left this month: ${monthlyEligibility.daysLeft}\n\nKeep buying data bundles to qualify!`
          : `You need ${monthlyEligibility.required} data purchases this month to qualify for the ₦5,000 monthly draw.\n\nYour purchases this month: ${monthlyEligibility.purchases}/${monthlyEligibility.required}\nProgress: ${Math.round(monthlyEligibility.progress)}%\nDays left this month: ${monthlyEligibility.daysLeft}\n\nKeep buying data bundles to qualify!`,
        false
      );
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setPreviewVisible(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoAction = (action) => {
    if (action === 'camera') {
      // For web, we'll use file input with capture attribute
      document.getElementById('camera-input').click();
    } else if (action === 'gallery') {
      document.getElementById('gallery-input').click();
    }
  };

  const uploadPhoto = async () => {
    if (!selectedImage) return;
    try {
      setIsUploading(true);
      // In a real app, you would upload to your backend here
      // For now, we'll simulate upload
      setTimeout(() => {
        updateUser({ photo: selectedImage });
        setPreviewVisible(false);
        setSelectedImage(null);
        showUploadModal("Success", "Profile photo updated successfully!", "success");
        setIsUploading(false);
      }, 1500);
    } catch (err) {
      showUploadModal("Error", "Failed to upload image. Try again.", "error");
      setIsUploading(false);
    }
  };

  return (
    <Container>
      {/* Hidden file inputs */}
      <input
        type="file"
        id="camera-input"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        id="gallery-input"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      <ScrollContainer>
        {/* HEADER */}
        <Header>
          <UserInfo>
            <AvatarContainer>
              <Avatar 
                src={user?.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                alt="Profile"
              />
              <AvatarOverlay 
                onClick={() => {
                  setPermissionModalData({
                    title: "Update Photo",
                    message: "Choose an option",
                    type: "choice",
                    choices: [
                      { text: "Take Photo", action: () => handlePhotoAction('camera') },
                      { text: "Choose from Gallery", action: () => handlePhotoAction('gallery') },
                      { text: "Cancel", action: () => setPermissionModalVisible(false) }
                    ]
                  });
                  setPermissionModalVisible(true);
                }}
              >
                {uploadingPhoto ? <SpinningRefresh size={20} /> : <Camera size={20} />}
              </AvatarOverlay>
            </AvatarContainer>
            <UserText>
              <WelcomeText>Hi, {user.username}</WelcomeText>
              <SubText>Welcome back</SubText>
            </UserText>
          </UserInfo>
          
          {/* NOTIFICATION BELL WITH BADGE */}
          <BellButton onClick={goToNotification}>
            <BellContainer>
              <BellIcon size={26} />
              {notificationCount > 0 && (
                <NotificationBadge>
                  <NotificationBadgeText>
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </NotificationBadgeText>
                </NotificationBadge>
              )}
            </BellContainer>
          </BellButton>
        </Header>

        {/* WALLET CARD */}
        <WalletCard>
          <BalanceRow>
            <div>
              <BalanceLabel>Main Balance</BalanceLabel>
              <Balance>₦{mainBalance.toLocaleString()}</Balance>
            </div>
            <ActionButtons>
              <ActionBtn onClick={goToDeposit}>
                <ActionText>Deposit</ActionText>
              </ActionBtn>
              <ActionBtn onClick={goToWithdraw}>
                <ActionText>Withdraw</ActionText>
              </ActionBtn>
            </ActionButtons>
          </BalanceRow>
          <Divider />
          <BalanceRow>
            <div>
              <BalanceLabel>Reward Balance</BalanceLabel>
              <Balance>₦{rewardBalance.toLocaleString()}</Balance>
            </div>
            <RedeemBtn 
              onClick={goToRedeem} 
              disabled={FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
            >
              <ActionText>Redeem</ActionText>
            </RedeemBtn>
          </BalanceRow>
        </WalletCard>

        {/* TICKETS */}
        <TicketText>
          🎫 Available Tickets:{" "}
          <TicketCount>{tickets}</TicketCount>
        </TicketText>
        <InfoText>
          ✅ Buy Any Bundle → Unlock Daily Games + Monthly Draw
        </InfoText>

        {/* WHITE SECTION */}
        <WhiteWrapper>
          <WhiteSection>
            {/* BUNDLE CARD */}
            <BundleCard>
              <BundleGlowOverlay />
              <BundleLeft>
                <WifiIcon size={28} />
                <BundleTitle>Buy Data Bundle Daily</BundleTitle>
                <SmallBtn onClick={goToBundle}>
                  <SmallBtnText>Buy Now</SmallBtnText>
                </SmallBtn>
              </BundleLeft>
              <DividerVertical />
              <BundleRight>
                <TicketIconContainer>
                  <TicketGlow />
                  <TicketIcon size={26} />
                  <TicketBadge>
                    <TicketBadgeText>{tickets}</TicketBadgeText>
                  </TicketBadge>
                </TicketIconContainer>
                <BundleDesc>Win Daily Tickets + Monthly Draw Entry!</BundleDesc>
              </BundleRight>
            </BundleCard>

            {/* DAILY GAME */}
            <GameCard>
              <GamepadIcon size={28} />
              <GameTitle>Daily Number Picker Game</GameTitle>
              <GameSubtitle>
                {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Win (prize hidden)" : "Win ₦2,000 Daily"}
              </GameSubtitle>
              <PlayBtn 
                onClick={handleDailyGame} 
                disabled={tickets <= 0 || FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
              >
                <PlayText>Play Now</PlayText>
              </PlayBtn>
            </GameCard>

            {/* MONTHLY GAME */}
            <MonthlyGameCard $pulse={monthlyEligibility.isEligible}>
              <MonthlyHeader>
                <TrophyIcon size={24} />
                <MonthlyTitle>Monthly Draw</MonthlyTitle>
                {monthlyEligibility.isEligible && (
                  <EligibleBadge>
                    <EligibleText>ELIGIBLE</EligibleText>
                  </EligibleBadge>
                )}
              </MonthlyHeader>
              
              <MonthlyPrize>
                {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Prize hidden" : "₦5,000"}
              </MonthlyPrize>
              <MonthlySubtitle>Monthly Jackpot</MonthlySubtitle>
              
              {/* Monthly Progress */}
              <ProgressContainer>
                <ProgressLabels>
                  <ProgressText>
                    {monthlyEligibility.purchases}/{monthlyEligibility.required} purchases
                  </ProgressText>
                  <ProgressPercent>
                    {Math.round(monthlyEligibility.progress)}%
                  </ProgressPercent>
                </ProgressLabels>
                <ProgressBar>
                  <ProgressFill 
                    $width={monthlyEligibility.progress} 
                    $color={monthlyEligibility.isEligible ? '#4CAF50' : '#8E2DE2'}
                  />
                </ProgressBar>
                <DaysLeftText>
                  {monthlyEligibility.daysLeft} days left this month
                </DaysLeftText>
              </ProgressContainer>
              
              <MonthlyBtn 
                onClick={handleMonthlyGame}
                $eligible={monthlyEligibility.isEligible}
              >
                {monthlyEligibility.isEligible ? (
                  <>
                    <CheckCircle size={18} />
                    <MonthlyBtnText>You're Eligible!</MonthlyBtnText>
                  </>
                ) : (
                  <>
                    <Info size={18} />
                    <MonthlyBtnText>Check Eligibility</MonthlyBtnText>
                  </>
                )}
              </MonthlyBtn>
            </MonthlyGameCard>
          </WhiteSection>
        </WhiteWrapper>
      </ScrollContainer>

      {/* PHOTO PREVIEW MODAL */}
      {previewVisible && (
        <ModalOverlay>
          <PreviewBox>
            <PreviewTitle>Preview Photo</PreviewTitle>
            <PreviewImage src={selectedImage} alt="Preview" />
            <PreviewBtns>
              <ModalBtn $secondary onClick={() => setPreviewVisible(false)}>
                <ModalBtnText>Cancel</ModalBtnText>
              </ModalBtn>
              <ModalBtn onClick={uploadPhoto} disabled={isUploading}>
                {isUploading ? (
                  <Spinner size={20} />
                ) : (
                  <ModalBtnText>Upload</ModalBtnText>
                )}
              </ModalBtn>
            </PreviewBtns>
          </PreviewBox>
        </ModalOverlay>
      )}

      {/* TICKETS MODAL */}
      {ticketModalVisible && (
        <ModalOverlay>
          <ModalBox>
            <AlertCircle size={42} color="#FF7A00" />
            <ModalTitle>No Tickets Available</ModalTitle>
            <ModalMsg>You need at least 1 ticket to play daily games.</ModalMsg>
            <ModalBtn onClick={goToBundle}>
              <ModalBtnText>Buy Data Bundle</ModalBtnText>
            </ModalBtn>
            <ModalBtn $secondary onClick={() => setTicketModalVisible(false)}>
              <ModalBtnText>Cancel</ModalBtnText>
            </ModalBtn>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* PERMISSION MODAL */}
      {permissionModalVisible && (
        <ModalOverlay>
          <ModalBox>
            {permissionModalData.type === "error" ? (
              <X size={42} color="#FF3B30" />
            ) : (
              <Info size={42} color="#FF7A00" />
            )}
            <ModalTitle>{permissionModalData.title}</ModalTitle>
            <ModalMsg>{permissionModalData.message}</ModalMsg>
            
            {permissionModalData.type === "choice" ? (
              <ModalChoiceContainer>
                {permissionModalData.choices?.map((choice, index) => (
                  <ModalBtn
                    key={index}
                    $secondary={choice.text === "Cancel"}
                    onClick={() => {
                      setPermissionModalVisible(false);
                      choice.action && choice.action();
                    }}
                  >
                    <ModalBtnText>{choice.text}</ModalBtnText>
                  </ModalBtn>
                ))}
              </ModalChoiceContainer>
            ) : (
              <ModalBtn onClick={() => setPermissionModalVisible(false)}>
                <ModalBtnText>OK</ModalBtnText>
              </ModalBtn>
            )}
          </ModalBox>
        </ModalOverlay>
      )}

      {/* MONTHLY GAME MODAL */}
      {monthlyGameModalVisible && (
        <ModalOverlay>
          <ModalBox>
            {monthlyGameModalData.isEligible ? (
              <Trophy size={42} color="#FFD700" />
            ) : (
              <Info size={42} color="#FF7A00" />
            )}
            <ModalTitle>{monthlyGameModalData.title}</ModalTitle>
            <ModalMsg style={{ whiteSpace: 'pre-line' }}>
              {monthlyGameModalData.message}
            </ModalMsg>
            <ModalBtnContainer>
              <ModalBtn 
                onClick={() => {
                  setMonthlyGameModalVisible(false);
                  if (monthlyGameModalData.isEligible) {
                    goToDraws();
                  } else {
                    goToBundle();
                  }
                }}
              >
                <ModalBtnText>
                  {monthlyGameModalData.isEligible ? "View Draws" : "Buy Data"}
                </ModalBtnText>
              </ModalBtn>
              <ModalBtn $secondary onClick={() => setMonthlyGameModalVisible(false)}>
                <ModalBtnText>Close</ModalBtnText>
              </ModalBtn>
            </ModalBtnContainer>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* UPLOAD RESULT MODAL */}
      {uploadModalVisible && (
        <ModalOverlay>
          <ModalBox>
            {uploadModalData.type === "success" ? (
              <CheckCircle size={42} color="#4CAF50" />
            ) : (
              <X size={42} color="#FF3B30" />
            )}
            <ModalTitle>{uploadModalData.title}</ModalTitle>
            <ModalMsg>{uploadModalData.message}</ModalMsg>
            <ModalBtn 
              $color={uploadModalData.type === "success" ? "#4CAF50" : "#FF3B30"}
              onClick={() => setUploadModalVisible(false)}
            >
              <ModalBtnText>OK</ModalBtnText>
            </ModalBtn>
          </ModalBox>
        </ModalOverlay>
      )}

      <FloatingBottomNav />
    </Container>
  );
};

export default HomeScreen;

// Animations
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
`;

const glow = keyframes`
  0%, 100% {
    opacity: 0.1;
    box-shadow: 0 0 20px rgba(255, 122, 0, 0.3);
  }
  50% {
    opacity: 0.4;
    box-shadow: 0 0 30px rgba(255, 122, 0, 0.6);
  }
`;

const ticketGlowAnim = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
`;

const fadeInUp = keyframes`
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
const Container = styled.div`
  min-height: 100vh;
  background-color: #000;
  position: relative;
  overflow-x: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #000;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 122, 0, 0.3);
  border-radius: 50%;
  border-top-color: #FF7A00;
  animation: ${spin} 1s linear infinite;
`;

const SpinningRefresh = styled(RefreshCw)`
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  color: #fff;
  margin-top: 10px;
  font-size: 14px;
`;

const ScrollContainer = styled.div`
  padding-bottom: 180px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 16px;
  padding: 0 4px;

  @media (max-width: 480px) {
    margin: 16px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const Avatar = styled.img`
  width: 55px;
  height: 55px;
  border-radius: 30px;
  border: 2px solid #FF7A00;
  object-fit: cover;

  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
  }
`;

const AvatarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const UserText = styled.div`
  display: flex;
  flex-direction: column;
`;

const WelcomeText = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const SubText = styled.p`
  color: #bbb;
  font-size: 14px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const BellButton = styled.button`
  background-color: #fff;
  padding: 12px;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const BellContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BellIcon = styled(Bell)`
  color: #FF7A00;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #FF3B30;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #000;
  z-index: 10;
`;

const NotificationBadgeText = styled.span`
  color: #fff;
  font-size: 10px;
  font-weight: 900;
  padding: 0 4px;
`;

const WalletCard = styled.div`
  background-color: #FFA500;
  border-radius: 15px;
  padding: 16px;
  margin: 0 16px 20px;
  animation: ${fadeInUp} 0.8s ease-out;

  @media (max-width: 480px) {
    margin: 0 12px 16px;
    padding: 14px;
  }
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const BalanceLabel = styled.div`
  color: #222;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const Balance = styled.div`
  font-size: 26px;
  font-weight: 800;
  color: #000;

  @media (max-width: 480px) {
    font-size: 22px;
  }

  @media (max-width: 360px) {
    font-size: 20px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ActionBtn = styled.button`
  background-color: #000;
  padding: 6px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #333;
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 480px) {
    padding: 5px 16px;
  }
`;

const ActionText = styled.span`
  color: #fff;
  font-weight: 600;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const RedeemBtn = styled(ActionBtn)`
  background-color: #FF7A00;

  &:hover {
    background-color: #E56A00;
  }

  &:disabled {
    background-color: #999;
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      background-color: #999;
    }
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: rgba(0, 0, 0, 0.2);
  margin: 10px 0;
`;

const TicketText = styled.div`
  color: #fff;
  font-size: 15px;
  text-align: center;
  margin-top: 10px;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const TicketCount = styled.span`
  color: #FF7A00;
  font-weight: bold;
`;

const InfoText = styled.div`
  color: #fff;
  font-size: 13px;
  margin-top: 8px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 12px;
    margin: 8px 16px;
  }
`;

const WhiteWrapper = styled.div`
  margin-top: 20px;
  background-color: #fff;
  border-top-left-radius: 40px;
  border-top-right-radius: 40px;
  overflow: hidden;
  width: 100%;

  @media (max-width: 480px) {
    border-top-left-radius: 30px;
    border-top-right-radius: 30px;
  }
`;

const WhiteSection = styled.div`
  background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%);
  padding-top: 25px;
  padding-bottom: 40px;
  min-height: 500px;
  padding-left: 16px;
  padding-right: 16px;

  @media (max-width: 480px) {
    padding: 20px 12px 40px;
    min-height: 400px;
  }
`;

const BundleCard = styled.div`
  background-color: #fff;
  border-radius: 20px;
  padding: 18px;
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  animation: ${fadeInUp} 0.7s ease-out 0.1s both;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
`;

const BundleGlowOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 20px;
  z-index: -1;
  animation: ${glow} 2s ease-in-out infinite;
`;

const BundleLeft = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const WifiIcon = styled(Wifi)`
  color: #FF7A00;
  margin-bottom: 8px;
`;

const BundleTitle = styled.h3`
  font-weight: 700;
  margin: 6px 0;
  font-size: 15px;
  color: #000;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const SmallBtn = styled.button`
  background-color: #000;
  border-radius: 8px;
  padding: 5px 14px;
  margin-top: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #333;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SmallBtnText = styled.span`
  font-size: 12px;
  color: #fff;
  font-weight: 500;
`;

const DividerVertical = styled.div`
  width: 1px;
  height: 80px;
  background-color: #ddd;
  margin: 0 10px;

  @media (max-width: 480px) {
    width: 80%;
    height: 1px;
    margin: 8px 0;
  }
`;

const BundleRight = styled.div`
  flex: 1.3;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const TicketIconContainer = styled.div`
  position: relative;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
`;

const TicketGlow = styled.div`
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #FF7A00;
  opacity: 0.2;
  animation: ${ticketGlowAnim} 1.8s ease-in-out infinite;
`;

const TicketIcon = styled(Ticket)`
  color: #000;
  position: relative;
  z-index: 1;
`;

const TicketBadge = styled.div`
  position: absolute;
  top: -10px;
  right: -12px;
  background-color: #FF7A00;
  border-radius: 12px;
  padding: 2px 6px;
  min-width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const TicketBadgeText = styled.span`
  color: #fff;
  font-weight: bold;
  font-size: 12px;
`;

const BundleDesc = styled.p`
  font-size: 13px;
  color: #333;
  line-height: 18px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const GameCard = styled.div`
  background-color: #222;
  border-radius: 16px;
  padding: 18px;
  align-items: center;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  animation: ${fadeInUp} 0.7s ease-out 0.2s both;
  animation: ${pulse} 1.8s ease-in-out infinite;

  @media (max-width: 480px) {
    padding: 16px;
    margin-top: 16px;
  }
`;

const GamepadIcon = styled(Gamepad2)`
  color: #fff;
  margin-bottom: 10px;
`;

const GameTitle = styled.h3`
  color: #fff;
  font-weight: 700;
  text-align: center;
  margin: 4px 0;
  font-size: 16px;

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const GameSubtitle = styled.p`
  color: #FFD700;
  font-size: 12px;
  margin-bottom: 8px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const PlayBtn = styled.button`
  background-color: #FF7A00;
  border-radius: 8px;
  padding: 8px 24px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 200px;

  &:hover:not(:disabled) {
    background-color: #E56A00;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #999;
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PlayText = styled.span`
  color: #fff;
  font-weight: 700;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const MonthlyGameCard = styled.div`
  background-color: #2B006A;
  border-radius: 16px;
  padding: 18px;
  margin-top: 18px;
  animation: ${fadeInUp} 0.7s ease-out 0.3s both;
  ${props => props.$pulse && css`
    animation: ${pulse} 1.5s ease-in-out infinite;
  `}

  @media (max-width: 480px) {
    padding: 16px;
    margin-top: 16px;
  }
`;

const MonthlyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
`;

const TrophyIcon = styled(Trophy)`
  color: #FFD700;
`;

const MonthlyTitle = styled.h3`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  margin-left: 8px;

  @media (max-width: 480px) {
    font-size: 16px;
    margin-left: 4px;
  }
`;

const EligibleBadge = styled.div`
  background-color: #4CAF50;
  padding: 4px 8px;
  border-radius: 10px;
`;

const EligibleText = styled.span`
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
`;

const MonthlyPrize = styled.h1`
  color: #FFD700;
  font-size: 32px;
  font-weight: 900;
  text-align: center;
  margin: 10px 0;

  @media (max-width: 480px) {
    font-size: 28px;
  }

  @media (max-width: 360px) {
    font-size: 24px;
  }
`;

const MonthlySubtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 14px;
  margin-bottom: 15px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: 15px;
`;

const ProgressLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const ProgressText = styled.span`
  color: #fff;
  font-size: 12px;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const ProgressPercent = styled.span`
  color: #FFD700;
  font-size: 12px;
  font-weight: 700;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const ProgressBar = styled.div`
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 3px;
  width: ${props => props.$width}%;
  background-color: ${props => props.$color};
  transition: width 0.5s ease;
`;

const DaysLeftText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin-top: 6px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const MonthlyBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  gap: 6px;
  background-color: ${props => props.$eligible ? '#4CAF50' : '#8E2DE2'};

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MonthlyBtnText = styled.span`
  color: #fff;
  font-weight: 700;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalBox = styled.div`
  background-color: #fff;
  padding: 25px;
  border-radius: 14px;
  width: 85%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    padding: 20px;
    width: 90%;
  }
`;

const ModalTitle = styled.h2`
  font-weight: bold;
  font-size: 18px;
  margin-top: 10px;
  text-align: center;
  color: #000;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const ModalMsg = styled.p`
  text-align: center;
  margin: 12px 0;
  color: #444;
  line-height: 20px;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
    line-height: 18px;
  }
`;

const ModalBtn = styled.button`
  background-color: ${props => props.$color || props.$secondary ? '#999' : '#FF7A00'};
  border-radius: 8px;
  padding: 12px 25px;
  margin-top: 8px;
  min-width: 120px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 10px 20px;
    min-width: 110px;
  }
`;

const ModalBtnText = styled.span`
  color: #fff;
  font-weight: bold;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const ModalBtnContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 10px;
`;

const ModalChoiceContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
`;

// Preview Modal
const PreviewBox = styled(ModalBox)`
  width: 90%;
  max-width: 400px;
`;

const PreviewTitle = styled(ModalTitle)`
  margin-bottom: 15px;
`;

const PreviewImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 100px;
  margin: 15px 0;
  border: 3px solid #FF7A00;
  object-fit: cover;

  @media (max-width: 480px) {
    width: 180px;
    height: 180px;
  }
`;

const PreviewBtns = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 15px;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }
`;