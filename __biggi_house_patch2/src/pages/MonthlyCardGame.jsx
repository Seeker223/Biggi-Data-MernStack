import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import Container from "../components/Container";
import { getAuthToken } from "../utils/auth";
import {
  getBiggiHouseMonthlyCardHistory,
  getBiggiHousePublicConfig,
  playBiggiHouseMonthlyCardGame,
} from "../services/api";

const Wrapper = styled(Container)`
  padding: 40px 0 60px;
  max-width: 720px;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

const Letter = styled.button`
  border-radius: 14px;
  padding: 12px 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.gradients.brand : theme.colors.surface};
  color: ${({ $active }) => ($active ? "#fff" : "#111827")};
  font-weight: 900;
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
  background: ${({ theme }) => theme.colors.soft};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: 800;
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
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 900;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

const Ghost = styled.button`
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 900;
`;

const Notice = styled.div`
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid ${({ $tone }) => ($tone === "error" ? "rgba(220,38,38,.25)" : "rgba(16,185,129,.25)")};
  background: ${({ $tone }) => ($tone === "error" ? "rgba(220,38,38,.06)" : "rgba(16,185,129,.08)")};
  color: ${({ $tone }) => ($tone === "error" ? "#991b1b" : "#065f46")};
  font-weight: 700;
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

export default function MonthlyCardGame() {
  const [config, setConfig] = useState(null);
  const [picks, setPicks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [history, setHistory] = useState([]);

  const letters = useMemo(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), []);
  const token = useMemo(() => getAuthToken(), []);

  const load = async () => {
    const [cfg, hist] = await Promise.all([
      getBiggiHousePublicConfig().catch(() => null),
      token ? getBiggiHouseMonthlyCardHistory(token).catch(() => ({ plays: [] })) : { plays: [] },
    ]);
    if (cfg) setConfig(cfg);
    setHistory(Array.isArray(hist?.plays) ? hist.plays : []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enabled = Boolean(config?.features?.monthlyCardGameEnabled);
  const canSubmit = enabled && picks.length === 5;

  const togglePick = (letter) => {
    setNotice(null);
    setPicks((prev) => {
      const next = prev.includes(letter) ? prev.filter((x) => x !== letter) : [...prev, letter];
      return next.slice(0, 5);
    });
  };

  const play = async () => {
    if (!token) return;
    setBusy(true);
    setNotice(null);
    try {
      await playBiggiHouseMonthlyCardGame({ letters: picks }, token);
      setNotice({ tone: "success", text: "Entry submitted successfully." });
      setPicks([]);
      const hist = await getBiggiHouseMonthlyCardHistory(token);
      setHistory(Array.isArray(hist?.plays) ? hist.plays : []);
    } catch (e) {
      setNotice({ tone: "error", text: e?.message || "Unable to submit." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrapper>
      <Header>
        <Title>Monthly Card Game</Title>
        <Sub>
          No tickets required. Admin controls when this game is available.
        </Sub>
      </Header>

      <Card>
        <Sub>
          Pick exactly 5 letters. Your entry is saved to your account when you submit.
        </Sub>

        {!enabled ? (
          <Notice $tone="error">
            Game is currently disabled. Check back later.
          </Notice>
        ) : null}

        <Grid aria-label="Letter picker">
          {letters.map((l) => (
            <Letter
              key={l}
              type="button"
              $active={picks.includes(l)}
              onClick={() => togglePick(l)}
              disabled={!enabled}
              aria-label={`Pick ${l}`}
            >
              {l}
            </Letter>
          ))}
        </Grid>

        <Picks aria-label="Selected picks">
          {picks.length ? (
            picks.map((l) => <PickPill key={`pick-${l}`}>{l}</PickPill>)
          ) : (
            <Sub>No picks yet.</Sub>
          )}
        </Picks>

        <Actions>
          <Primary type="button" disabled={!canSubmit || busy} onClick={play}>
            {busy ? "Submitting..." : "Submit Entry"}
          </Primary>
          <Ghost
            type="button"
            onClick={() => setPicks([])}
            disabled={busy || picks.length === 0}
          >
            Clear picks
          </Ghost>
        </Actions>

        {notice ? <Notice $tone={notice.tone}>{notice.text}</Notice> : null}
      </Card>

      <History>
        <Title style={{ fontSize: 18 }}>My Entries</Title>
        {history.length ? (
          history.slice(0, 10).map((p) => (
            <HistoryItem key={p.id}>
              <span>{(p.letters || []).join(", ")}</span>
              <span>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}</span>
            </HistoryItem>
          ))
        ) : (
          <Sub>No entries yet.</Sub>
        )}
      </History>
    </Wrapper>
  );
}

