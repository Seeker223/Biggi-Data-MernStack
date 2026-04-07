import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Trophy, Gift, RefreshCw } from "lucide-react";
import {
  claimTopRandomMonthlyReward,
  getTopRandomMonthlyStatus,
  getTopRandomMonthlyWinners,
} from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import showAlert from "../../utils/alert";

const getCurrentWeekKey = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNo =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

const TopRandomScreen = () => {
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const [winners, setWinners] = useState([]);
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey());

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, winnersRes] = await Promise.all([
        getTopRandomMonthlyStatus(),
        getTopRandomMonthlyWinners(),
      ]);

      const statusPayload = statusRes?.data || null;
      setStatus(statusPayload);
      if (statusPayload?.week) setWeekKey(statusPayload.week);
      setWinners(Array.isArray(winnersRes?.data?.winners) ? winnersRes.data.winners : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load Top Random Weekly Picks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClaim = async () => {
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
      showAlert("Claiming is temporarily disabled.");
      return;
    }
    setClaiming(true);
    setError("");
    try {
      await claimTopRandomMonthlyReward(weekKey);
      await refreshUser?.();
      await loadData();
      showAlert("Success", "Reward claimed successfully and added to redeem balance.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to claim reward"
      );
    } finally {
      setClaiming(false);
    }
  };

  const myStatus = status?.user || {};
  const canClaim = Boolean(myStatus?.claimable) && !claiming;

  return (
    <Page>
      <Container>
        <Header>
          <IconButton onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={20} />
          </IconButton>
      <Title>Top Random Weekly Picks</Title>
          <IconButton onClick={loadData} aria-label="Refresh">
            <RefreshCw size={18} />
          </IconButton>
        </Header>

        <Card>
          <Row>
            <Label>Week</Label>
            <Value>{weekKey}</Value>
          </Row>
          <Row>
            <Label>Winners</Label>
            <Value>
              {Number(status?.winnersCount || 0)}/{Number(status?.maxWinners || 10)}
            </Value>
          </Row>
          <Row>
            <Label>Your Purchases This Week</Label>
            <Value>{Number(myStatus?.purchasesCount || 0)}</Value>
          </Row>
          <Row>
            <Label>Minimum Purchases</Label>
            <Value>{Number(status?.required || 7)}</Value>
          </Row>
          <Row>
            <Label>Data Left to Qualify</Label>
            <Value>{Number(status?.remaining || 0)}</Value>
          </Row>
          <Row>
            <Label>Status</Label>
            <Value>
              {myStatus?.isWinner
                ? myStatus?.claimed
                  ? "Winner (Claimed)"
                  : "Winner (Unclaimed)"
                : myStatus?.hasBoughtForWeek
                ? "Eligible Buyer"
                : "Not Eligible Yet"}
            </Value>
          </Row>
          <ProgressWrap>
            <ProgressLabelRow>
              <ProgressLabel>Progress to 7 purchases</ProgressLabel>
              <ProgressValue>{Math.round(Number(status?.progress || 0))}%</ProgressValue>
            </ProgressLabelRow>
            <ProgressTrack>
              <ProgressFill $width={Number(status?.progress || 0)} />
            </ProgressTrack>
            <ProgressNote>
              {Number(status?.remaining || 0)} data left to complete the task.
            </ProgressNote>
          </ProgressWrap>

          <ActionRow>
            <PrimaryButton
              onClick={handleClaim}
              disabled={!canClaim || FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}
            >
              <Gift size={16} />
              {claiming ? "Claiming..." : canClaim ? "Claim ₦10,000" : "No Reward To Claim"}
            </PrimaryButton>
            {/* Redeem disabled/hidden */}
          </ActionRow>

          {error && <ErrorText>{error}</ErrorText>}
          {loading && <Muted>Loading...</Muted>}
          {!loading && !status?.drawReady && (
            <Muted>
              Draw runs at week end. You need at least {Number(status?.required || 7)} purchases to be eligible.
            </Muted>
          )}
        </Card>

        <Card>
          <SectionTitle>Weekly Winners</SectionTitle>
          {winners.length === 0 ? (
            <Muted>No winners published yet for {weekKey}.</Muted>
          ) : (
            <List>
              {winners.map((winner) => (
                <WinnerRow key={`${winner.userId}-${winner.week}`}>
                  <Avatar src={winner.photo || DEFAULT_AVATAR} alt={winner.username} />
                  <WinnerInfo>
                    <WinnerName>{winner.username}</WinnerName>
                    <WinnerMeta>
                      {winner.claimed ? "Claimed" : "Unclaimed"} • ₦
                      {Number(winner.amount || 0).toLocaleString()}
                    </WinnerMeta>
                  </WinnerInfo>
                  <Trophy size={18} color="#ff7a00" />
                </WinnerRow>
              ))}
            </List>
          )}
        </Card>
      </Container>
    </Page>
  );
};

export default TopRandomScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 16px;
`;

const Container = styled.div`
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
`;

const IconButton = styled.button`
  border: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 16px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Label = styled.span`
  color: #666;
  font-size: 13px;
`;

const Value = styled.span`
  color: #111;
  font-size: 14px;
  font-weight: 700;
`;

const ActionRow = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const PrimaryButton = styled.button`
  border: 0;
  border-radius: 10px;
  padding: 12px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  &:disabled {
    background: #bcbcbc;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
  color: #111;
  font-weight: 700;
  cursor: pointer;
`;

const ErrorText = styled.p`
  margin: 10px 0 0;
  color: #dc2626;
  font-size: 13px;
`;

const ProgressWrap = styled.div`
  margin-top: 8px;
  display: grid;
  gap: 6px;
`;

const ProgressLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  font-weight: 600;
`;

const ProgressLabel = styled.span`
  color: #666;
`;

const ProgressValue = styled.span`
  color: #ff7a00;
  font-weight: 700;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #eee;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${({ $width }) => Math.max(0, Math.min(100, Number($width || 0)))}%;
  background: linear-gradient(90deg, #ff7a00, #ff4d00);
  transition: width 0.3s ease;
`;

const ProgressNote = styled.span`
  font-size: 12px;
  color: #666;
`;

const Muted = styled.p`
  margin: 10px 0 0;
  color: #666;
  font-size: 13px;
`;

const List = styled.div`
  display: grid;
  gap: 8px;
`;

const WinnerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
`;

const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  object-fit: cover;
  background: #f0f0f0;
`;

const WinnerInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const WinnerName = styled.div`
  font-size: 14px;
  font-weight: 700;
`;

const WinnerMeta = styled.div`
  font-size: 12px;
  color: #666;
`;
