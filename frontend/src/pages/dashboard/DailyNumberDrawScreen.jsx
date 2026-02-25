import React, { useContext, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import Confetti from "react-confetti";
import { ArrowLeft, CheckCircle2, History, Ticket, TriangleAlert } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import api from "../../utils/api";
import { DRAW_LETTERS, letterToNumber } from "../../utils/drawLetters";

const REQUIRED_PICKS = 5;

const DailyNumberDrawScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [noTicketModal, setNoTicketModal] = useState(false);
  const [toast, setToast] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const toastTimeoutRef = useRef(null);

  const tickets = Number(user?.tickets || 0);
  const historyCount = Array.isArray(user?.dailyNumberDraw) ? user.dailyNumberDraw.length : 0;
  const letters = useMemo(() => DRAW_LETTERS, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(""), 1800);
  };

  const toggleLetter = (letter) => {
    if (tickets <= 0) {
      setNoTicketModal(true);
      return;
    }
    if (selectedLetters.includes(letter)) {
      setSelectedLetters((prev) => prev.filter((n) => n !== letter));
      return;
    }
    if (selectedLetters.length < REQUIRED_PICKS) {
      setSelectedLetters((prev) => [...prev, letter]);
      return;
    }
    showToast("You can select only 5 letters");
  };

  const handleSubmit = async () => {
    if (tickets <= 0) {
      setNoTicketModal(true);
      return;
    }
    if (selectedLetters.length !== REQUIRED_PICKS) {
      showToast("Select exactly 5 letters");
      return;
    }

    setSubmitting(true);
    try {
      const mappedNumbers = selectedLetters.map((letter) => letterToNumber(letter));
      const res = await api.post("/daily-game/play", { numbers: mappedNumbers });
      if (res?.data?.success) {
        await refreshUser?.();
        setSelectedLetters([]);
        setSuccessModal(true);
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 1800);
      } else {
        showToast(res?.data?.message || res?.data?.msg || "Submission failed");
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.msg || "Unable to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
    return (
      <Page>
        <Body>
          <DisabledCard>
            <h2>Weekly Number Draw</h2>
            <p>The Weekly Number Draw feature is temporarily disabled for review.</p>
            <SubmitButton onClick={() => navigate("/")}>Return Home</SubmitButton>
          </DisabledCard>
        </Body>
      </Page>
    );
  }

  return (
    <Page>
      {showConfetti && <Confetti recycle={false} numberOfPieces={220} />}
      <Header>
        <HeaderIcon onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </HeaderIcon>
        <HeaderTitle>Weekly Number Draw</HeaderTitle>
        <HeaderIcon onClick={() => navigate("/daily-history")} aria-label="Open history">
          <History size={22} />
          {historyCount > 0 && <HistoryBadge>{historyCount}</HistoryBadge>}
        </HeaderIcon>
      </Header>

      <Body>
        <HelpText>
          Select 5 letters from A-Z then a-z (52 total). Each play consumes 1 ticket.
          <br />
          Results are released at month end.
        </HelpText>

        <TicketRow>
          <Ticket size={20} color="#ff8c00" />
          <TicketText>{tickets} Tickets Left</TicketText>
        </TicketRow>

        <ChooseText>Choose 5 letters</ChooseText>

        <Grid>
          {letters.map((letter) => {
            const selected = selectedLetters.includes(letter);
            return (
              <LetterBox key={letter} $selected={selected} onClick={() => toggleLetter(letter)}>
                {letter}
              </LetterBox>
            );
          })}
        </Grid>

        <SubmitWrap>
          <SubmitButton onClick={handleSubmit} disabled={submitting || selectedLetters.length !== REQUIRED_PICKS}>
            {submitting ? "Submitting..." : "Submit"}
          </SubmitButton>
        </SubmitWrap>
      </Body>

      {toast && <Toast>{toast}</Toast>}

      {successModal && (
        <Overlay>
          <ModalCard>
            <CheckCircle2 size={64} color="#4cd964" />
            <ModalTitle>Submitted</ModalTitle>
            <ModalMessage>Your letters were entered. Weekly results are released at month end.</ModalMessage>
            <ModalButton onClick={() => setSuccessModal(false)}>OK</ModalButton>
          </ModalCard>
        </Overlay>
      )}

      {noTicketModal && (
        <Overlay>
          <ModalCard>
            <TriangleAlert size={62} color="#ff3b30" />
            <ModalTitle>No Tickets</ModalTitle>
            <ModalMessage>You need at least 1 ticket to play.</ModalMessage>
            <ModalButton onClick={() => setNoTicketModal(false)}>Close</ModalButton>
          </ModalCard>
        </Overlay>
      )}
    </Page>
  );
};

export default DailyNumberDrawScreen;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #000;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  padding-top: 40px;
  color: #fff;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  color: #ff8c00;
  font-size: 22px;
  font-weight: 800;
`;

const HeaderIcon = styled.button`
  position: relative;
  border: none;
  background: transparent;
  color: #fff;
  width: 30px;
  height: 30px;
  cursor: pointer;
`;

const HistoryBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  border-radius: 10px;
  background: #ff7a00;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 800;
  padding: 0 4px;
`;

const Body = styled.div`
  background: #fff;
  border-top-left-radius: 40px;
  border-top-right-radius: 40px;
  min-height: calc(100vh - 90px);
  padding: 20px 16px 26px;
`;

const DisabledCard = styled.div`
  max-width: 420px;
  margin: 40px auto 0;
  text-align: center;
  h2 {
    margin: 0 0 8px;
  }
  p {
    color: #555;
    margin: 0 0 16px;
  }
`;

const HelpText = styled.p`
  text-align: center;
  font-size: 13.5px;
  line-height: 1.5;
  color: #000;
  margin: 0;
`;

const TicketRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
`;

const TicketText = styled.span`
  font-size: 15px;
  color: #000;
  font-weight: 700;
`;

const ChooseText = styled.p`
  margin: 12px 0;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
`;

const LetterBox = styled.button`
  height: 40px;
  border-radius: 10px;
  border: 1px solid ${(p) => (p.$selected ? "#ff8c00" : "#ccc")};
  background: ${(p) => (p.$selected ? "#ff8c00" : "#fff")};
  color: ${(p) => (p.$selected ? "#fff" : "#111")};
  font-size: 14px;
  font-weight: ${(p) => (p.$selected ? 800 : 600)};
  cursor: pointer;
`;

const SubmitWrap = styled.div`
  width: 60%;
  margin: 18px auto 0;
  animation: ${pulse} 1.8s ease-in-out infinite;
`;

const SubmitButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 30px;
  padding: 12px;
  background: ${(p) => (p.disabled ? "#ccc" : "#ff8c00")};
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
`;

const Toast = styled.div`
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 25px;
  background: #333;
  color: #fff;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  z-index: 80;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 90;
`;

const ModalCard = styled.div`
  width: min(88vw, 340px);
  background: #fff;
  border-radius: 16px;
  padding: 26px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 12px 0 6px;
  font-size: 20px;
  font-weight: 700;
`;

const ModalMessage = styled.p`
  margin: 0 0 18px;
  color: #555;
`;

const ModalButton = styled.button`
  border: none;
  border-radius: 25px;
  background: #ff8c00;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  padding: 10px 40px;
  cursor: pointer;
`;

