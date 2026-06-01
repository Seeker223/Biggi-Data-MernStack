import React, { useContext, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import Confetti from "react-confetti";
import { ArrowLeft, CheckCircle2, History, Ticket, TriangleAlert } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import api from "../../utils/api";
import { DRAW_LETTERS, letterToNumber, numberToLetter } from "../../utils/drawLetters";
import { isBiggiHouseMember } from "../../utils/biggiHouse";

const REQUIRED_PICKS = 5;
const MONTHLY_TICKET_CAP = 8;
const MONTHLY_SET_COUNT = 5;
const MONTHLY_SET_SIZE = 3;

const DailyNumberDrawScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [resultLetters, setResultLetters] = useState([]);
  const [monthlyResultSets, setMonthlyResultSets] = useState([]);
  const [resultRevealReady, setResultRevealReady] = useState(false);
  const [resultRevealAt, setResultRevealAt] = useState("");
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState("");
  const [monthlyPurchases, setMonthlyPurchases] = useState(0);
  const [monthlyRequired, setMonthlyRequired] = useState(5);
  const [monthlySets, setMonthlySets] = useState(
    Array.from({ length: MONTHLY_SET_COUNT }, (_, index) => ({
      setIndex: index + 1,
      unlocked: false,
      played: false,
      locked: true,
      playedAt: null,
      code: "",
    }))
  );
  const [activeMonthlySet, setActiveMonthlySet] = useState(0);
  const [monthlySetLoading, setMonthlySetLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [noTicketModal, setNoTicketModal] = useState(false);
  const [toast, setToast] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const toastTimeoutRef = useRef(null);

  const tickets = Number(user?.tickets || 0);
  const historyCount = Array.isArray(user?.dailyNumberDraw) ? user.dailyNumberDraw.length : 0;
  const letters = useMemo(() => DRAW_LETTERS.slice(0, 26), []);
  const isMerchantRole = isBiggiHouseMember(user);
  const isPrivateRole = !isMerchantRole;
  const isMonthlyCardRole = isMerchantRole || isPrivateRole;

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
  const handleClear = () => setSelectedLetters([]);

  const getActiveMonthlySet = () => monthlySets[activeMonthlySet] || monthlySets[0];

  const selectMonthlySet = (index) => {
    const set = monthlySets[index];
    if (!set) return;
    if (set.locked) {
      setNoTicketModal(true);
      return;
    }
    setActiveMonthlySet(index);
  };

  const pickMonthlyLetter = (letter) => {
    setMonthlySets((prev) => {
      const next = prev.map((set) => ({ ...set, letters: [...(set.letters || [])] }));
      const current = next[activeMonthlySet];
      if (!current || current.locked || current.played) return prev;
      const targetIndex = current.letters.findIndex((item) => !item);
      if (targetIndex === -1) return prev;
      current.letters[targetIndex] = letter;
      return next;
    });
  };

  const clearMonthlySet = (index) => {
    setMonthlySets((prev) =>
      prev.map((set, setIndex) =>
        setIndex === index
          ? { ...set, letters: Array(MONTHLY_SET_SIZE).fill(""), code: "", played: false }
          : set
      )
    );
  };

  const monthlyUnlockedCount = monthlySets.filter((item) => item.unlocked).length;
  const monthlyPlayedCount = monthlySets.filter((item) => item.played).length;
  const activeMonthlySetData = getActiveMonthlySet();

  const submitMonthlySet = async (index) => {
    const set = monthlySets[index];
    if (!set || set.locked) {
      setNoTicketModal(true);
      return;
    }
    const code = (set.letters || []).join("").toUpperCase();
    if (code.length !== MONTHLY_SET_SIZE || code.includes("")) {
      showToast(`Select exactly ${MONTHLY_SET_SIZE} letters for set ${index + 1}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/monthly-game/play", {
        setIndex: index + 1,
        code,
      });
      if (res?.data?.success) {
        setMonthlySets((prev) =>
          prev.map((item, setIndex) =>
            setIndex === index
              ? { ...item, played: true, playedAt: new Date().toISOString(), code }
              : item
          )
        );
        await refreshUser?.();
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

  const fallbackResultLetters = useMemo(() => ["A", "C", "E", "G", "I", "K", "M", "O", "Q"], []);
  const displayResultLetters = resultLetters.length ? resultLetters : fallbackResultLetters;
  const monthlyTowardNext = monthlyRequired > 0 ? monthlyPurchases % monthlyRequired : 0;
  const monthlyToNextTicket =
    monthlyRequired > 0 ? (monthlyTowardNext === 0 ? monthlyRequired : monthlyRequired - monthlyTowardNext) : 0;

  useEffect(() => {
    if (!isMonthlyCardRole) return;
    let mounted = true;
    setResultLoading(true);
    setResultError("");
    setMonthlySetLoading(true);

    Promise.allSettled([
      api.get("/monthly-game/eligibility"),
      api.get("/monthly-game/tickets"),
      api.get("/monthly-game/winners"),
    ])
      .then((results) => {
        if (!mounted) return;

        const eligibilityRes = results?.[0]?.status === "fulfilled" ? results[0].value : null;
        const ticketsRes = results?.[1]?.status === "fulfilled" ? results[1].value : null;
        const winnersRes = results?.[2]?.status === "fulfilled" ? results[2].value : null;

        const eligibility = eligibilityRes?.data?.eligibility || {};
        setMonthlyPurchases(Number(eligibility.purchases || 0));
        setMonthlyRequired(Number(eligibility.required || MONTHLY_SET_COUNT));
        setResultRevealAt(eligibility?.resultRevealAt || eligibility?.drawAt || "");

        const ticketRows = Array.isArray(ticketsRes?.data?.tickets) ? ticketsRes.data.tickets : [];
        const normalizedSets = Array.from({ length: MONTHLY_SET_COUNT }, (_, index) => {
          const row = ticketRows.find((item) => Number(item.setIndex) === index + 1) || {};
          const code = String(row.code || "").toUpperCase();
          const unlocked =
            row.locked === undefined ? index < Number(eligibility?.setsUnlocked || 0) : !row.locked;
          return {
            setIndex: index + 1,
            unlocked,
            locked: Boolean(row.locked),
            played: Boolean(row.played),
            playedAt: row.playedAt || null,
            code,
            letters: code ? code.split("").slice(0, MONTHLY_SET_SIZE) : Array(MONTHLY_SET_SIZE).fill(""),
          };
        });
        setMonthlySets(normalizedSets);

        const draw = winnersRes?.data?.draw || {};
        const resultSets = Array.isArray(draw.winningSets) ? draw.winningSets : [];
        setMonthlyResultSets(resultSets.slice(0, MONTHLY_SET_COUNT).map((set) => set.map((letter) => String(letter || "").toUpperCase())));
        setResultRevealReady(resultSets.length === MONTHLY_SET_COUNT);
        setResultLetters([]);
        setResultError("");
        if (normalizedSets.find((item) => item.unlocked && !item.played)) {
          const firstUnlocked = normalizedSets.findIndex((item) => item.unlocked && !item.played);
          setActiveMonthlySet(firstUnlocked >= 0 ? firstUnlocked : 0);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setResultError(err?.response?.data?.message || "Unable to load monthly card");
      })
      .finally(() => {
        if (!mounted) return;
        setResultLoading(false);
        setMonthlySetLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isMonthlyCardRole]);

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
        <HeaderTitle>{isMonthlyCardRole ? "Monthly Card Game" : "Weekly Number Draw"}</HeaderTitle>
        <HeaderIcon onClick={() => navigate("/daily-history")} aria-label="Open history">
          <History size={22} />
          {historyCount > 0 && <HistoryBadge>{historyCount}</HistoryBadge>}
        </HeaderIcon>
      </Header>

      {isMonthlyCardRole ? (
        <PromoBody>
          <PromoCard>
            <PromoBrand>BIGGI DATA BUNDLE SERVICES</PromoBrand>
            <PromoTitle>MONTHLY CARD GAME</PromoTitle>
            <PromoSubtitle>
              Complete 5 sets of 3 letters. Each data purchase unlocks one set. Results are released at month end.
            </PromoSubtitle>
            <PromoSubtitle>
              Sets unlocked: {monthlyUnlockedCount}/{MONTHLY_SET_COUNT}. Completed: {monthlyPlayedCount}/{MONTHLY_SET_COUNT}.
            </PromoSubtitle>

            <ResultTitle>Monthly result sets</ResultTitle>
            <MonthlyResultList aria-label="Monthly result sets">
              {Array.from({ length: MONTHLY_SET_COUNT }, (_, setIndex) => {
                const resultSet = monthlyResultSets[setIndex] || [];
                return (
                  <MonthlyResultCard key={`result-set-${setIndex}`}>
                    <MonthlyResultHeader>
                      <span>Set {setIndex + 1}</span>
                      <MonthlyResultBadge $ready={resultRevealReady}>
                        {resultRevealReady ? "Revealed" : "Locked"}
                      </MonthlyResultBadge>
                    </MonthlyResultHeader>
                    <MonthlyResultGrid>
                      {Array.from({ length: MONTHLY_SET_SIZE }, (_, letterIndex) => (
                        <ResultBox key={`result-${setIndex}-${letterIndex}`} aria-hidden="true">
                          {resultRevealReady ? resultSet[letterIndex] || "?" : "?"}
                        </ResultBox>
                      ))}
                    </MonthlyResultGrid>
                  </MonthlyResultCard>
                );
              })}
            </MonthlyResultList>

            {resultLoading ? (
              <PromoHint>Loading monthly card...</PromoHint>
            ) : resultError ? (
              <PromoHint role="button" onClick={() => setResultError("")}>
                {resultError}
              </PromoHint>
            ) : (
              <PromoHint>
                {resultRevealReady
                  ? "Result revealed for this month."
                  : resultRevealAt
                  ? `Reveals on ${new Date(resultRevealAt).toLocaleDateString()}`
                  : "Reveals at month end"}
              </PromoHint>
            )}

            <ChooseText $promo>
              {activeMonthlySetData?.played
                ? `Set ${activeMonthlySetData.setIndex} already submitted`
                : `Choose 3 letters for Set ${activeMonthlySetData?.setIndex || 1}`}
            </ChooseText>

            <MonthlyBoard>
              {monthlySets.map((set, index) => {
                const lettersForSet = Array.isArray(set.letters)
                  ? set.letters
                  : Array(MONTHLY_SET_SIZE).fill("");
                const selected = activeMonthlySet === index;
                return (
                  <MonthlySetCard
                    key={`monthly-set-${set.setIndex}`}
                    $selected={selected}
                    $locked={!set.unlocked}
                    $played={set.played}
                    type="button"
                    onClick={() => selectMonthlySet(index)}
                  >
                    <MonthlySetHeader>
                      <div>
                        <MonthlySetTitle>Set {set.setIndex}</MonthlySetTitle>
                        <MonthlySetMeta>
                          {set.played ? "Submitted" : set.unlocked ? "Unlocked" : "Locked"}
                        </MonthlySetMeta>
                      </div>
                      <MonthlySetBadge $locked={!set.unlocked} $played={set.played}>
                        {set.played ? "Done" : set.unlocked ? "Open" : "Locked"}
                      </MonthlySetBadge>
                    </MonthlySetHeader>

                    <MonthlySetGrid>
                      {Array.from({ length: MONTHLY_SET_SIZE }, (_, letterIndex) => (
                        <MonthlySetBox
                          key={`monthly-set-${set.setIndex}-box-${letterIndex}`}
                          $filled={Boolean(lettersForSet[letterIndex])}
                          $active={selected}
                          $locked={!set.unlocked || set.played}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!set.unlocked || set.played) return;
                            setActiveMonthlySet(index);
                          }}
                        >
                          {lettersForSet[letterIndex] || "?"}
                        </MonthlySetBox>
                      ))}
                    </MonthlySetGrid>

                    <MonthlySetActions>
                      <MonthlySetAction
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          clearMonthlySet(index);
                        }}
                        disabled={set.played || !lettersForSet.some(Boolean) || submitting}
                      >
                        Clear
                      </MonthlySetAction>
                      <MonthlySetAction
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          submitMonthlySet(index);
                        }}
                        disabled={
                          set.played ||
                          !set.unlocked ||
                          lettersForSet.filter(Boolean).length !== MONTHLY_SET_SIZE ||
                          submitting
                        }
                      >
                        {set.played
                          ? "Submitted"
                          : submitting && activeMonthlySet === index
                          ? "Submitting..."
                          : "Submit"}
                      </MonthlySetAction>
                    </MonthlySetActions>
                  </MonthlySetCard>
                );
              })}
            </MonthlyBoard>

            <ChooseText $promo style={{ marginTop: 10 }}>
              Tap a set to work on it, then choose 3 letters from A-Z below.
            </ChooseText>
            <Grid>
              {letters.map((letter) => {
                const selected = (activeMonthlySetData?.letters || []).includes(letter);
                return (
                  <LetterBox key={letter} $selected={selected} onClick={() => pickMonthlyLetter(letter)}>
                    {letter}
                  </LetterBox>
                );
              })}
            </Grid>

            <PromoActions>
              <PromoTicketRow>
                <Ticket size={18} color="#f7c59f" />
                <span>{tickets} Purchases Available</span>
              </PromoTicketRow>
              <PromoSelectedRow>
                <span>
                  Active Set {activeMonthlySetData?.setIndex || 1}:{" "}
                  {activeMonthlySetData?.letters?.some(Boolean) ? activeMonthlySetData.letters.join(" ") : "-"}
                </span>
                <PromoClear
                  type="button"
                  onClick={() => clearMonthlySet(activeMonthlySet)}
                  disabled={
                    !activeMonthlySetData ||
                    activeMonthlySetData.played ||
                    !(activeMonthlySetData?.letters || []).some(Boolean) ||
                    submitting
                  }
                >
                  Clear
                </PromoClear>
              </PromoSelectedRow>
              <PromoSubmit
                onClick={() => submitMonthlySet(activeMonthlySet)}
                disabled={
                  submitting ||
                  !activeMonthlySetData ||
                  activeMonthlySetData.played ||
                  !activeMonthlySetData.unlocked ||
                  (activeMonthlySetData?.letters || []).filter(Boolean).length !== MONTHLY_SET_SIZE
                }
              >
                {submitting ? "Submitting..." : "Submit Set"}
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
            <ModalMessage>Your set was submitted. Monthly results are released at month end.</ModalMessage>
            <ModalButton onClick={() => setSuccessModal(false)}>OK</ModalButton>
          </ModalCard>
        </Overlay>
      )}

      {noTicketModal && (
        <Overlay>
          <ModalCard>
            <TriangleAlert size={62} color="#ff3b30" />
            <ModalTitle>Set Locked</ModalTitle>
            <ModalMessage>You need the next data purchase to unlock this set.</ModalMessage>
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

const ResultTitle = styled.p`
  margin: 0 0 10px;
  text-align: center;
  color: rgba(255, 255, 255, 0.78);
  font-size: 13px;
  font-weight: 700;
`;

const ResultGrid = styled.div`
  width: min(250px, 100%);
  margin: 0 auto 14px;
  display: grid;
  grid-template-columns: repeat(3, minmax(44px, 1fr));
  gap: 10px;
`;

const ResultBox = styled.div`
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: #111;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
`;

const MonthlyResultList = styled.div`
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
`;

const MonthlyResultCard = styled.div`
  border-radius: 18px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
`;

const MonthlyResultHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
`;

const MonthlyResultBadge = styled.span`
  padding: 5px 10px;
  border-radius: 999px;
  background: ${({ $ready }) => ($ready ? "rgba(51, 214, 159, 0.16)" : "rgba(255, 255, 255, 0.12)")};
  color: ${({ $ready }) => ($ready ? "#8ef0c8" : "rgba(255, 255, 255, 0.72)")};
  font-size: 11px;
  font-weight: 700;
`;

const MonthlyResultGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
`;

const MonthlyBoard = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 14px;
`;

const MonthlySetCard = styled.button`
  width: 100%;
  text-align: left;
  border: 1px solid
    ${({ $selected, $locked, $played }) =>
      $played ? "rgba(88, 196, 136, 0.45)" : $selected ? "#ffb15b" : $locked ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.16)"};
  background: ${({ $played, $locked }) =>
    $played ? "rgba(54, 163, 103, 0.12)" : $locked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"};
  border-radius: 18px;
  padding: 14px;
  color: #fff;
  cursor: pointer;
  opacity: ${({ $locked }) => ($locked ? 0.72 : 1)};
  box-shadow: ${({ $selected }) => ($selected ? "0 0 0 2px rgba(255, 177, 91, 0.18)" : "none")};
`;

const MonthlySetHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
`;

const MonthlySetTitle = styled.div`
  font-size: 15px;
  font-weight: 800;
`;

const MonthlySetMeta = styled.div`
  margin-top: 2px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
`;

const MonthlySetBadge = styled.span`
  padding: 5px 10px;
  border-radius: 999px;
  background: ${({ $played, $locked }) =>
    $played ? "rgba(88, 196, 136, 0.18)" : $locked ? "rgba(255,255,255,0.12)" : "rgba(255, 177, 91, 0.18)"};
  color: ${({ $played, $locked }) => ($played ? "#aef0c8" : $locked ? "rgba(255,255,255,0.72)" : "#ffd19d")};
  font-size: 11px;
  font-weight: 700;
`;

const MonthlySetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
`;

const MonthlySetBox = styled.button`
  height: 52px;
  border-radius: 14px;
  border: 1px solid
    ${({ $locked, $active, $filled }) =>
      $locked ? "rgba(255,255,255,0.14)" : $active ? "#ffb15b" : $filled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.18)"};
  background: ${({ $locked, $filled }) =>
    $locked ? "rgba(255,255,255,0.04)" : $filled ? "rgba(255, 177, 91, 0.12)" : "rgba(255,255,255,0.08)"};
  color: ${({ $locked }) => ($locked ? "rgba(255,255,255,0.45)" : "#fff")};
  font-size: 18px;
  font-weight: 900;
  cursor: ${({ $locked }) => ($locked ? "not-allowed" : "pointer")};
`;

const MonthlySetActions = styled.div`
  margin-top: 12px;
  display: flex;
  gap: 10px;
`;

const MonthlySetAction = styled.button`
  flex: 1;
  border: none;
  border-radius: 999px;
  padding: 10px 12px;
  background: ${({ disabled }) => (disabled ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #ffb15b, #ff7a00)")};
  color: ${({ disabled }) => (disabled ? "rgba(255,255,255,0.5)" : "#111")};
  font-weight: 800;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

const PromoHint = styled.p`
  margin: 0 0 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
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

const PromoSelectedRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PromoClear = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.55 : 1)};
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

