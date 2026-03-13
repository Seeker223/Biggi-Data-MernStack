// frontend/src/pages/dashboard/HomeScreen.jsx
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
  User,
} from 'lucide-react';

import FloatingBottomNav from '../../components/FloatingBottomNav';
import BrandLoader from '../../components/BrandLoader';
import { AuthContext } from '../../context/AuthContext';
import { FEATURE_FLAGS } from '../../constants/featureFlags';
import { getMonthlyEligibility, updateAvatar } from '../../services/api';

const HomeScreen = () => {
  const navigate = useNavigate();
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
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
  const [ticketModalMessage, setTicketModalMessage] = useState(
    "You need at least 1 ticket to play this game."
  );
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [monthlyEligibility, setMonthlyEligibility] = useState({
    purchases: 0,
    required: 5,
    progress: 0,
    daysLeft: 0,
    isEligible: false,
    raffleTicketsTotal: 0,
    raffleTicketsUnplayed: 0,
    raffleTicketsPlayed: 0,
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
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [referralModalVisible, setReferralModalVisible] = useState(false);
  const [referralWinModalVisible, setReferralWinModalVisible] = useState(false);
  const [referralWinModalData, setReferralWinModalData] = useState({ message: "", amount: null });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

  const loadMonthlyEligibility = useCallback(async () => {
    try {
      const res = await getMonthlyEligibility();
      const e = res?.data?.eligibility || {};
      const purchases = Number(e.purchases || 0);
      const required = Number(e.required || 5);
      const towardNext = purchases % required;
      const progress = Number(
        e.progress ?? Math.min(100, (towardNext / required) * 100)
      );
      setMonthlyEligibility({
        purchases,
        required,
        progress,
        daysLeft: Number(e.daysLeft || 0),
        isEligible: Boolean(e.isEligible),
        raffleTicketsTotal: Number(e.raffleTicketsTotal || 0),
        raffleTicketsUnplayed: Number(e.raffleTicketsUnplayed || 0),
        raffleTicketsPlayed: Number(e.raffleTicketsPlayed || 0),
      });
    } catch {
      // Keep last known eligibility values if the request fails.
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadMonthlyEligibility();
  }, [user?._id, user?.dataBundleCount, loadMonthlyEligibility]);

  useEffect(() => {
    if (user && !user.state) {
      setStateModalVisible(true);
    } else {
      setStateModalVisible(false);
    }
  }, [user?.state, user]);

  useEffect(() => {
    if (!user) {
      setReferralModalVisible(false);
      return;
    }

    const userId = user?._id || user?.id || "anonymous";
    const storageKey = `referral_modal_last_shown_${userId}`;
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    if (user.referredByCode) {
      setReferralModalVisible(false);
      localStorage.removeItem(storageKey);
      return;
    }

    const lastShownRaw = localStorage.getItem(storageKey);
    const lastShown = Number(lastShownRaw || 0);
    const shouldShow = !lastShown || Number.isNaN(lastShown) || now - lastShown >= DAY_MS;

    if (shouldShow) {
      setReferralModalVisible(true);
      localStorage.setItem(storageKey, String(now));
    } else {
      setReferralModalVisible(false);
    }
  }, [user?.referredByCode, user]);

  useEffect(() => {
    const items = Array.isArray(user?.notificationItems) ? user.notificationItems : [];
    const unreadReferral = items.find(
      (item) => item?.type === "Referral Reward" && !item?.seen
    );
    if (unreadReferral) {
      setReferralWinModalData({
        message: unreadReferral.message || "You earned a referral reward.",
        amount: unreadReferral.amount ?? null,
      });
      setReferralWinModalVisible(true);
    }
  }, [user?.notificationItems]);

  // Monthly eligibility is fetched live from the backend (no mock calculations).

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
      <PageContainer>
        <ContentContainer>
          <LoadingContainer>
            <BrandLoader text="Loading Biggi Data..." />
          </LoadingContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  const mainBalance = Number(user.mainBalance || 0);
  const rewardBalance = Number(user.rewardBalance || 0);
  const tickets = Number(user.tickets || 0);
  const dataBundleCount = Number(user.dataBundleCount || 0);
  const totalSavings = Number(user.totalSavings || 0);
  const role = String(user?.userRole || "").toLowerCase();
  const isPrivateRole = role === "private";
  const isMerchantRole = role === "merchant";

  const goToDeposit = () => navigate('/deposit');
  const goToWithdraw = () => navigate('/withdraw');
  const goToBundle = () => navigate('/buy-data');
  const goToRedeem = () => navigate('/redeem');
  const goToTopRandom = () => navigate('/top-random');
  const goToDraws = () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) return;
    navigate('/daily-draw');
  };
  
  const goToNotification = () => {
    markNotificationsAsSeen();
    navigate('/notifications');
  };

  // Download app button intentionally hidden on the website UI.

  const handleDailyGame = () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) return;
    if (tickets <= 0) {
      setTicketModalMessage("You need at least 1 ticket to play the Weekly Number Picker game.");
      setTicketModalVisible(true);
      return;
    }
    navigate('/daily-draw');
  };

  const handleMonthlyGameClick = () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) return;
    handleMonthlyGame();
  };

  const handleTopRandomGameClick = () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) return;
    if (tickets <= 0) {
      setTicketModalMessage("You need at least 1 ticket to access Top Random Monthly Picks.");
      setTicketModalVisible(true);
      return;
    }
    goToTopRandom();
  };

  const handleMonthlyGame = () => {
    if (monthlyEligibility.isEligible) {
      showMonthlyGameModal(
        "Monthly Draw Tickets",
        `Purchases this month: ${monthlyEligibility.purchases}\n` +
          `Raffle tickets earned: ${monthlyEligibility.raffleTicketsTotal}\n` +
          `Unplayed tickets: ${monthlyEligibility.raffleTicketsUnplayed}\n\n` +
          `Play a ticket to enter the monthly draw list. Each played ticket is one entry.\n\n` +
          `Result: Pending until month end (${monthlyEligibility.daysLeft} days left).`,
        true
      );
      return;
    }

    showMonthlyGameModal(
      "No Monthly Raffle Tickets Yet",
      `Every 5 successful data purchases in a month earns you 1 raffle ticket.\n\n` +
        `Purchases this month: ${monthlyEligibility.purchases}\n` +
        `Progress to next ticket: ${Math.round(monthlyEligibility.progress)}%\n\n` +
        `Buy more bundles to earn a raffle ticket, then play it in Monthly Draw.`,
      false
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
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
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const result = await updateAvatar(formData);
      const backendPhoto =
        result?.user?.photo ||
        result?.user?.profilePic ||
        result?.photo ||
        result?.avatar ||
        "";

      if (!result?.success && !backendPhoto) {
        throw new Error(result?.msg || "Failed to upload image");
      }

      if (backendPhoto) {
        updateUser({ photo: backendPhoto });
      }
      await refreshUser();

      setPreviewVisible(false);
      setSelectedImage(null);
      setSelectedFile(null);
      showUploadModal("Success", "Profile photo updated successfully!", "success");
    } catch (err) {
      showUploadModal(
        "Error",
        err?.message || err?.response?.data?.message || "Failed to upload image. Try again.",
        "error"
      );
    } finally {
      setIsUploading(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <PageContainer>
      <ContentContainer>
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
                  src={user?.photo || user?.profilePic || user?.avatar || DEFAULT_AVATAR} 
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
            
            <HeaderActions>
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
            </HeaderActions>
          </Header>

          {/* WALLET CARD */}
          <WalletCard>
            <BalanceRow>
              <div>
                <BalanceLabel>Main Balance</BalanceLabel>
                <Balance>â‚¦{mainBalance.toLocaleString()}</Balance>
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
                <BalanceLabel>Redeem Balance</BalanceLabel>
                <Balance>â‚¦{rewardBalance.toLocaleString()}</Balance>
              </div>
              <RedeemBtn 
                onClick={goToRedeem} 
                disabled={FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
              >
                <ActionText>Redeem</ActionText>
              </RedeemBtn>
            </BalanceRow>
          </WalletCard>

          <StatsContainer>
            <StatCard>
              <Wifi size={22} color="#ff7a00" />
              <StatValue>{dataBundleCount}</StatValue>
              <StatLabel>Bundles Purchased</StatLabel>
            </StatCard>
            <StatCard>
              <Wallet size={22} color="#ff7a00" />
              <StatValue>N{totalSavings.toLocaleString()}</StatValue>
              <StatLabel>Total Savings</StatLabel>
            </StatCard>
          </StatsContainer>

          {/* TICKETS */}
          <TicketText>
            ðŸŽ« Available Tickets:{" "}
            <TicketCount>{tickets}</TicketCount>
          </TicketText>
          <InfoText>
            âœ… Buy Any Bundle â†’ Unlock Weekly Game{isMerchantRole ? " + Monthly Raffle Tickets" : " + Top Random Picks"}
          </InfoText>

          {/* CONTENT SECTION */}
          <ContentSection>
            {/* BUNDLE CARD */}
            <BundleCard>
              <BundleGlowOverlay />
              <BundleLeft>
                <WifiIcon size={28} />
                <BundleTitle>Buy Data Bundle</BundleTitle>
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
                <BundleDesc>Use tickets for Weekly Draw. Earn raffle tickets for Monthly Draw.</BundleDesc>
              </BundleRight>
            </BundleCard>

            {/* DAILY GAME */}
            <GameCard>
              <GamepadIcon size={28} />
              <GameTitle>Weekly Number Picker Game</GameTitle>
              <GameSubtitle>
                {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Win (prize hidden)" : "Win Weekly"}
              </GameSubtitle>
              <PlayBtn 
                onClick={handleDailyGame} 
                disabled={FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
                $locked={tickets <= 0}
              >
                <PlayText>Play Now</PlayText>
              </PlayBtn>
            </GameCard>

            {/* MONTHLY GAME */}
            {(isMerchantRole || !role) && (
              <MonthlyGameCard $pulse={monthlyEligibility.isEligible}>
                <MonthlyHeader>
                  <TrophyIcon size={24} />
                  <MonthlyTitle>Monthly Draw</MonthlyTitle>
                  <RaffleTicketPill aria-label="Monthly raffle tickets">
                    <RaffleTicketGlow />
                    <RaffleTicketIcon size={16} />
                    <RaffleTicketText>Tickets</RaffleTicketText>
                    <RaffleTicketBadge>
                      {monthlyEligibility.raffleTicketsUnplayed > 99
                        ? "99+"
                        : monthlyEligibility.raffleTicketsUnplayed}
                    </RaffleTicketBadge>
                  </RaffleTicketPill>
                  {monthlyEligibility.isEligible && (
                    <EligibleBadge>
                      <EligibleText>
                        {monthlyEligibility.raffleTicketsUnplayed} TICKET
                        {monthlyEligibility.raffleTicketsUnplayed === 1 ? "" : "S"}
                      </EligibleText>
                    </EligibleBadge>
                  )}
                </MonthlyHeader>
                
                <MonthlyPrize>
                  {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Prize hidden" : ""}
                </MonthlyPrize>
                <MonthlySubtitle>Monthly Jackpot</MonthlySubtitle>
                
                {/* Monthly Progress */}
                <ProgressContainer>
                  <ProgressLabels>
                    <ProgressText>
                      {monthlyEligibility.purchases} purchases â€¢{" "}
                      {monthlyEligibility.raffleTicketsTotal} ticket
                      {monthlyEligibility.raffleTicketsTotal === 1 ? "" : "s"}
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
                  onClick={handleMonthlyGameClick}
                  $eligible={monthlyEligibility.isEligible}
                >
                  {monthlyEligibility.isEligible ? (
                    <>
                      <CheckCircle size={18} />
                      <MonthlyBtnText>
                        {monthlyEligibility.raffleTicketsUnplayed > 0
                          ? "Play Ticket"
                          : "View Monthly Draw"}
                      </MonthlyBtnText>
                    </>
                  ) : (
                    <>
                      <Info size={18} />
                      <MonthlyBtnText>How to Earn Ticket</MonthlyBtnText>
                    </>
                  )}
                </MonthlyBtn>
              </MonthlyGameCard>
            )}

            {(isPrivateRole || isMerchantRole || !role) && (
              <TopRandomCard>
                <TopRandomTitle>Top Random Monthly Picks</TopRandomTitle>
                <TopRandomDesc>
                  10 random users who bought data this month win rewards.
                </TopRandomDesc>
                <TopRandomBtn onClick={handleTopRandomGameClick} $locked={tickets <= 0}>
                  <Trophy size={18} />
                  <TopRandomBtnText>Open Top Random Picks</TopRandomBtnText>
                </TopRandomBtn>
              </TopRandomCard>
            )}
          </ContentSection>
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
              <ModalMsg>{ticketModalMessage}</ModalMsg>
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
                      navigate('/game-winner');
                    } else {
                      goToBundle();
                    }
                  }}
                >
                  <ModalBtnText>
                    {monthlyGameModalData.isEligible ? "View Monthly Draw" : "Buy Data"}
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

        {/* STATE REQUIRED MODAL */}
        {stateModalVisible && (
          <ModalOverlay>
            <ModalBox>
              <Info size={42} color="#FF7A00" />
              <ModalTitle>Complete Your Profile</ModalTitle>
              <ModalMsg>
                Please select the state you live in. This helps us serve you better.
              </ModalMsg>
              <ModalBtn onClick={() => navigate("/edit-profile")}>
                <ModalBtnText>Set State</ModalBtnText>
              </ModalBtn>
              <ModalBtn $secondary onClick={() => setStateModalVisible(false)}>
                <ModalBtnText>Later</ModalBtnText>
              </ModalBtn>
            </ModalBox>
          </ModalOverlay>
        )}

        {/* REFERRAL CODE REQUIRED MODAL */}
        {referralModalVisible && (
          <ModalOverlay>
            <ModalBox>
              <Info size={42} color="#FF7A00" />
              <ModalTitle>Referral Code</ModalTitle>
              <ModalMsg>
                If someone invited you, enter their referral code. If not, you can leave it
                empty for now.
              </ModalMsg>
              <ModalBtn onClick={() => navigate("/edit-profile")}>
                <ModalBtnText>Enter Code</ModalBtnText>
              </ModalBtn>
              <ModalBtn $secondary onClick={() => setReferralModalVisible(false)}>
                <ModalBtnText>Later</ModalBtnText>
              </ModalBtn>
            </ModalBox>
          </ModalOverlay>
        )}

        {/* REFERRAL WIN MODAL */}
        {referralWinModalVisible && (
          <ModalOverlay>
            <ModalBox>
              <CheckCircle size={42} color="#4CAF50" />
              <ModalTitle>Referral Reward</ModalTitle>
              <ModalMsg>{referralWinModalData.message}</ModalMsg>
              {referralWinModalData.amount !== null && (
                <ModalMsg>â‚¦{Number(referralWinModalData.amount).toLocaleString()} added to reward balance.</ModalMsg>
              )}
              <ModalBtn
                onClick={() => {
                  setReferralWinModalVisible(false);
                  markNotificationsAsSeen();
                }}
              >
                <ModalBtnText>OK</ModalBtnText>
              </ModalBtn>
            </ModalBox>
          </ModalOverlay>
        )}

        <FloatingBottomNav />
      </ContentContainer>
    </PageContainer>
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
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0;
  overflow-x: hidden;

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
  position: relative;
  background: #000;
  min-height: 100vh;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #000;
  width: 100%;
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

const ScrollContainer = styled.div`
  padding-bottom: 100px;
  min-height: 100vh;
  width: 100%;
  padding-top: 4px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 18px 0 20px 0;
  padding: 0 16px;
  width: 100%;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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
  margin: 4px 0 0 0;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const DownloadAppButton = styled.button`
  background-color: #ff7a00;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(255, 122, 0, 0.3);
  transition: all 0.2s ease;

  &:hover {
    background-color: #e56a00;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    padding: 7px 10px;
    font-size: 11px;
  }
`;

const DownloadAppText = styled.span`
  line-height: 1;
`;

const BellButton = styled.button`
  background-color: #fff;
  padding: 12px;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    background-color: #fff;
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
  border: 2px solid #fff;
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
  border-radius: 16px;
  padding: 20px;
  margin: 0 0 20px 0;
  animation: ${fadeInUp} 0.8s ease-out;
  box-shadow: 0 8px 24px rgba(255, 165, 0, 0.3);
  width: 100%;
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const BalanceLabel = styled.div`
  color: #222;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;

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
  gap: 8px;
`;

const ActionBtn = styled.button`
  background-color: #000;
  padding: 8px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #333;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    padding: 8px 20px;
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
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: rgba(0, 0, 0, 0.2);
  margin: 16px 0;
`;

const TicketText = styled.div`
  color: #fff;
  font-size: 16px;
  text-align: center;
  margin: 0 0 8px 0;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const TicketCount = styled.span`
  color: #FF7A00;
  font-weight: 800;
`;

const InfoText = styled.div`
  color: #ddd;
  font-size: 14px;
  margin: 0 0 24px 0;
  text-align: center;
  opacity: 0.9;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const ContentSection = styled.div`
  background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%);
  border-top-left-radius: 40px;
  border-top-right-radius: 40px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  padding: 24px 16px 40px;
  margin-top: 20px;
  width: 100%;
  box-shadow: none;
  border: none;
  min-height: 58vh;

  @media (max-width: 480px) {
    padding: 20px 12px 40px;
    border-top-left-radius: 34px;
    border-top-right-radius: 34px;
  }
`;

const BundleCard = styled.div`
  background-color: #fff;
  border-radius: 20px;
  padding: 20px;
  margin: 0 0 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  animation: ${fadeInUp} 0.7s ease-out 0.1s both;
  border: 1px solid #f0f0f0;

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
  margin-bottom: 12px;
`;

const BundleTitle = styled.h3`
  font-weight: 700;
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #000;

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const SmallBtn = styled.button`
  background-color: #000;
  border-radius: 10px;
  padding: 8px 20px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #333;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SmallBtnText = styled.span`
  font-size: 13px;
  color: #fff;
  font-weight: 600;
`;

const DividerVertical = styled.div`
  width: 1px;
  height: 80px;
  background-color: #eee;
  margin: 0 16px;

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
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
`;

const TicketGlow = styled.div`
  position: absolute;
  width: 45px;
  height: 45px;
  border-radius: 23px;
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
  padding: 4px 8px;
  min-width: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const TicketBadgeText = styled.span`
  color: #fff;
  font-weight: bold;
  font-size: 13px;
`;

const BundleDesc = styled.p`
  font-size: 14px;
  color: #333;
  line-height: 20px;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const GameCard = styled.div`
  background: linear-gradient(135deg, #222 0%, #333 100%);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0 20px 0;
  animation: ${fadeInUp} 0.7s ease-out 0.2s both;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border: 1px solid #444;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const GamepadIcon = styled(Gamepad2)`
  color: #fff;
  margin-bottom: 12px;
`;

const GameTitle = styled.h3`
  color: #fff;
  font-weight: 700;
  text-align: center;
  margin: 0 0 8px 0;
  font-size: 18px;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const GameSubtitle = styled.p`
  color: #FFD700;
  font-size: 14px;
  margin: 0 0 16px 0;
  text-align: center;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const PlayBtn = styled.button`
  background-color: ${props => (props.$locked ? "#999" : "#FF7A00")};
  border-radius: 10px;
  padding: 12px 32px;
  border: none;
  cursor: ${props => (props.$locked ? "not-allowed" : "pointer")};
  opacity: ${props => (props.$locked ? 0.65 : 1)};
  transition: all 0.2s;
  width: 100%;
  max-width: 240px;
  box-shadow: ${props =>
    props.$locked ? "none" : "0 4px 16px rgba(255, 122, 0, 0.3)"};

  &:hover:not(:disabled) {
    background-color: #E56A00;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 122, 0, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #999;
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const PlayText = styled.span`
  color: #fff;
  font-weight: 700;
  font-size: 15px;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const MonthlyGameCard = styled.div`
  background: linear-gradient(135deg, #2B006A 0%, #4A00A3 100%);
  border-radius: 16px;
  padding: 20px;
  animation: ${fadeInUp} 0.7s ease-out 0.3s both;
  ${props => props.$pulse && css`
    animation: ${pulse} 1.5s ease-in-out infinite, ${fadeInUp} 0.7s ease-out 0.3s both;
  `}
  box-shadow: 0 8px 24px rgba(43, 0, 106, 0.3);
  border: 1px solid #5A00C3;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const MonthlyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
`;

const TrophyIcon = styled(Trophy)`
  color: #FFD700;
`;

const RaffleTicketPill = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(15, 25, 18, 0.7);
  border: 1px solid rgba(76, 175, 80, 0.45);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.22);
  overflow: hidden;
`;

const RaffleTicketGlow = styled.div`
  position: absolute;
  inset: -20px;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(76, 175, 80, 0.35),
    transparent 55%
  );
  pointer-events: none;
`;

const RaffleTicketIcon = styled(Ticket)`
  position: relative;
  color: #4caf50;
  filter: drop-shadow(0 0 10px rgba(76, 175, 80, 0.4));
`;

const RaffleTicketText = styled.span`
  position: relative;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2px;
`;

const RaffleTicketBadge = styled.span`
  position: relative;
  min-width: 28px;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 175, 80, 0.18);
  border: 1px solid rgba(76, 175, 80, 0.5);
  color: #dff6e5;
  font-size: 12px;
  font-weight: 900;
`;

const MonthlyTitle = styled.h3`
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const EligibleBadge = styled.div`
  background-color: #4CAF50;
  padding: 6px 12px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
`;

const EligibleText = styled.span`
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MonthlyPrize = styled.h1`
  color: #FFD700;
  font-size: 32px;
  font-weight: 900;
  text-align: center;
  margin: 16px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  @media (max-width: 480px) {
    font-size: 28px;
  }

  @media (max-width: 360px) {
    font-size: 24px;
  }
`;

const MonthlySubtitle = styled.p`
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-size: 14px;
  margin: 0 0 20px 0;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: 20px;
`;

const ProgressLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ProgressText = styled.span`
  color: #fff;
  font-size: 13px;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const ProgressPercent = styled.span`
  color: #FFD700;
  font-size: 13px;
  font-weight: 700;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 4px;
  width: ${props => props.$width}%;
  background-color: ${props => props.$color};
  transition: width 0.5s ease;
`;

const DaysLeftText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const MonthlyBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 14px;
  border: none;
  cursor: ${props => (props.$locked ? "not-allowed" : "pointer")};
  opacity: ${props => (props.$locked ? 0.7 : 1)};
  transition: all 0.2s;
  width: 100%;
  gap: 8px;
  background-color: ${props => props.$eligible ? '#4CAF50' : '#8E2DE2'};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);

  &:hover {
    opacity: ${props => (props.$locked ? 0.7 : 0.9)};
    transform: ${props => (props.$locked ? "none" : "translateY(-1px)")};
    box-shadow: ${props =>
      props.$locked ? "0 4px 16px rgba(0, 0, 0, 0.2)" : "0 6px 20px rgba(0, 0, 0, 0.3)"};
  }

  &:active {
    transform: translateY(0);
  }
`;

const MonthlyBtnText = styled.span`
  color: #fff;
  font-weight: 700;
  font-size: 15px;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 16px;
  margin: 2px 0 10px;
`;

const StatCard = styled.div`
  background: #222;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
`;

const StatValue = styled.div`
  margin-top: 8px;
  color: #fff;
  font-size: 22px;
  font-weight: 800;
`;

const StatLabel = styled.div`
  margin-top: 5px;
  color: #bbb;
  font-size: 12px;
  font-weight: 600;
`;

const TopRandomCard = styled.div`
  margin-top: 16px;
  background: linear-gradient(135deg, #0f766e 0%, #0ea5a4 100%);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(15, 118, 110, 0.28);
`;

const TopRandomTitle = styled.h3`
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  text-align: center;
`;

const TopRandomDesc = styled.p`
  margin: 10px 0 14px;
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
  font-size: 14px;
  line-height: 1.45;
`;

const TopRandomBtn = styled.button`
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 13px;
  background: #ffffff;
  color: #0f766e;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: ${props => (props.$locked ? "not-allowed" : "pointer")};
  opacity: ${props => (props.$locked ? 0.7 : 1)};
  transition: transform 0.2s ease;

  &:hover {
    transform: ${props => (props.$locked ? "none" : "translateY(-1px)")};
  }
`;

const TopRandomBtnText = styled.span`
  font-size: 14px;
  font-weight: 800;
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
  padding: 28px 24px;
  border-radius: 16px;
  width: 85%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-rendering: optimizeLegibility;

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
    padding: 24px 20px;
    width: 90%;
    max-width: 320px;
  }
`;

const ModalTitle = styled.h2`
  font-weight: 900;
  font-size: 22px;
  margin: 16px 0 10px 0;
  text-align: center;
  color: #111;
  letter-spacing: 0.2px;

  @media (max-width: 480px) {
    font-size: 20px;
  }
`;

const ModalMsg = styled.p`
  text-align: center;
  margin: 12px 0 20px 0;
  color: #2b2b2b;
  line-height: 1.55;
  font-size: 15px;
  max-width: 320px;
  white-space: pre-line;

  @media (max-width: 480px) {
    font-size: 14px;
    line-height: 1.5;
  }
`;

const ModalBtn = styled.button`
  background-color: ${(props) =>
    props.$color ? props.$color : props.$secondary ? "#999" : "#FF7A00"};
  border-radius: 10px;
  padding: 14px 28px;
  margin-top: 8px;
  min-width: 140px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 12px 24px;
    min-width: 120px;
  }
`;

const ModalBtnText = styled.span`
  color: #fff;
  font-weight: bold;
  font-size: 15px;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const ModalBtnContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  gap: 8px;
`;

const ModalChoiceContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
`;

// Preview Modal
const PreviewBox = styled(ModalBox)`
  width: 90%;
  max-width: 400px;
`;

const PreviewTitle = styled(ModalTitle)`
  margin-bottom: 20px;
`;

const PreviewImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 100px;
  margin: 20px 0;
  border: 4px solid #FF7A00;
  object-fit: cover;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  @media (max-width: 480px) {
    width: 180px;
    height: 180px;
  }
`;

const PreviewBtns = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 24px;
  gap: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
  }
`;

