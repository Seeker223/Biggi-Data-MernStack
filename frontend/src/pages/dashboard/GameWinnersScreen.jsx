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
import {
  claimDailyReward,
  claimMonthlyReward,
  getMonthlyRaffleTickets,
  getMonthlyWinners,
  getWeeklyWinners,
  playMonthlyRaffleTicket,
} from "../../services/api";
import { toLetters } from "../../utils/drawLetters";

export default function GameWinnersScreen() {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("daily");
  const [successVisible, setSuccessVisible] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [monthlyClaiming, setMonthlyClaiming] = useState(false);
  const [lastClaimAmount, setLastClaimAmount] = useState(0);
  const [monthlyLimitHit, setMonthlyLimitHit] = useState(false);
  const [infoModal, setInfoModal] = useState({
    visible: false,
    title: "",
    message: "",
    buttonText: "OK",
  });
  const [actionModal, setActionModal] = useState({
    visible: false,
    title: "",
    message: "",
    confirmText: "Continue",
    cancelText: "Cancel",
    onConfirm: null,
  });
  const [monthlyProgress, setMonthlyProgress] = useState({
    purchases: 0,
    required: 5,
    isEligible: false,
  });
  const [monthlyRanks, setMonthlyRanks] = useState([]);
  const [monthlyBoardMonth, setMonthlyBoardMonth] = useState("");
  const [monthlyTickets, setMonthlyTickets] = useState([]);
  const [monthlyWinner, setMonthlyWinner] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [raffleModal, setRaffleModal] = useState({
    visible: false,
    selectedTicketId: "",
    selectedTicketCode: "",
  });
  const [playingTicket, setPlayingTicket] = useState(false);
  const [weeklyWinners, setWeeklyWinners] = useState([]);
  const [weeklyBoardMonth, setWeeklyBoardMonth] = useState("");

  useEffect(() => {
    if (!user) return;
    const month =
      monthlyBoardMonth ||
      (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      })();

    const monthlyDraw = (user.monthlyDraws || []).find((d) => d.month === month);
    const purchases = Number(monthlyDraw?.purchasesCount || 0);
    setMonthlyProgress({
      purchases,
      required: 5,
      isEligible: purchases >= 5,
    });
  }, [user, monthlyBoardMonth]);

  useEffect(() => {
    let mounted = true;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setMonthlyBoardMonth(month);

    const loadMonthlyBoard = async () => {
      try {
        setMonthlyLoading(true);
        const [winnersRes, ticketsRes] = await Promise.all([
          getMonthlyWinners(month),
          getMonthlyRaffleTickets(month),
        ]);
        if (!mounted) return;
        const entries = Array.isArray(winnersRes?.data?.entries)
          ? winnersRes.data.entries
          : [];
        const normalized = entries.map((item, idx) => {
          const status = String(item.status || "pending");
          const isWinner = status === "winner";
          const playedAt = item.playedAt ? new Date(item.playedAt) : null;

          return {
            name: item.username || "Player",
            id: String(item.entryId || item.userId || idx),
            type: "monthly",
            amount:
              FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
                ? "-"
                : isWinner
                ? "N10,000"
                : "-",
            date: playedAt
              ? playedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
            note: `Ticket: ${item.code || item.codeMasked || ""} • ${
              isWinner ? "Winner" : "Pending until month end"
            }`,
            isWinner,
          };
        });

        setMonthlyWinner(winnersRes?.data?.winner || null);
        setMonthlyRanks(normalized);

        const tickets = Array.isArray(ticketsRes?.data?.tickets)
          ? ticketsRes.data.tickets
          : [];
        setMonthlyTickets(tickets);
      } catch (error) {
        if (mounted) setMonthlyRanks([]);
        if (mounted) setMonthlyTickets([]);
        if (mounted) setMonthlyWinner(null);
      } finally {
        if (mounted) setMonthlyLoading(false);
      }
    };

    loadMonthlyBoard();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setWeeklyBoardMonth(month);

    const loadWeeklyBoard = async () => {
      try {
        const res = await getWeeklyWinners(month);
        if (!mounted) return;
        const list = Array.isArray(res?.data?.winners) ? res.data.winners : [];
        const normalized = list.map((item, idx) => ({
          name: item.username || "Player",
          id: String(item.userId || idx),
          gameId: item.gameId || null,
          type: "weekly",
          amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N10,000",
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
          numbers: toLetters(item.numbers),
          result: toLetters(item.result),
          claimed: Boolean(item.claimed),
        }));
        setWeeklyWinners(normalized);
      } catch (error) {
        if (mounted) setWeeklyWinners([]);
      }
    };

    loadWeeklyBoard();
    return () => {
      mounted = false;
    };
  }, []);

  const userWins = useMemo(
    () =>
      (user?.dailyNumberDraw || [])
        .filter((game) => game.isWinner)
        .map((game) => ({
          name: user?.username || "You",
          gameId: game?._id || game?.id || null,
          claimed: Boolean(game?.claimed || game?.rewardClaimed || game?.isClaimed),
          id: user?._id?.slice(-6) || "000000",
          type: "weekly",
          amount: FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "-" : "N10,000",
          date: new Date(game.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          numbers: toLetters(game.numbers),
          result: toLetters(game.result),
        })),
    [user]
  );


  const winners = activeTab === "daily" ? weeklyWinners : monthlyRanks;
  const claimableWins = userWins.filter((win) => !win.claimed && win.gameId);

  const unplayedMonthlyTickets = useMemo(
    () => (monthlyTickets || []).filter((t) => !t.played),
    [monthlyTickets]
  );

  const canClaimMonthlyReward = useMemo(() => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) return false;
    if (!monthlyWinner?.winnerUser) return false;
    if (!user?._id) return false;
    if (monthlyWinner?.claimed) return false;
    return String(monthlyWinner.winnerUser) === String(user._id);
  }, [monthlyWinner, user]);

  const reloadMonthly = async () => {
    const month =
      monthlyBoardMonth ||
      (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      })();

    setMonthlyLoading(true);
    try {
      const [winnersRes, ticketsRes] = await Promise.all([
        getMonthlyWinners(month),
        getMonthlyRaffleTickets(month),
      ]);

      const entries = Array.isArray(winnersRes?.data?.entries)
        ? winnersRes.data.entries
        : [];

      const normalized = entries.map((item, idx) => {
        const status = String(item.status || "pending");
        const isWinner = status === "winner";
        const playedAt = item.playedAt ? new Date(item.playedAt) : null;

        return {
          name: item.username || "Player",
          id: String(item.entryId || item.userId || idx),
          type: "monthly",
          amount:
            FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
              ? "-"
              : isWinner
              ? "N10,000"
              : "-",
          date: playedAt
            ? playedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
          note: `Ticket: ${item.code || item.codeMasked || ""} • ${
            isWinner ? "Winner" : "Pending until month end"
          }`,
          isWinner,
        };
      });

      setMonthlyWinner(winnersRes?.data?.winner || null);
      setMonthlyRanks(normalized);

      const tickets = Array.isArray(ticketsRes?.data?.tickets)
        ? ticketsRes.data.tickets
        : [];
      setMonthlyTickets(tickets);
    } catch {
      setMonthlyWinner(null);
      setMonthlyRanks([]);
      setMonthlyTickets([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const handleOpenRaffleModal = () => {
    if (unplayedMonthlyTickets.length === 0) {
      setInfoModal({
        visible: true,
        title: "No Monthly Sets",
        message:
          "You have no unsubmitted monthly sets yet. Each data purchase unlocks one set.",
        buttonText: "Close",
      });
      return;
    }

    const first = unplayedMonthlyTickets[0];
    setRaffleModal({
      visible: true,
      selectedTicketId: String(first.id || ""),
      selectedTicketCode: String(first.code || ""),
    });
  };

  const handlePlaySelectedTicket = async () => {
    if (!raffleModal.selectedTicketId) return;
    setPlayingTicket(true);
    try {
      await playMonthlyRaffleTicket({
        month: monthlyBoardMonth,
        ticketId: raffleModal.selectedTicketId,
      });

      setInfoModal({
        visible: true,
        title: "Set Submitted",
        message: `Set ${raffleModal.selectedTicketCode} has been submitted. Status: Pending until month end.`,
        buttonText: "OK",
      });

      setRaffleModal({
        visible: false,
        selectedTicketId: "",
        selectedTicketCode: "",
      });
      await refreshUser?.();
      await reloadMonthly();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "";

      setInfoModal({
        visible: true,
        title: "Failed to Submit Set",
        message: errorMessage || "Could not submit monthly set. Please try again.",
        buttonText: "Close",
      });
    } finally {
      setPlayingTicket(false);
    }
  };

  const handleClaimMonthly = async () => {
    if (!canClaimMonthlyReward) {
      setInfoModal({
        visible: true,
        title: "Not Eligible",
        message:
          "Only the owner of a winning monthly set can claim the monthly reward.",
        buttonText: "Close",
      });
      return;
    }

    setMonthlyClaiming(true);
    try {
      const res = await claimMonthlyReward(monthlyBoardMonth);
      const payload = res?.data || {};
      const claimedAmount = Number(
        payload?.reward?.amount ?? payload?.amount ?? payload?.claimedAmount ?? 10000
      );
      setLastClaimAmount(claimedAmount);
      setMonthlyLimitHit(false);
      setSuccessVisible(true);
      await refreshUser?.();
      await reloadMonthly();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "";

      setInfoModal({
        visible: true,
        title: "Claim Failed",
        message: errorMessage || "Failed to claim monthly reward. Please try again.",
        buttonText: "Close",
      });
    } finally {
      setMonthlyClaiming(false);
    }
  };

  const handleClaim = async () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
      setInfoModal({
        visible: true,
        title: "Feature Disabled",
        message:
          "Claiming rewards is temporarily disabled for Play Store review.",
        buttonText: "Close",
      });
      return;
    }

    if (claimableWins.length > 0) {
      setClaiming(true);
      try {
        let totalClaimed = 0;
        let latestBalances = null;
        let limitHit = false;

        for (const win of claimableWins) {
          try {
            const res = await claimDailyReward(win.gameId);
            const payload = res?.data || {};
            const claimedAmount = Number(
              payload.claimedAmount ?? payload.amount ?? payload.prize ?? 10000
            );
            totalClaimed += claimedAmount;

            if (payload.user || payload.rewardBalance !== undefined || payload.mainBalance !== undefined) {
              latestBalances = payload;
            }
          } catch (err) {
            const errorMessage =
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              err?.message ||
              "";

            if (/only one weekly reward per month/i.test(errorMessage)) {
              limitHit = true;
              break;
            }

            throw err;
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
        setMonthlyLimitHit(limitHit);
        if (totalClaimed > 0) {
          setSuccessVisible(true);
        } else if (limitHit) {
          setInfoModal({
            visible: true,
            title: "Monthly Claim Limit",
            message: "You can claim only one weekly reward per month.",
            buttonText: "Close",
          });
        }
      } catch (error) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "";

        setInfoModal({
          visible: true,
          title: /only one weekly reward per month/i.test(errorMessage)
            ? "Monthly Claim Limit"
            : "Claim Failed",
          message: errorMessage || "Failed to claim reward(s). Please try again.",
          buttonText: "Close",
        });
      } finally {
        setClaiming(false);
      }
      return;
    }

    if (userWins.length > 0) {
      setInfoModal({
        visible: true,
        title: "No Unclaimed Rewards",
        message: "You have no unclaimed weekly rewards at the moment.",
        buttonText: "Close",
      });
      return;
    }

    setActionModal({
      visible: true,
      title: "No Rewards to Claim",
      message:
        "You don't have any unclaimed rewards yet. Keep playing weekly draws to win prizes.",
      confirmText: "Play Weekly Draw",
      cancelText: "Close",
      onConfirm: () => navigate("/daily-draw"),
    });
  };

  const handleMonthlyInfo = () => {
    setActionModal({
      visible: true,
      title: "Monthly Draw (Card Sets)",
      message:
        `Each data purchase unlocks one 3-letter set in ${monthlyBoardMonth || "this month"}.\n\n` +
        `Play a set to enter the monthly result list. Each submitted set is one entry, so you can appear multiple times.\n\n` +
        `Results are out at month end. Any matching set counts as a win.\n\n` +
        `Unsubmitted sets this month: ${unplayedMonthlyTickets.length}`,
      confirmText: "Buy Data",
      cancelText: "Close",
      onConfirm: () => navigate("/buy-data"),
    });
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
              Weekly Winners
            </TabButton>
            <TabButton
              $active={activeTab === "monthly"}
              onClick={() => {
                setActiveTab("monthly");
                reloadMonthly();
              }}
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
                  ? "N10,000"
                  : "N10,000"}
              </InfoValue>
            </InfoItem>
            <InfoDivider />
            <InfoItem>
              <InfoLabel>Draw Time</InfoLabel>
              <InfoValue>
                {activeTab === "daily" ? "End of Month" : "End of Month"}
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
                        Letters: {winner.numbers.join(", ")}
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
                    {winner.type === "monthly" ? "MONTHLY" : "WEEKLY"}
                  </TypeBadge>
                </PrizeSide>
              </WinnerRow>
            ))}

            {activeTab === "monthly" && monthlyLoading && (
              <EmptyState>Loading monthly entries...</EmptyState>
            )}

            {winners.length === 0 && !(activeTab === "monthly" && monthlyLoading) && (
              <EmptyState>No {activeTab} results to display yet</EmptyState>
            )}
          </ListArea>

          <ActionRow>
            {activeTab === "daily" ? (
              <>
                <ActionButton
                  onClick={handleClaim}
                  disabled={
                    claiming ||
                    userWins.length === 0 ||
                    FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
                  }
                >
                  <DollarSign size={18} />
                  {FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM
                    ? "Claiming Disabled"
                    : claiming
                    ? "Claiming..."
                    : claimableWins.length > 0
                    ? `Claim N${(claimableWins.length * 10000).toLocaleString()}`
                    : userWins.length > 0
                    ? "Check Rewards"
                    : "No Rewards"}
                </ActionButton>

                <ActionButton $secondary onClick={handleMonthlyInfo}>
                  <Info size={18} />
                  Monthly Draw Info
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton
                  onClick={handleOpenRaffleModal}
                  disabled={unplayedMonthlyTickets.length === 0 || playingTicket}
                >
                  <Trophy size={18} />
                  {playingTicket ? "Entering..." : "Play Raffle Ticket"}
                </ActionButton>

                <ActionButton
                  $secondary
                  onClick={canClaimMonthlyReward ? handleClaimMonthly : handleMonthlyInfo}
                  disabled={monthlyClaiming}
                >
                  <Info size={18} />
                  {canClaimMonthlyReward
                    ? monthlyClaiming
                      ? "Claiming..."
                      : "Claim Reward"
                    : "How It Works"}
                </ActionButton>
              </>
            )}
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
                <StatNumber>{unplayedMonthlyTickets.length}</StatNumber>
                <StatLabel>Raffle Tickets</StatLabel>
              </StatItem>
            </StatsGrid>
          </StatsCard>
        </Card>
      </Wrapper>

      {raffleModal.visible && (
        <ModalOverlay>
          <ModalCard style={{ maxWidth: 360, textAlign: "left" }}>
            <ModalTitle style={{ textAlign: "left" }}>
              Play Monthly Card Set
            </ModalTitle>
            <ModalMessage style={{ textAlign: "left" }}>
              Select one unsubmitted set to enter the monthly result list.
            </ModalMessage>

            <TicketList>
              {unplayedMonthlyTickets.map((t) => {
                const selected = String(t.id) === String(raffleModal.selectedTicketId);
                return (
                  <TicketChip
                    key={t.id}
                    type="button"
                    $active={selected}
                    onClick={() =>
                      setRaffleModal((prev) => ({
                        ...prev,
                        selectedTicketId: String(t.id),
                        selectedTicketCode: String(t.code || ""),
                      }))
                    }
                  >
                    {t.code}
                  </TicketChip>
                );
              })}
            </TicketList>

            <ModalButton
              onClick={handlePlaySelectedTicket}
              disabled={playingTicket || !raffleModal.selectedTicketId}
            >
              {playingTicket ? "Entering..." : "Submit Monthly Set"}
            </ModalButton>
            <ModalButton
              $secondary
              onClick={() =>
                setRaffleModal({
                  visible: false,
                  selectedTicketId: "",
                  selectedTicketCode: "",
                })
              }
            >
              Close
            </ModalButton>
          </ModalCard>
        </ModalOverlay>
      )}

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
                : `N${lastClaimAmount.toLocaleString()} has been added to your reward balance.`}
            </ModalMessage>
            <ModalSubText>
              {monthlyLimitHit
                ? "Monthly limit reached: only one monthly reward can be claimed per month."
                : "You can redeem your rewards anytime from your wallet."}
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

      {infoModal.visible && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>{infoModal.title}</ModalTitle>
            <ModalMessage>{infoModal.message}</ModalMessage>
            <ModalButton
              onClick={() =>
                setInfoModal((prev) => ({
                  ...prev,
                  visible: false,
                }))
              }
            >
              {infoModal.buttonText}
            </ModalButton>
          </ModalCard>
        </ModalOverlay>
      )}

      {actionModal.visible && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>{actionModal.title}</ModalTitle>
            <ModalMessage style={{ whiteSpace: "pre-line" }}>
              {actionModal.message}
            </ModalMessage>
            <ModalButton
              onClick={() => {
                const callback = actionModal.onConfirm;
                setActionModal((prev) => ({ ...prev, visible: false, onConfirm: null }));
                if (typeof callback === "function") callback();
              }}
            >
              {actionModal.confirmText}
            </ModalButton>
            <ModalButton
              $secondary
              onClick={() =>
                setActionModal((prev) => ({
                  ...prev,
                  visible: false,
                  onConfirm: null,
                }))
              }
            >
              {actionModal.cancelText}
            </ModalButton>
          </ModalCard>
        </ModalOverlay>
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #000;
  padding: 18px 0 0;
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding: 0 16px;
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: none;
  background: #fff;
  color: #ff7a00;
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
  border-top-left-radius: 38px;
  border-top-right-radius: 38px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  padding: 20px 16px 22px;
  min-height: calc(100vh - 92px);
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

const TicketList = styled.div`
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TicketChip = styled.button`
  border: 1px solid ${(props) => (props.$active ? "#ff7a00" : "#ddd")};
  background: ${(props) => (props.$active ? "#ff7a0010" : "#f6f6f6")};
  color: #111;
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
`;


