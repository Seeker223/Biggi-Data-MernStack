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
const MONTHLY_CARD_SET_COUNT = 5;
const MONTHLY_CARD_SET_LENGTH = 3;

const DailyNumberDrawScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [resultLetters, setResultLetters] = useState([]);
  const [resultRevealReady, setResultRevealReady] = useState(false);
  const [resultRevealAt, setResultRevealAt] = useState("");
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState("");
  const [monthlyPurchases, setMonthlyPurchases] = useState(0);
  const [monthlyRequired, setMonthlyRequired] = useState(25);
  const [monthlyEntries, setMonthlyEntries] = useState([]);
  const [monthlyDrafts, setMonthlyDrafts] = useState(() =>
    Array.from({ length: MONTHLY_CARD_SET_COUNT }, () => [])
  );
  const [activeMonthlySet, setActiveMonthlySet] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [noTicketModal, setNoTicketModal] = useState(false);
  const [toast, setToast] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const toastTimeoutRef = useRef(null);
  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const tickets = Number(user?.tickets || 0);
  const historyCount = Array.isArray(user?.dailyNumberDraw) ? user.dailyNumberDraw.length : 0;
  const letters = useMemo(() => DRAW_LETTERS.slice(0, 26), []);
  const isMerchantRole = isBiggiHouseMember(user);
  const isPrivateRole = !isMerchantRole;
  const isMonthlyCardRole = isMerchantRole || isPrivateRole;
  const monthlyUnlockedCount = Math.min(MONTHLY_CARD_SET_COUNT, Number(monthlyPurchases || 0));
  const activeMonthlyEntry = monthlyEntries.find((entry) => Number(entry?.setIndex) === Number(activeMonthlySet)) || null;
  const activeMonthlyDraft = monthlyDrafts[activeMonthlySet - 1] || [];
  const activeMonthlyCode = activeMonthlyDraft.join("");
  const monthlyCompletedCount = monthlyEntries.filter((entry) => Boolean(entry?.played)).length;

  const showToast = (message) => {
    setToast(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(""), 1800);
  };

  const updateMonthlyDraft = (setIndex, updater) => {
    setMonthlyDrafts((prev) =>
      prev.map((entry, index) => {
        if (index !== setIndex - 1) return entry;
        return typeof updater === "function" ? updater(entry) : updater;
      })
    );
  };

  const handleMonthlySetFocus = (setIndex) => {
    const entry = monthlyEntries.find((item) => Number(item?.setIndex) === Number(setIndex));
    if (entry?.locked) {
      showToast(`Entry ${setIndex} unlocks after ${setIndex} data purchase${setIndex === 1 ? "" : "s"}.`);
      return;
    }
    setActiveMonthlySet(setIndex);
  };

  const handleMonthlyLetterToggle = (letter) => {
    const entry = monthlyEntries.find((item) => Number(item?.setIndex) === Number(activeMonthlySet));
    if (entry?.locked) {
      showToast(`Entry ${activeMonthlySet} is locked until you complete ${activeMonthlySet} data purchase${activeMonthlySet === 1 ? "" : "s"}.`);
      return;
    }
    if (entry?.played) {
      showToast(`Entry ${activeMonthlySet} has already been submitted.`);
      return;
    }

    updateMonthlyDraft(activeMonthlySet, (current) => {
      if (current.includes(letter)) return current.filter((item) => item !== letter);
      if (current.length >= MONTHLY_CARD_SET_LENGTH) {
        showToast(`Select exactly ${MONTHLY_CARD_SET_LENGTH} letters for this entry.`);
        return current;
      }
      return [...current, letter];
    });
  };

  const clearMonthlyDraft = (setIndex = activeMonthlySet) => {
    updateMonthlyDraft(setIndex, []);
  };

  const submitMonthlyEntry = async (setIndex = activeMonthlySet) => {
    const entry = monthlyEntries.find((item) => Number(item?.setIndex) === Number(setIndex));
    if (entry?.locked) {
      showToast(`Entry ${setIndex} is locked until you complete ${setIndex} data purchase${setIndex === 1 ? "" : "s"}.`);
      return;
    }
    if (entry?.played) {
      showToast(`Entry ${setIndex} has already been submitted.`);
      return;
    }

    const code = (monthlyDrafts[setIndex - 1] || []).join("");
    if (code.length !== MONTHLY_CARD_SET_LENGTH) {
      showToast(`Select exactly ${MONTHLY_CARD_SET_LENGTH} letters for this entry.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/monthly-game/play", {
        month: currentMonthKey,
        code,
        ticketId: setIndex,
      });

      if (res?.data?.success) {
        await refreshUser?.();
        await reloadMonthlyGame();
        clearMonthlyDraft(setIndex);
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

  const fallbackResultLetters = useMemo(() => ["A", "C", "E", "G", "I", "K", "M", "O", "Q"], []);
  const displayResultLetters = resultLetters.length ? resultLetters : fallbackResultLetters;
  const monthlyTowardNext = monthlyRequired > 0 ? monthlyPurchases % monthlyRequired : 0;
  const monthlyToNextTicket =
    monthlyRequired > 0 ? (monthlyTowardNext === 0 ? monthlyRequired : monthlyRequired - monthlyTowardNext) : 0;

  const reloadMonthlyGame = async () => {
    if (!isMonthlyCardRole) return;

    setResultLoading(true);
    setResultError("");

    const [eligibilityRes, ticketsRes, winnersRes] = await Promise.allSettled([
      api.get("/monthly-game/eligibility"),
      api.get("/monthly-game/tickets"),
      api.get("/monthly-game/winners"),
    ]);

    const eligibility = eligibilityRes?.status === "fulfilled" ? eligibilityRes.value?.data?.eligibility || {} : {};
    const ticketsData = ticketsRes?.status === "fulfilled" ? ticketsRes.value?.data?.tickets || [] : [];
    const winnersData = winnersRes?.status === "fulfilled" ? winnersRes.value?.data || {} : {};
    const draw = winnersData?.draw || null;
    const winningSets = Array.isArray(draw?.winningSets) ? draw.winningSets : [];

    setMonthlyPurchases(Number(eligibility.purchases || 0));
    setMonthlyRequired(Number(eligibility.required || MONTHLY_CARD_SET_COUNT));
    setMonthlyEntries(Array.isArray(ticketsData) && ticketsData.length ? ticketsData : Array.isArray(eligibility.cardSets) ? eligibility.cardSets : []);
    setResultLetters(winningSets.flat().map((letter) => String(letter || "").toUpperCase()).slice(0, MONTHLY_CARD_SET_COUNT * MONTHLY_CARD_SET_LENGTH));
    setResultRevealReady(Boolean(winningSets.length === MONTHLY_CARD_SET_COUNT));
    setResultRevealAt(draw?.drawnAt || draw?.drawAt || "");

    const nextOpen =
      (Array.isArray(ticketsData) ? ticketsData.find((entry) => !entry?.locked && !entry?.played) : null) ||
      (Array.isArray(ticketsData) ? ticketsData.find((entry) => !entry?.locked) : null) ||
      (Array.isArray(eligibility.cardSets) ? eligibility.cardSets.find((entry) => !entry?.locked && !entry?.played) : null) ||
      1;
    setActiveMonthlySet(Number(nextOpen?.setIndex || nextOpen || 1));
    setResultLoading(false);
  };

  useEffect(() => {
    if (!isMonthlyCardRole) return;
    let mounted = true;
    setResultLoading(true);
    setResultError("");

    reloadMonthlyGame().catch((err) => {
      if (!mounted) return;
      setResultError(err?.response?.data?.message || "Unable to load monthly card");
      setResultLoading(false);
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
              Complete 5 entries of 3 letters. Each data purchase unlocks one entry. Results are released at month end.
            </PromoSubtitle>
            <PromoSubtitle>
              Entries unlocked: {monthlyUnlockedCount}/{MONTHLY_CARD_SET_COUNT}. Completed: {monthlyCompletedCount}/
              {MONTHLY_CARD_SET_COUNT}.
            </PromoSubtitle>

            {resultLoading ? (
              <PromoHint>Loading monthly entries...</PromoHint>
            ) : resultError ? (
              <PromoHint role="button" onClick={() => setResultError("")}>
                {resultError}
              </PromoHint>
            ) : (
              <PromoHint>
                {resultRevealReady
                  ? "Monthly results are out."
                  : resultRevealAt
                    ? `Reveals on ${new Date(resultRevealAt).toLocaleDateString()}`
                    : "Reveals at month end"}
              </PromoHint>
            )}

            <MonthlyInfoRow>
              <span>Tap an unlocked entry below, then choose 3 letters.</span>
              <span>
                Active Entry {activeMonthlySet}
                {activeMonthlyEntry?.played ? " · Submitted" : activeMonthlyEntry?.locked ? " · Locked" : ""}
              </span>
            </MonthlyInfoRow>

            <MonthlySetDeck>
              {(monthlyEntries.length ? monthlyEntries : Array.from({ length: MONTHLY_CARD_SET_COUNT }, (_, idx) => ({
                setIndex: idx + 1,
                locked: idx + 1 > monthlyUnlockedCount,
                played: false,
                code: "",
              }))).map((entry, index) => {
                const setIndex = Number(entry?.setIndex || index + 1);
                const played = Boolean(entry?.played);
                const locked = Boolean(entry?.locked);
                const draft = monthlyDrafts[setIndex - 1] || [];
                const entryCode = String(entry?.code || "").toUpperCase().split("").slice(0, MONTHLY_CARD_SET_LENGTH);
                const boxes = played ? entryCode : setIndex === activeMonthlySet ? draft : [];

                return (
                  <MonthlySetCard
                    key={`entry-card-${setIndex}`}
                    $active={setIndex === activeMonthlySet}
                    onClick={() => handleMonthlySetFocus(setIndex)}
                  >
                    <MonthlySetHeader>
                      <MonthlySetTitle>
                        <MonthlySetName>Entry {setIndex}</MonthlySetName>
                        <MonthlySetSubtext>
                          {played
                            ? "Submitted for this month."
                            : locked
                            ? `Unlocks after ${setIndex} data purchase${setIndex === 1 ? "" : "s"}.`
                            : setIndex === activeMonthlySet
                            ? "Tap letters below to fill this entry."
                            : "Ready to play."}
                        </MonthlySetSubtext>
                      </MonthlySetTitle>
                      <MonthlySetStatus $done={played} $locked={locked}>
                        {played ? "Submitted" : locked ? "Locked" : setIndex === activeMonthlySet ? "Active" : "Ready"}
                      </MonthlySetStatus>
                    </MonthlySetHeader>

                    <MonthlySetBoxes>
                      {Array.from({ length: MONTHLY_CARD_SET_LENGTH }, (_, boxIndex) => (
                        <MonthlySetBox
                          key={`${setIndex}-${boxIndex}-box`}
                          $active={setIndex === activeMonthlySet}
                          $filled={Boolean(boxes[boxIndex])}
                        >
                          {boxes[boxIndex] || "?"}
                        </MonthlySetBox>
                      ))}
                    </MonthlySetBoxes>

                    <MonthlySetActions>
                      <MonthlyActionButton
                        type="button"
                        disabled={submitting || locked || played}
                        onClick={(event) => {
                          event.stopPropagation();
                          clearMonthlyDraft(setIndex);
                        }}
                      >
                        Clear
                      </MonthlyActionButton>
                      <MonthlyActionButton
                        type="button"
                        $primary
                        disabled={submitting || locked || played || (monthlyDrafts[setIndex - 1] || []).length !== MONTHLY_CARD_SET_LENGTH}
                        onClick={(event) => {
                          event.stopPropagation();
                          submitMonthlyEntry(setIndex);
                        }}
                      >
                        {submitting && setIndex === activeMonthlySet ? "Submitting..." : "Submit"}
                      </MonthlyActionButton>
                    </MonthlySetActions>
                  </MonthlySetCard>
                );
              })}
            </MonthlySetDeck>

            <ChooseText $promo>Choose 3 letters for Entry {activeMonthlySet}</ChooseText>
            <Grid>
              {letters.map((letter) => {
                const selected = activeMonthlyDraft.includes(letter);
                return (
                  <LetterBox
                    key={letter}
                    $selected={selected}
                    onClick={() => handleMonthlyLetterToggle(letter)}
                  >
                    {letter}
                  </LetterBox>
                );
              })}
            </Grid>

            <PromoActions>
              <PromoSelectedRow>
                <span>
                  Selected ({activeMonthlyDraft.length}/{MONTHLY_CARD_SET_LENGTH}):{" "}
                  {activeMonthlyDraft.length ? activeMonthlyDraft.join(" ") : "-"}
                </span>
                <PromoClear type="button" onClick={() => clearMonthlyDraft()} disabled={!activeMonthlyDraft.length || submitting}>
                  Clear
                </PromoClear>
              </PromoSelectedRow>
              <PromoSubmit onClick={() => submitMonthlyEntry()} disabled={submitting || activeMonthlyDraft.length !== MONTHLY_CARD_SET_LENGTH}>
                {submitting ? "Submitting..." : "Submit Entry"}
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
            <ModalMessage>Your entry was submitted. Monthly results are released at month end.</ModalMessage>
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
  padding: 18px 14px 34px;
  background: linear-gradient(180deg, #000 0%, #020202 100%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const PromoCard = styled.div`
  width: min(680px, 100%);
  border-radius: 28px;
  padding: 22px 16px 20px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
  position: relative;
`;

const PromoBrand = styled.p`
  margin: 0;
  text-align: center;
  color: #ff8c00;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: 800;
`;

const PromoTitle = styled.h2`
  margin: 8px 0 6px;
  text-align: center;
  color: #ff8c00;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 1px;
`;

const PromoSubtitle = styled.p`
  margin: 0 0 10px;
  text-align: center;
  color: #111;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 500;
`;

const ResultTitle = styled.p`
  margin: 12px 0 8px;
  text-align: center;
  color: #111;
  font-size: 14px;
  font-weight: 800;
`;

const ResultGrid = styled.div`
  width: min(320px, 100%);
  margin: 0 auto 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(44px, 1fr));
  gap: 8px;
`;

const ResultBox = styled.div`
  height: 42px;
  border-radius: 12px;
  background: #f7f7f7;
  color: #111;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 900;
  border: 1px solid rgba(0, 0, 0, 0.08);
`;

const MonthlyResultDeck = styled.div`
  width: min(620px, 100%);
  margin: 0 auto 16px;
  display: grid;
  gap: 10px;
`;

const MonthlyResultCard = styled.div`
  border-radius: 18px;
  padding: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.05);
`;

const MonthlyResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const MonthlyResultTitle = styled.span`
  font-size: 13px;
  font-weight: 800;
  color: #111;
`;

const MonthlyResultBadge = styled.span`
  border-radius: 999px;
  padding: 4px 8px;
  background: ${(p) => (p.$done ? "rgba(76, 217, 100, 0.14)" : p.$locked ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 140, 0, 0.14)")};
  color: ${(p) => (p.$done ? "#208f3d" : p.$locked ? "#666" : "#b85d00")};
  font-size: 11px;
  font-weight: 800;
`;

const MonthlyResultBoxes = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;

const MonthlyResultBox = styled.div`
  min-height: 38px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: grid;
  place-items: center;
  color: #111;
  font-size: 16px;
  font-weight: 900;
`;

const MonthlySetDeck = styled.div`
  width: min(520px, 100%);
  margin: 12px auto 8px;
  display: grid;
  gap: 8px;
`;

const MonthlySetCard = styled.div`
  border-radius: 14px;
  padding: 10px;
  border: 1px solid ${(p) => (p.$active ? "#ff8c00" : "rgba(0, 0, 0, 0.08)")};
  background: ${(p) => (p.$active ? "linear-gradient(180deg, #fff8ef 0%, #ffffff 100%)" : "#ffffff")};
  box-shadow: ${(p) => (p.$active ? "0 10px 18px rgba(255, 140, 0, 0.10)" : "0 8px 16px rgba(0, 0, 0, 0.05)")};
  cursor: pointer;
`;

const MonthlySetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
`;

const MonthlySetTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: #111;
`;

const MonthlySetName = styled.span`
  font-size: 12px;
  font-weight: 900;
`;

const MonthlySetSubtext = styled.span`
  font-size: 10px;
  color: #666;
  line-height: 1.35;
`;

const MonthlySetStatus = styled.span`
  border-radius: 999px;
  padding: 4px 8px;
  background: ${(p) => (p.$done ? "rgba(76, 217, 100, 0.14)" : p.$locked ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 140, 0, 0.14)")};
  color: ${(p) => (p.$done ? "#208f3d" : p.$locked ? "#666" : "#b85d00")};
  font-size: 11px;
  font-weight: 800;
`;

const MonthlySetBoxes = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`;

const MonthlySetBox = styled.div`
  min-height: 34px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$active ? "#ff8c00" : "rgba(0, 0, 0, 0.08)")};
  background: ${(p) => (p.$filled ? "#fff" : "#fafafa")};
  display: grid;
  place-items: center;
  color: #111;
  font-size: 14px;
  font-weight: 900;
`;

const MonthlySetActions = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
`;

const MonthlyActionButton = styled.button`
  flex: 1;
  border: 1px solid ${(p) => (p.$primary ? "transparent" : "rgba(0, 0, 0, 0.12)")};
  background: ${(p) => (p.$primary ? "#ff8c00" : "#fff")};
  color: #111;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
`;

const MonthlyInfoRow = styled.div`
  width: min(620px, 100%);
  margin: 0 auto 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: #111;
  font-size: 12px;
  font-weight: 700;
`;

const PromoHint = styled.p`
  margin: 0 0 10px;
  text-align: center;
  color: #444;
  font-size: 12px;
  line-height: 1.45;
`;

const PromoActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
`;

const PromoTicketRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #111;
  font-size: 12px;
  font-weight: 700;
`;

const PromoSelectedRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #111;
  font-size: 12px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const PromoClear = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  color: #111;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
`;

const PromoSubmit = styled.button`
  border: none;
  border-radius: 999px;
  padding: 10px 28px;
  width: min(300px, 100%);
  background: ${(p) => (p.disabled ? "#a1a1a1" : "#ff8c00")};
  color: #111;
  font-weight: 800;
  font-size: 14px;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  box-shadow: ${(p) => (p.disabled ? "none" : "0 10px 24px rgba(255, 140, 0, 0.28)")};
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
  grid-template-columns: repeat(auto-fill, minmax(34px, 1fr));
  gap: 5px;
`;

const LetterBox = styled.button`
  height: 34px;
  border-radius: 8px;
  border: 1px solid ${(p) => (p.$selected ? "#ff8c00" : "#ccc")};
  background: ${(p) => (p.$selected ? "#ff8c00" : "#fff")};
  color: ${(p) => (p.$selected ? "#fff" : "#111")};
  font-size: 12px;
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

