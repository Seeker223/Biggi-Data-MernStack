import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";
import Container from "../components/Container";
import { getAuthToken } from "../utils/auth";
import {
  getBiggiHouseWeeklyCard,
  getBiggiHouseWeeklyCardAccess,
  getBiggiHouseWeeklyCardHistory,
  getBiggiHousePublicConfig,
  playBiggiHouseWeeklyCardGame,
} from "../services/api";

const Wrapper = styled(Container)`
  padding: 40px 0 60px;
  max-width: 760px;
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

const PromoGridWrap = styled.div`
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 18px;
  overflow-x: auto;
  padding: 2px 2px 10px;
  -webkit-overflow-scrolling: touch;
`;

const PromoGridGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 54px);
  gap: 10px;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: transparent;

  ${({ $winner }) =>
    $winner
      ? `
    border-color: rgba(16,185,129,.35);
    background: rgba(16,185,129,.08);
  `
      : ""}
`;

const PromoGridBox = styled.div`
  height: 54px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  font-weight: 1000;
  font-size: 20px;
  color: ${({ $winner }) => ($winner ? "#a7f3d0" : "#fff")};
`;

const Hint = styled.div`
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 700;
  font-size: 13px;
`;

const PromoBoxes = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const PromoInput = styled.input`
  height: 58px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.12);
  text-align: center;
  font-weight: 1000;
  font-size: 22px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #fff;

  &::placeholder {
    color: rgba(255, 255, 255, 0.55);
  }
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
  font-weight: 900;
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
  font-weight: 900;
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
  font-weight: 800;
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
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: ${({ theme }) => theme.colors.muted};
`;

const normalizeLetter = (value) =>
  String(value || "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 1)
    .toUpperCase();

export default function WeeklyCardGame() {
  const [config, setConfig] = useState(null);
  const [access, setAccess] = useState(null);
  const [card, setCard] = useState(null);
  const [picks, setPicks] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [history, setHistory] = useState([]);

  const token = useMemo(() => getAuthToken(), []);
  const inputRefs = useRef([]);

  const load = async () => {
    const [cfg, weeklyCard, hist] = await Promise.all([
      getBiggiHousePublicConfig().catch(() => null),
      token ? getBiggiHouseWeeklyCard(token).catch(() => null) : null,
      token ? getBiggiHouseWeeklyCardAccess(token).catch(() => null) : null,
      token
        ? getBiggiHouseWeeklyCardHistory(token).catch(() => ({ plays: [] }))
        : { plays: [] },
    ]);
    if (cfg) setConfig(cfg);
    if (weeklyCard) setCard(weeklyCard);
    if (access) setAccess(access);
    setHistory(Array.isArray(hist?.plays) ? hist.plays : []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enabled = Boolean(access?.enabled ?? config?.features?.weeklyCardGameEnabled);
  const canSubmit = enabled && picks.every((v) => Boolean(v)) && picks.length === 3;

  const onChangePick = (index, value) => {
    setNotice(null);
    const cleaned = normalizeLetter(value);
    setPicks((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const clear = () => {
    setPicks(["", "", ""]);
    setNotice(null);
    inputRefs.current[0]?.focus?.();
  };

  const play = async () => {
    if (!token) return;
    setBusy(true);
    setNotice(null);
    try {
      await playBiggiHouseWeeklyCardGame({ letters: picks }, token);
      setNotice({ tone: "success", text: "Entry submitted successfully." });
      clear();
      const [weeklyCard, hist] = await Promise.all([
        getBiggiHouseWeeklyCard(token).catch(() => null),
        getBiggiHouseWeeklyCardHistory(token),
      ]);
      if (weeklyCard) setCard(weeklyCard);
      setHistory(Array.isArray(hist?.plays) ? hist.plays : []);
    } catch (e) {
      setNotice({ tone: "error", text: e?.message || "Unable to submit." });
    } finally {
      setBusy(false);
    }
  };

  const letters = Array.isArray(card?.letters) ? card.letters : [];
  const revealReady = Boolean(card?.revealReady);
  const winningGroupIndex =
    revealReady && Number.isInteger(card?.winningGroupIndex)
      ? Number(card.winningGroupIndex)
      : null;

  const groupLetters = (group) => letters.slice(group * 3, group * 3 + 3);

  return (
    <Wrapper>
      <Header>
        <Title>Weekly Card Game</Title>
        <Sub>
          Predict three (3) letters from A - Z. Results come out every Sunday.
        </Sub>
      </Header>

      <PromoCard>
        <PromoBrand>BIGGI HOUSE</PromoBrand>
        <PromoTitle>PROMO CARD</PromoTitle>
        <PromoSubtitle>Predict three (3) letters from A - Z</PromoSubtitle>

        <PromoGridWrap aria-label="Weekly card reveal">
          {[0, 1, 2].map((group) => {
            const winner = revealReady && winningGroupIndex === group;
            const groupValues = groupLetters(group);
            return (
              <PromoGridGroup key={`group-${group}`} $winner={winner}>
                {[0, 1, 2].map((idx) => (
                  <PromoGridBox
                    key={`box-${group}-${idx}`}
                    $winner={winner}
                    aria-hidden="true"
                  >
                    {revealReady ? String(groupValues[idx] || "").toUpperCase() : "?"}
                  </PromoGridBox>
                ))}
              </PromoGridGroup>
            );
          })}
        </PromoGridWrap>

        <Hint>
          {revealReady
            ? "Winning set revealed for this week."
            : card?.revealAt
            ? `Reveal on ${new Date(card.revealAt).toLocaleString()}`
            : "Reveal on Sunday"}
        </Hint>

        {!enabled ? (
          <Notice $tone="error">Game is currently disabled. Check back later.</Notice>
        ) : null}

        <PromoBoxes aria-label="Your prediction">
          {picks.map((value, index) => (
            <PromoInput
              key={`pick-${index}`}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={value}
              onChange={(e) => onChangePick(index, e.target.value)}
              disabled={!enabled || busy}
              inputMode="text"
              placeholder="-"
              aria-label={`Pick letter ${index + 1}`}
            />
          ))}
        </PromoBoxes>

        <Actions>
          <Primary type="button" disabled={!canSubmit || busy} onClick={play}>
            {busy ? "Submitting..." : "Submit Entry"}
          </Primary>
          <Ghost type="button" onClick={clear} disabled={busy}>
            Clear picks
          </Ghost>
        </Actions>

        {notice ? <Notice $tone={notice.tone}>{notice.text}</Notice> : null}
      </PromoCard>

      <History>
        <Title style={{ fontSize: 18 }}>My Entries</Title>
        {history.length ? (
          history.slice(0, 10).map((p) => (
            <HistoryItem key={p.id}>
              <span>{(p.letters || []).join(", ")}</span>
              <span>
                {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                {typeof p.matched === "boolean"
                  ? ` · ${p.matched ? "Matched" : "Not matched"}`
                  : ""}
              </span>
            </HistoryItem>
          ))
        ) : (
          <Sub>No entries yet.</Sub>
        )}
      </History>
    </Wrapper>
  );
}
