import React, { useContext, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import Confetti from "react-confetti";
import { ArrowLeft, CheckCircle2, History, Ticket, TriangleAlert } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import api from "../../utils/api";
import { DRAW_LETTERS, letterToNumber, numberToLetter } from "../../utils/drawLetters";

const REQUIRED_PICKS = 5;
const PROMO_PICKS = 3;

const DailyNumberDrawScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [promoLetters, setPromoLetters] = useState(Array(PROMO_PICKS).fill(""));
  const [promoGridLetters, setPromoGridLetters] = useState([]);
  const [promoRevealReady, setPromoRevealReady] = useState(false);
  const [promoWinningGroup, setPromoWinningGroup] = useState(null);
  const [promoRevealAt, setPromoRevealAt] = useState("");
  const [promoGridLoading, setPromoGridLoading] = useState(false);
  const [promoGridError, setPromoGridError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [noTicketModal, setNoTicketModal] = useState(false);
  const [toast, setToast] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const toastTimeoutRef = useRef(null);
  const promoInputRefs = useRef([]);

  const tickets = Number(user?.tickets || 0);
  const historyCount = Array.isArray(user?.dailyNumberDraw) ? user.dailyNumberDraw.length : 0;
  const letters = useMemo(() => DRAW_LETTERS, []);
  const isMerchantRole = String(user?.userRole || "").toLowerCase() === "merchant";

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

  const submitLetters = async (lettersToSubmit, requiredCount = REQUIRED_PICKS) => {
    if (tickets <= 0) {
      setNoTicketModal(true);
      return;
    }
    if (lettersToSubmit.length !== requiredCount) {
      showToast(`Select exactly ${requiredCount} letters`);
      return;
    }

    setSubmitting(true);
    try {
      const mappedNumbers = lettersToSubmit.map((letter) => letterToNumber(letter));
      const res = await api.post("/daily-game/play", { numbers: mappedNumbers });
      if (res?.data?.success) {
        await refreshUser?.();
        setSelectedLetters([]);
        setPromoLetters(Array(PROMO_PICKS).fill(""));
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

  const handleSubmit = () => submitLetters(selectedLetters, REQUIRED_PICKS);

  const handlePromoSubmit = () => {
    const lettersOnly = promoLetters.map((l) => l.trim().toUpperCase()).filter(Boolean);
    if (lettersOnly.length !== PROMO_PICKS || promoLetters.some((l) => !l.trim())) {
      showToast("Enter exactly 3 letters");
      return;
    }
    submitLetters(lettersOnly, PROMO_PICKS);
  };

  const handlePromoChange = (index, value) => {
    const cleaned = value.replace(/[^a-zA-Z]/g, "").slice(0, 1).toUpperCase();
    setPromoLetters((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && promoInputRefs.current[index + 1]) {
      promoInputRefs.current[index + 1].focus();
    }
  };

  const handlePromoKeyDown = (index, event) => {
    if (event.key === "Backspace" && !promoLetters[index] && promoInputRefs.current[index - 1]) {
      promoInputRefs.current[index - 1].focus();
    }
  };

  const fallbackPromoLetters = useMemo(() => ["a", "c", "e", "g", "i", "k", "m", "o", "q"], []);
  const displayPromoGridLetters = promoGridLetters.length ? promoGridLetters : fallbackPromoLetters;

  useEffect(() => {
    if (!isMerchantRole) return;
    let mounted = true;
    setPromoGridLoading(true);
    setPromoGridError("");
    api
      .get("/daily-game/merchant-card")
      .then((res) => {
        if (!mounted) return;
        const payload = res?.data || {};
        const letters = Array.isArray(payload.letters)
          ? payload.letters
              .map((value) => numberToLetter(value))
              .map((letter) => String(letter || "").toLowerCase())
          : [];
        setPromoGridLetters(letters);
        setPromoRevealReady(Boolean(payload.revealReady));
        setPromoWinningGroup(
          Number.isInteger(payload.winningGroupIndex) ? payload.winningGroupIndex : null
        );
        setPromoRevealAt(payload.revealAt || "");
      })
      .catch((err) => {
        if (!mounted) return;
        setPromoGridError(err?.response?.data?.message || "Unable to load weekly card");
      })
      .finally(() => {
        if (!mounted) return;
        setPromoGridLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isMerchantRole]);

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
        <HeaderTitle>{isMerchantRole ? "Weekly Card Game" : "Weekly Number Draw"}</HeaderTitle>
        <HeaderIcon onClick={() => navigate("/daily-history")} aria-label="Open history">
          <History size={22} />
          {historyCount > 0 && <HistoryBadge>{historyCount}</HistoryBadge>}
        </HeaderIcon>
      </Header>

      {isMerchantRole ? (
        <PromoBody>
          <PromoCard>
            <PromoBrand>BIGGI DATA BUNDLE SERVICES</PromoBrand>
            <PromoTitle>PROMO TICKET</PromoTitle>
            <PromoSubtitle>Predict three (3) letters from A - Z</PromoSubtitle>

            <PromoGridWrap>
              {[0, 1, 2].map((group) => (
                <PromoGridGroup
                  key={`group-${group}`}
                  $winner={promoRevealReady && promoWinningGroup === group}
                >
                  {[0, 1, 2].map((col) => {
                    const idx = group * 3 + col;
                    return (
                      <PromoGridBox
                        key={`grid-${idx}`}
                        aria-hidden="true"
                        $winner={promoRevealReady && promoWinningGroup === group}
                      >
                        {promoRevealReady ? displayPromoGridLetters[idx] : "?"}
                      </PromoGridBox>
                    );
                  })}
                </PromoGridGroup>
              ))}
            </PromoGridWrap>
            {promoGridLoading ? (
              <PromoHint>Loading weekly card...</PromoHint>
            ) : promoGridError ? (
              <PromoHint role="button" onClick={() => setPromoGridError("")}>
                {promoGridError}
              </PromoHint>
            ) : (
              <PromoHint>
                {promoRevealReady
                  ? "Winning set revealed for this week."
                  : promoRevealAt
                  ? `Reveal on ${new Date(promoRevealAt).toLocaleDateString()}`
                  : "Reveal at week end"}
              </PromoHint>
            )}

            <PromoBoxes>
              {promoLetters.map((value, index) => (
                <PromoInput
                  key={`promo-${index}`}
                  ref={(el) => {
                    promoInputRefs.current[index] = el;
                  }}
                  value={value}
                  onChange={(e) => handlePromoChange(index, e.target.value)}
                  onKeyDown={(e) => handlePromoKeyDown(index, e)}
                  maxLength={1}
                  inputMode="text"
                  aria-label={`Promo letter ${index + 1}`}
                />
              ))}
            </PromoBoxes>

            <PromoDate>Promo date: April - June 2026</PromoDate>

            <PromoActions>
              <PromoTicketRow>
                <Ticket size={18} color="#f7c59f" />
                <span>{tickets} Tickets Left</span>
              </PromoTicketRow>
              <PromoSubmit onClick={handlePromoSubmit} disabled={submitting || promoLetters.some((l) => !l.trim())}>
                {submitting ? "Submitting..." : "Submit Ticket"}
              </PromoSubmit>
            </PromoActions>
          </PromoCard>
        </PromoBody>
      ) : (
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
      )}

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

const PromoBody = styled.div`
  min-height: calc(100vh - 90px);
  padding: 24px 16px 40px;
  background: radial-gradient(circle at top, rgba(30, 94, 142, 0.3), transparent 60%),
    linear-gradient(135deg, #0b1b2b 0%, #0c3b4a 45%, #1a1f2f 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const PromoCard = styled.div`
  width: min(680px, 100%);
  border-radius: 26px;
  padding: 28px 24px 26px;
  background: linear-gradient(165deg, rgba(15, 34, 54, 0.98), rgba(6, 16, 26, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    width: 320px;
    height: 320px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(122, 204, 222, 0.35), transparent 70%);
    top: -120px;
    right: -140px;
  }

  &::after {
    content: "";
    position: absolute;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 182, 193, 0.28), transparent 70%);
    bottom: -140px;
    left: -120px;
  }
`;

const PromoBrand = styled.p`
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: 600;
`;

const PromoTitle = styled.h2`
  margin: 8px 0 6px;
  text-align: center;
  color: #f9f6f1;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 2px;
`;

const PromoSubtitle = styled.p`
  margin: 0 0 18px;
  text-align: center;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
`;

const PromoBoxes = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(48px, 1fr));
  gap: 10px;
  margin-bottom: 18px;
`;

const PromoGridWrap = styled.div`
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-bottom: 16px;
`;

const PromoGridGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(48px, 1fr));
  gap: 6px;
  padding: 4px;
  border-radius: 12px;
  background: ${(p) => (p.$winner ? "rgba(241, 182, 122, 0.2)" : "transparent")};
  box-shadow: ${(p) =>
    p.$winner ? "0 0 0 1px rgba(241, 182, 122, 0.45)" : "none"};
`;

const PromoGridBox = styled.div`
  height: 48px;
  border-radius: 10px;
  background: #ffffff;
  color: ${(p) => (p.$winner ? "#9a3412" : "#111")};
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  text-transform: lowercase;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
`;

const PromoHint = styled.p`
  margin: 0 0 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
`;

const PromoInput = styled.input`
  height: 48px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  outline: none;

  &:focus {
    border-color: #7ac5d8;
    box-shadow: 0 0 0 2px rgba(122, 197, 216, 0.3);
  }
`;

const PromoDate = styled.p`
  margin: 6px 0 18px;
  text-align: center;
  color: #f7c59f;
  font-size: 13px;
  font-weight: 600;
`;

const PromoActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
`;

const PromoTicketRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
`;

const PromoSubmit = styled.button`
  border: none;
  border-radius: 999px;
  padding: 12px 30px;
  background: ${(p) => (p.disabled ? "#6f6f6f" : "linear-gradient(135deg, #f1b67a, #d86b5f)")};
  color: #101010;
  font-weight: 800;
  font-size: 15px;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  box-shadow: ${(p) => (p.disabled ? "none" : "0 10px 24px rgba(241, 182, 122, 0.35)")};
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

