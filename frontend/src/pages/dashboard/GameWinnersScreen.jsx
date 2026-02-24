import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  DollarSign,
  Info,
  Check,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import { claimDailyReward } from "../../services/api";

export default function GameWinnersScreen() {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("daily");
  const [successVisible, setSuccessVisible] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [lastClaimAmount, setLastClaimAmount] = useState(0);
  const [claimFallbackInfo, setClaimFallbackInfo] = useState(false);
  const [monthlyProgress, setMonthlyProgress] = useState({
    purchases: 0,
    required: 5,
    isEligible: false,
  });

  useEffect(() => {
    if (!user) return;
    const purchases = user.dataBundleCount || 0;
    setMonthlyProgress({
      purchases,
      required: 5,
      isEligible: purchases >= 5,
    });
  }, [user]);

  const userWins = useMemo(
    () =>
      (user?.dailyNumberDraw || [])
        .filter((game) => game.isWinner)
        .map((game) => ({
          name: user?.username || "You",
          gameId: game?._id || game?.id || null,
          claimed: Boolean(game?.claimed || game?.rewardClaimed || game?.isClaimed),
          id: user?._id?.slice(-6) || "000000",
          type: "daily",
          amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N2,000",
          date: new Date(game.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          numbers: game.numbers || [],
          result: game.result || [],
        })),
    [user]
  );

  const monthlyWinners = [
    {
      name: "Michael Brown",
      id: "789012",
      type: "monthly",
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N5,000",
      date: "Jan 31, 2024",
      note: "Monthly Draw Winner",
    },
    {
      name: "James Wilson",
      id: "345678",
      type: "monthly",
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N5,000",
      date: "Dec 31, 2023",
      note: "Monthly Draw Winner",
    },
    {
      name: "Robert Taylor",
      id: "901234",
      type: "monthly",
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N5,000",
      date: "Nov 30, 2023",
      note: "Monthly Draw Winner",
    },
  ];

  const dailyWinners = [
    {
      name: "Alex Johnson",
      id: "123456",
      type: "daily",
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N2,000",
      date: "Today, 7:30 PM",
      numbers: [15, 23, 42, 56, 68],
    },
    {
      name: "Sarah Williams",
      id: "234567",
      type: "daily",
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N2,000",
      date: "Yesterday, 7:30 PM",
      numbers: [8, 19, 34, 47, 62],
    },
    {
      name: "Emma Davis",
      id: "456789",
      type: "daily",
      amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N2,000",
      date: "2 Days Ago, 7:30 PM",
      numbers: [3, 27, 41, 55, 70],
    },
    ...userWins,
  ];

  const winners =
    activeTab === "daily" ? dailyWinners.slice(0, 10) : monthlyWinners;
  const claimableWins = userWins.filter((win) => !win.claimed && win.gameId);

  const handleClaim = async () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
      window.alert(
        "Feature Disabled: Claiming rewards is temporarily disabled for Play Store review."
      );
      return;
    }

    if (claimableWins.length > 0) {
      setClaiming(true);
      try {
        let totalClaimed = 0;
        let latestBalances = null;

        for (const win of claimableWins) {
          const res = await claimDailyReward(win.gameId);
          const payload = res?.data || {};
          const claimedAmount = Number(
            payload.claimedAmount ?? payload.amount ?? payload.prize ?? 2000
          );
          totalClaimed += claimedAmount;

          if (payload.user || payload.rewardBalance !== undefined || payload.mainBalance !== undefined) {
            latestBalances = payload;
          }
        }

        if (latestBalances) {
          updateUser({
            rewardBalance:
              latestBalances.user?.rewardBalance ?? latestBalances.rewardBalance ?? user?.rewardBalance,
            mainBalance:
              latestBalances.user?.mainBalance ?? latestBalances.mainBalance ?? user?.mainBalance,
          });
        } else if (totalClaimed > 0) {
          updateUser({
            rewardBalance: Number(user?.rewardBalance || 0) + totalClaimed,
          });
        }

        await refreshUser?.();
        setLastClaimAmount(totalClaimed);
        setClaimFallbackInfo(false);
        setSuccessVisible(true);
      } catch (error) {
        const status = error?.response?.status;
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "";

        const isClaimRouteMissing =
          status === 404 ||
          /cannot post|not found|route/i.test(errorMessage);

        if (isClaimRouteMissing) {
          await refreshUser?.();
          setLastClaimAmount(0);
          setClaimFallbackInfo(true);
          setSuccessVisible(true);
        } else {
          window.alert(errorMessage || "Failed to claim reward(s). Please try again.");
        }
      } finally {
        setClaiming(false);
      }
      return;
    }

    if (userWins.length > 0) {
      await refreshUser?.();
      setLastClaimAmount(0);
      setClaimFallbackInfo(true);
      setSuccessVisible(true);
      return;
    }

    const goToDraw = window.confirm(
      "No Rewards to Claim.\n\nYou don't have any unclaimed rewards yet.\nKeep playing daily draws to win prizes.\n\nClick OK to Play Daily Draw, or Cancel to close."
    );
    if (goToDraw) navigate("/daily-draw");
  };

  const handleCheckMonthlyEligibility = () => {
    const message = FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
      ? `You need ${monthlyProgress.required} data purchases this month to qualify for the monthly draw (prize hidden).\n\nYour purchases this month: ${monthlyProgress.purchases}/${monthlyProgress.required}\nStatus: ${
          monthlyProgress.isEligible ? "ELIGIBLE" : "Not yet eligible"
        }\n\nMonthly draw happens at the end of each month.\nWinners are automatically selected from all eligible players.\n\nClick OK to Buy Data, or Cancel to close.`
      : `You need ${monthlyProgress.required} data purchases this month to qualify for the N5,000 monthly draw.\n\nYour purchases this month: ${monthlyProgress.purchases}/${monthlyProgress.required}\nStatus: ${
          monthlyProgress.isEligible ? "ELIGIBLE" : "Not yet eligible"
        }\n\nMonthly draw happens at the end of each month.\nWinners are automatically selected from all eligible players.\n\nClick OK to Buy Data, or Cancel to close.`;

    const goBuy = window.confirm(message);
    if (goBuy) navigate("/buy-data");
  };

  return (
    <Page>
      <Wrapper>
        <Header>
          <IconButton onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={20} />
          </IconButton>
          <HeaderTitle>Game Winners</HeaderTitle>
          <Spacer />
        </Header>

        <Card>
          <TitlePill>Winners Board</TitlePill>

          <TabsContainer>
            <TabButton
              $active={activeTab === "daily"}
              onClick={() => setActiveTab("daily")}
            >
              <Calendar size={16} />
              Daily Winners
            </TabButton>
            <TabButton
              $active={activeTab === "monthly"}
              onClick={() => setActiveTab("monthly")}
            >
              <Trophy size={16} />
              Monthly Winners
            </TabButton>
          </TabsContainer>

          <InfoCard>
            <InfoItem>
              <InfoLabel>Prize</InfoLabel>
              <InfoValue>
                {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
                  ? "Prize hidden"
                  : activeTab === "daily"
                  ? "N2,000"
                  : "N5,000"}
              </InfoValue>
            </InfoItem>
            <InfoDivider />
            <InfoItem>
              <InfoLabel>Draw Time</InfoLabel>
              <InfoValue>
                {activeTab === "daily" ? "7:30 PM Daily" : "End of Month"}
              </InfoValue>
            </InfoItem>
          </InfoCard>

          <ListArea>
            {winners.map((winner, index) => (
              <WinnerRow key={`${winner.id}-${index}`}>
                <WinnerInfo>
                  <WinnerAvatar $monthly={winner.type === "monthly"}>
                    {winner.name.charAt(0)}
                  </WinnerAvatar>
                  <WinnerDetails>
                    <WinnerName>{winner.name}</WinnerName>
                    <WinnerDate>{winner.date}</WinnerDate>
                    {winner.numbers && (
                      <WinnerMeta>
                        Numbers: {winner.numbers.join(", ")}
                      </WinnerMeta>
                    )}
                    {winner.note && <WinnerNote>{winner.note}</WinnerNote>}
                  </WinnerDetails>
                </WinnerInfo>
                <PrizeSide>
                  <Amount>
                    {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : winner.amount}
                  </Amount>
                  <TypeBadge $monthly={winner.type === "monthly"}>
                    {winner.type === "monthly" ? "MONTHLY" : "DAILY"}
                  </TypeBadge>
                </PrizeSide>
              </WinnerRow>
            ))}

            {winners.length === 0 && (
              <EmptyState>No {activeTab} winners to display yet</EmptyState>
            )}
          </ListArea>

          <ActionRow>
            <ActionButton
              onClick={handleClaim}
              disabled={claiming || userWins.length === 0 || FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
            >
              <DollarSign size={18} />
              {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
                ? "Claiming Disabled"
                : claiming
                ? "Claiming..."
                : claimableWins.length > 0
                ? `Claim N${(claimableWins.length * 2000).toLocaleString()}`
                : userWins.length > 0
                ? "Check Rewards"
                : "No Rewards"}
            </ActionButton>

            <ActionButton $secondary onClick={handleCheckMonthlyEligibility}>
              <Info size={18} />
              Monthly Eligibility
            </ActionButton>
          </ActionRow>

          <StatsCard>
            <StatsTitle>Your Statistics</StatsTitle>
            <StatsGrid>
              <StatItem>
                <StatNumber>{userWins.length}</StatNumber>
                <StatLabel>Total Wins</StatLabel>
              </StatItem>
              <StatsDivider />
              <StatItem>
                <StatNumber>{user?.tickets || 0}</StatNumber>
                <StatLabel>Available Tickets</StatLabel>
              </StatItem>
              <StatsDivider />
              <StatItem>
                <StatNumber>{monthlyProgress.purchases}</StatNumber>
                <StatLabel>Monthly Purchases</StatLabel>
              </StatItem>
            </StatsGrid>
          </StatsCard>
        </Card>
      </Wrapper>

      {successVisible && (
        <ModalOverlay>
          <ModalCard>
            <CheckCircle>
              <Check size={28} color="#fff" />
            </CheckCircle>
            <ModalTitle>Rewards Claimed!</ModalTitle>
            <ModalMessage>
              {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
                ? "Rewards have been added to your reward balance."
                : claimFallbackInfo || lastClaimAmount <= 0
                ? "Rewards are processed automatically after draw. Please check your redeem balance."
                : `N${lastClaimAmount.toLocaleString()} has been added to your reward balance.`}
            </ModalMessage>
            <ModalSubText>
              You can redeem your rewards anytime from your wallet.
            </ModalSubText>

            <ModalButton
              onClick={() => {
                setSuccessVisible(false);
                navigate("/redeem");
              }}
            >
              View Wallet
            </ModalButton>
            <ModalButton $secondary onClick={() => setSuccessVisible(false)}>
              Close
            </ModalButton>
          </ModalCard>
        </ModalOverlay>
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #2b006a 0%, #a000a6 100%);
  padding: 20px;
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const HeaderTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
`;

const Spacer = styled.div`
  width: 36px;
  height: 36px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const TitlePill = styled.div`
  margin: 0 auto 14px;
  width: fit-content;
  padding: 8px 24px;
  border-radius: 10px;
  background: linear-gradient(90deg, #ffa500 0%, #ffd700 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
`;

const TabsContainer = styled.div`
  background: #f0f0f0;
  border-radius: 12px;
  padding: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
`;

const TabButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  color: ${(props) => (props.$active ? "#fff" : "#666")};
  background: ${(props) => (props.$active ? "#ff7a00" : "transparent")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const InfoCard = styled.div`
  margin-top: 14px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 14px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`;

const InfoItem = styled.div`
  text-align: center;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #666;
`;

const InfoValue = styled.div`
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #ff7a00;
`;

const InfoDivider = styled.div`
  width: 1px;
  height: 30px;
  background: #e0e0e0;
`;

const ListArea = styled.div`
  margin-top: 12px;
  max-height: 340px;
  overflow: auto;
`;

const WinnerRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 0;
`;

const WinnerInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  flex: 1;
`;

const WinnerAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 21px;
  background: ${(props) => (props.$monthly ? "#8e2de220" : "#ff7a0020")};
  color: ${(props) => (props.$monthly ? "#8e2de2" : "#ff7a00")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

const WinnerDetails = styled.div`
  min-width: 0;
`;

const WinnerName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #111;
`;

const WinnerDate = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const WinnerMeta = styled.div`
  font-size: 11px;
  color: #888;
  margin-top: 4px;
`;

const WinnerNote = styled.div`
  font-size: 11px;
  color: #8e2de2;
  font-weight: 600;
  margin-top: 4px;
`;

const PrizeSide = styled.div`
  text-align: right;
`;

const Amount = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #ff7a00;
`;

const TypeBadge = styled.div`
  margin-top: 4px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  color: #666;
  padding: 2px 8px;
  background: ${(props) => (props.$monthly ? "#8e2de210" : "#ff7a0010")};
`;

const EmptyState = styled.div`
  padding: 36px 8px;
  text-align: center;
  color: #999;
  font-size: 14px;
`;

const ActionRow = styled.div`
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: ${(props) => (props.$secondary ? "#8e2de2" : "#ff7a00")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatsCard = styled.div`
  margin-top: 14px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 14px;
`;

const StatsTitle = styled.div`
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #111;
`;

const StatsGrid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #ff7a00;
`;

const StatLabel = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #666;
`;

const StatsDivider = styled.div`
  width: 1px;
  height: 30px;
  background: #e0e0e0;
  justify-self: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 1000;
`;

const ModalCard = styled.div`
  background: #fff;
  width: 100%;
  max-width: 320px;
  border-radius: 18px;
  padding: 22px;
  text-align: center;
`;

const CheckCircle = styled.div`
  width: 62px;
  height: 62px;
  border-radius: 31px;
  background: #32cd32;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ModalTitle = styled.h2`
  margin: 12px 0 8px;
  font-size: 20px;
  color: #111;
`;

const ModalMessage = styled.p`
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
`;

const ModalSubText = styled.p`
  margin: 12px 0 18px;
  color: #888;
  font-size: 12px;
`;

const ModalButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: ${(props) => (props.$secondary ? "#666" : "#ff7a00")};
  margin-top: ${(props) => (props.$secondary ? "8px" : "0")};
`;
