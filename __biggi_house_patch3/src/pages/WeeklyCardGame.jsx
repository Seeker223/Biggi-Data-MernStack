import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import Container from "../components/Container";
import { getAuthToken } from "../utils/auth";
import {
  getBiggiHouseWeeklyCard,
  getBiggiHouseWeeklyCardAccess,
  getBiggiHouseWeeklyCardHistory,
  playBiggiHouseWeeklyCardGame,
} from "../services/api";

const Wrapper = styled(Container)`
  padding: 40px 0 60px;
  max-width: 820px;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin: 0;
`;

const Sub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const PromoCard = styled(Card)`
  background: linear-gradient(135deg, #0b2f6f 0%, #1d4ed8 45%, #0284c7 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
`;

const PromoBrand = styled.div`
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.08em;
  font-size: 12px;
`;

const PromoTitle = styled.div`
  font-weight: 1000;
  font-size: 20px;
  margin-top: 6px;
  color: #fff;
`;

const PromoSubtitle = styled.div`
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 700;
`;

const Requirement = styled.div`
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 800;
  font-size: 13px;
`;

const LetterGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
`;

const Letter = styled.button`
  border-radius: 14px;
  height: 46px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: ${({ $active }) =>
    $active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)"};
  color: ${({ $active }) => ($active ? "#0b2f6f" : "#fff")};
  font-weight: 1000;
  font-size: 14px;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.55 : 1)};
`;

const Picks = styled.div`
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const PickPill = styled.div`
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-weight: 900;
`;

const Actions = styled.div`
  margin-top: 16px;
  display: grid;
  gap: 10px;
`;

const Primary = styled.button`
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: none;
  background: #fff;
  color: #0b2f6f;
  font-weight: 1000;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

const Ghost = styled.button`
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: transparent;
  color: #fff;
  font-weight: 1000;
`;

const Notice = styled.div`
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "error" ? "rgba(220,38,38,.25)" : "rgba(16,185,129,.25)"};
  background: ${({ $tone }) =>
    $tone === "error" ? "rgba(220,38,38,.12)" : "rgba(16,185,129,.14)"};
  color: ${({ $tone }) => ($tone === "error" ? "#fee2e2" : "#bbf7d0")};
  font-weight: 900;
`;

const ResultRow = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const ResultBox = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  font-weight: 1000;
`;

const History = styled.div`
  margin-top: 18px;
  display: grid;
  gap: 10px;
`;

const HistoryItem = styled.div`
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  display: grid;
  gap: 8px;
`;

const HistoryTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const HistoryLabel = styled.div`
  font-weight: 1000;
`;

const Badge = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-weight: 900;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.03);
`;

const BadgeTone = styled(Badge)`
  border-color: ${({ $tone }) =>
    $tone === "green"
      ? "rgba(16,185,129,.35)"
      : $tone === "red"
      ? "rgba(239,68,68,.35)"
      : "rgba(15,23,42,.12)"};
  background: ${({ $tone }) =>
    $tone === "green"
      ? "rgba(16,185,129,.10)"
      : $tone === "red"
      ? "rgba(239,68,68,.10)"
      : "rgba(15,23,42,.03)"};
  color: ${({ $tone }) =>
    $tone === "green" ? "#065f46" : $tone === "red" ? "#991b1b" : "#111827"};
`;

const Small = styled.div`
  color: #5b6475;
  font-size: 13px;
