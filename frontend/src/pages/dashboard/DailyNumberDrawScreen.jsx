import React, { useContext, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Confetti from "react-confetti";
import { ArrowLeft, CheckCircle2, History, Ticket, TriangleAlert } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import api from "../../utils/api";

const MAX_NUMBERS = 70;
const REQUIRED_PICKS = 5;

const DailyNumberDrawScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [noTicketModal, setNoTicketModal] = useState(false);
  const [toast, setToast] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const toastTimeoutRef = useRef(null);

  const tickets = Number(user?.tickets || 0);
  const historyCount = Array.isArray(user?.dailyNumberDraw)
    ? user.dailyNumberDraw.length
    : 0;
  const numbers = useMemo(
    () => Array.from({ length: MAX_NUMBERS }, (_, i) => i + 1),
    []
  );

  const showToast = (message) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(""), 1800);
  };

  const toggleNumber = (num) => {
    if (tickets <= 0) {
      setNoTicketModal(true);
      return;
    }

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers((prev) => prev.filter((n) => n !== num));
      return;
    }

    if (selectedNumbers.length < REQUIRED_PICKS) {
      setSelectedNumbers((prev) => [...prev, num]);
      return;
    }

    showToast("You can select only 5 numbers");
  };

  const handleSubmit = async () => {
    if (tickets <= 0) {
      setNoTicketModal(true);
      return;
    }

    if (selectedNumbers.length !== REQUIRED_PICKS) {
      showToast("Select exactly 5 numbers");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/daily-game/play", {
        numbers: selectedNumbers,
      });

      if (res?.data?.success) {
        await refreshUser?.();
        setSelectedNumbers([]);
        setSuccessModal(true);
        setShowConfetti(true);
        window.setTimeout(() => setShowConfetti(false), 1800);
      } else {
        showToast(res?.data?.message || res?.data?.msg || "Submission failed");
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Unable to submit"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
    return (
      <Page>
        <Card>
          <Title>Daily Number Draw</Title>
          <Muted>
            The Daily Number Draw feature is temporarily disabled for review.
          </Muted>
          <PrimaryButton onClick={() => navigate("/")}>Return Home</PrimaryButton>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      {showConfetti && <Confetti recycle={false} numberOfPieces={220} />}
      <Container>
        <Header>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </IconButton>
          <Title>Daily Number Draw</Title>
          <IconButton onClick={() => navigate("/daily-history")} aria-label="Open history">
            <History size={20} />
            {historyCount > 0 && <HistoryBadge>{historyCount}</HistoryBadge>}
          </IconButton>
        </Header>

        <Card>
          <Muted>
            Select 5 lucky numbers from 1-70. Each play consumes 1 ticket.
          </Muted>
          <TicketRow>
            <Ticket size={18} color="#ff7a00" />
            <strong>{tickets}</strong> tickets available
          </TicketRow>

          <Grid>
            {numbers.map((num) => {
              const selected = selectedNumbers.includes(num);
              return (
                <NumButton
                  key={num}
                  $selected={selected}
                  onClick={() => toggleNumber(num)}
                >
                  {num}
                </NumButton>
              );
            })}
          </Grid>

          <PrimaryButton
            onClick={handleSubmit}
            disabled={submitting || selectedNumbers.length !== REQUIRED_PICKS}
          >
            {submitting ? "Submitting..." : "Submit"}
          </PrimaryButton>
        </Card>
      </Container>

      {toast && <Toast>{toast}</Toast>}

      {successModal && (
        <Overlay>
          <ModalCard>
            <CheckCircle2 size={54} color="#22c55e" />
            <h3>Submitted</h3>
            <p>Your numbers were entered. Results are drawn at 7:00 PM.</p>
            <PrimaryButton onClick={() => setSuccessModal(false)}>OK</PrimaryButton>
          </ModalCard>
        </Overlay>
      )}

      {noTicketModal && (
        <Overlay>
          <ModalCard>
            <TriangleAlert size={54} color="#ef4444" />
            <h3>No Tickets</h3>
            <p>You need at least 1 ticket to play.</p>
            <PrimaryButton onClick={() => setNoTicketModal(false)}>Close</PrimaryButton>
          </ModalCard>
        </Overlay>
      )}
    </Page>
  );
};

export default DailyNumberDrawScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 16px;
`;

const Container = styled.div`
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const Muted = styled.p`
  margin: 0 0 12px;
  color: #444;
`;

const TicketRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 8px;
  margin-bottom: 14px;
`;

const NumButton = styled.button`
  border: 1px solid ${(p) => (p.$selected ? "#ff7a00" : "#d1d5db")};
  background: ${(p) => (p.$selected ? "#ff7a00" : "#fff")};
  color: ${(p) => (p.$selected ? "#fff" : "#111")};
  height: 42px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 13px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    background: #c7c7c7;
    cursor: not-allowed;
  }
`;

const IconButton = styled.button`
  position: relative;
  border: 0;
  background: #fff;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const HistoryBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ff7a00;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: grid;
  place-items: center;
  padding: 0 4px;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 60;
`;

const ModalCard = styled.div`
  width: min(92vw, 360px);
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  h3 {
    margin: 10px 0 6px;
  }
  p {
    margin: 0 0 14px;
    color: #555;
  }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 70;
`;