`;

export default function WeeklyCardGame() {
  const [access, setAccess] = useState(null);
  const [card, setCard] = useState(null);
  const [picks, setPicks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [history, setHistory] = useState([]);

  const letters = useMemo(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), []);
  const token = useMemo(() => getAuthToken(), []);

  const load = async () => {
    if (!token) return;
    const [a, c, h] = await Promise.all([
      getBiggiHouseWeeklyCardAccess(token).catch(() => null),
      getBiggiHouseWeeklyCard(token).catch(() => null),
      getBiggiHouseWeeklyCardHistory(token).catch(() => ({ plays: [] })),
    ]);
    if (a) setAccess(a);
    if (c) setCard(c);
    setHistory(Array.isArray(h?.plays) ? h.plays : []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enabled = Boolean(access?.enabled);
  const revealReady = Boolean(card?.revealReady);
  const resultLetters = Array.isArray(card?.letters) ? card.letters : [];
  const currentWeekKey = card?.weekKey || null;
  const playedThisWeek = Boolean(
    currentWeekKey && history.some((p) => String(p.weekKey) === String(currentWeekKey))
  );
  const canSubmit = enabled && picks.length === 5 && !playedThisWeek;

  const togglePick = (letter) => {
    setNotice(null);
    setPicks((prev) => {
      if (prev.includes(letter)) return prev.filter((x) => x !== letter);
      if (prev.length >= 5) return prev;
      return [...prev, letter];
    });
  };

  const clear = () => {
    setNotice(null);
    setPicks([]);
  };

  const play = async () => {
    if (!token) return;
    if (!canSubmit) return;
    setBusy(true);
    setNotice(null);
    try {
      await playBiggiHouseWeeklyCardGame({ letters: picks }, token);
      setNotice({ tone: "success", text: "Entry submitted for this week." });
      clear();
      await load();
    } catch (e) {
      if (e?.code === "ALREADY_PLAYED_THIS_WEEK") {
        setNotice({
          tone: "error",
          text: "You have already played this week. Check history for your entry.",
        });
      } else {
        setNotice({ tone: "error", text: e?.message || "Unable to submit." });
      }
    } finally {
      setBusy(false);
    }
  };

  const winCount = useMemo(
    () =>
      history.filter((p) => p?.status === "won" || p?.won === true).length,
    [history]
  );

  return (
    <Wrapper>
      <Header>
        <Title>Weekly Card Game</Title>
        <Sub>Pick exactly 5 letters. Results come out every Sunday.</Sub>
      </Header>

      <PromoCard>
        <PromoBrand>BIGGI HOUSE</PromoBrand>
        <PromoTitle>WEEKLY PREDICTION</PromoTitle>
        <PromoSubtitle>Select maximum of 5 letters from A - Z</PromoSubtitle>
        <Requirement>
          Requires at least 1 data purchase this week to play weekly prediction to free data bundle. You can play only once per week.
        </Requirement>

        {!enabled ? (
          <Notice $tone="error">Game is disabled for your account right now.</Notice>
        ) : null}

        {playedThisWeek ? (
          <Notice $tone="error">
            You have already played this week. Come back next week for another round.
          </Notice>
        ) : null}

        <LetterGrid aria-label="Letter picker">
          {letters.map((l) => (
            <Letter
              key={l}
              type="button"
              disabled={!enabled || busy}
              $active={picks.includes(l)}
              onClick={() => togglePick(l)}
              aria-label={`Pick ${l}`}
              title={picks.includes(l) ? "Remove" : "Pick"}
            >
              {l}
            </Letter>
          ))}
        </LetterGrid>

        <Picks aria-label="Selected picks">
          {picks.length ? (
            picks.map((l) => <PickPill key={`pick-${l}`}>{l}</PickPill>)
          ) : (
            <Sub style={{ color: "rgba(255,255,255,.82)" }}>
              No picks yet. Select 5 letters.
            </Sub>
          )}
        </Picks>

        <Actions>
          <Primary type="button" disabled={!canSubmit || busy} onClick={play}>
            {busy ? "Submitting..." : "Submit Entry"}
          </Primary>
          <Ghost type="button" onClick={clear} disabled={busy || picks.length === 0}>
            Clear picks
          </Ghost>
        </Actions>

        {notice ? <Notice $tone={notice.tone}>{notice.text}</Notice> : null}

        <div style={{ marginTop: 18, fontWeight: 1000 }}>
          Weekly result (9 letters)
        </div>
        <Small style={{ color: "rgba(255,255,255,.82)" }}>
          {revealReady
            ? "Revealed. Check your history for win status."
            : card?.revealAt
            ? `Reveals on ${new Date(card.revealAt).toLocaleString()}`
            : "Reveals on Sunday."}
        </Small>
        <ResultRow aria-label="Weekly result letters">
          {(revealReady ? resultLetters : Array.from({ length: 9 }).map(() => "?"))
            .slice(0, 9)
            .map((l, idx) => (
              <ResultBox key={`r-${idx}`}>{String(l || "?").toUpperCase()}</ResultBox>
            ))}
        </ResultRow>
      </PromoCard>

      <History>
        <Title style={{ fontSize: 18 }}>My Weekly Plays</Title>
        {history.length ? (
          <Small style={{ marginTop: -4 }}>
            Total wins: <strong style={{ color: "#111827" }}>{winCount}</strong>
          </Small>
        ) : null}
        {history.length ? (
          history.slice(0, 10).map((p) => (
            <HistoryItem key={p.id}>
              <HistoryTop>
                <HistoryLabel>{p.weekKey || "Weekly Play"}</HistoryLabel>
                {p.status === "won" || p.won === true ? (
                  <BadgeTone $tone="green">Won</BadgeTone>
                ) : p.status === "lost" || p.won === false ? (
                  <BadgeTone $tone="red">Lost</BadgeTone>
                ) : (
                  <Badge>Pending</Badge>
                )}
              </HistoryTop>
              <Small>Picks: {(p.letters || []).join(", ")}</Small>
              {Array.isArray(p.resultLetters) && p.resultLetters.length ? (
                <Small>Result: {p.resultLetters.join(", ")}</Small>
              ) : (
                <Small>Result: Pending (Sunday reveal)</Small>
              )}
              <Small>
                {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
              </Small>
            </HistoryItem>
          ))
        ) : (
          <Sub>No plays yet.</Sub>
        )}
      </History>
    </Wrapper>
  );
}
