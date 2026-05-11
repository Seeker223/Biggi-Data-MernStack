import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRewardsGameResult, submitRewardsGame } from "../services/api";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function startOfWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // Monday as start
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function nextSunday22(date = new Date()) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const day = d.getDay();
  const daysUntilSunday = (7 - day) % 7;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(22, 0, 0, 0);
  if (d.getTime() <= date.getTime()) d.setDate(d.getDate() + 7);
  return d;
}

function computeLocalResult(weekKey) {
  let seed = 0;
  for (let i = 0; i < weekKey.length; i++) seed = (seed * 31 + weekKey.charCodeAt(i)) >>> 0;
  const pick = (n) => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed % n;
  };
  const bag = [...LETTERS];
  const out = [];
  while (out.length < 5 && bag.length) out.push(bag.splice(pick(bag.length), 1)[0]);
  return out;
}

function checkWin(gridLetters, resultLetters) {
  const rset = new Set(resultLetters);
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return lines.some((idxs) => idxs.every((i) => rset.has(gridLetters[i])));
}

export default function GameHome() {
  const nav = useNavigate();
  const { user, token, logout } = useAuth();

  const [grid, setGrid] = useState(Array(9).fill(""));
  const [activeCell, setActiveCell] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: "", ok: "" });
  const [result, setResult] = useState({ weekKey: startOfWeekKey(), revealAt: null, letters: [], source: "local" });

  const revealAt = useMemo(() => nextSunday22(new Date()), []);
  const canReveal = Date.now() >= revealAt.getTime();

  useEffect(() => {
    let live = true;
    const loadResult = async () => {
      const weekKey = startOfWeekKey();
      try {
        const data = await getRewardsGameResult({ weekKey });
        if (!live) return;
        const letters = Array.isArray(data?.result?.letters)
          ? data.result.letters
          : Array.isArray(data?.letters)
            ? data.letters
            : [];
        if (letters.length) {
          setResult({ weekKey, revealAt: data?.result?.revealAt || null, letters, source: "backend" });
          return;
        }
      } catch {
        // ignore
      }
      if (!live) return;
      setResult({ weekKey, revealAt: revealAt.toISOString(), letters: computeLocalResult(weekKey), source: "local" });
    };
    loadResult();
    return () => {
      live = false;
    };
  }, [revealAt]);

  const filledCount = grid.filter(Boolean).length;
  const isComplete = filledCount === 9;

  const onPick = (letter) => {
    setGrid((prev) => {
      const next = [...prev];
      const targetIndex = activeCell === null ? next.findIndex((v) => !v) : activeCell;
      if (targetIndex === -1) return prev;
      next[targetIndex] = letter;
      return next;
    });
    if (activeCell === null) {
      setStatus((s) => (s.error ? { ...s, error: "" } : s));
    }
    setActiveCell(null);
  };

  const clear = () => {
    setGrid(Array(9).fill(""));
    setActiveCell(null);
    setStatus({ loading: false, error: "", ok: "" });
  };

  const submit = async () => {
    setStatus({ loading: false, error: "", ok: "" });
    if (!user) return nav("/login");
    if (!isComplete) return setStatus({ loading: false, error: "Please select 9 letters.", ok: "" });

    const weekKey = result.weekKey;
    setStatus({ loading: true, error: "", ok: "" });
    try {
      await submitRewardsGame({ letters: grid, weekKey }, token);
      setStatus({ loading: false, error: "", ok: "Entry submitted." });
    } catch {
      localStorage.setItem(`br_play_${weekKey}`, JSON.stringify({ letters: grid, weekKey, createdAt: new Date().toISOString() }));
      setStatus({ loading: false, error: "", ok: "Entry saved locally." });
    }
  };

  const shownResult = canReveal ? result.letters : Array(5).fill("?");
  const win = canReveal && isComplete ? checkWin(grid, result.letters) : false;

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="topLeft">
          <div className="brandMini">
            <img src="/biggi-data-logo.png" alt="Biggi Data" />
          </div>
          <div>
            <div className="topTitle">Biggi Rewards</div>
            <div className="topSub">Results: Sundays · 22:00</div>
          </div>
        </div>
        <div className="topRight">
          {user ? (
            <>
              <div className="chip">{user.username || user.name || "User"}</div>
              <button className="btn ghost" onClick={logout} type="button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn ghost" to="/login">
                Login
              </Link>
              <Link className="btn primary" to="/signup">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="container">
        <div className="heroCard">
          <div className="heroHead">
            <div>
              <div className="heroKicker">Weekly Letter Game</div>
              <h1 className="heroTitle">Pick 9 letters (A–Z)</h1>
              <p className="heroDesc">Fill the 3×3 grid. When results drop (5 letters), match any 3-in-a-row to win.</p>
            </div>
            <div className="countdown">
              <div className="countLabel">Next result</div>
              <div className="countValue">{revealAt.toLocaleString()}</div>
              <div className="countHint">Every Sunday 22:00</div>
            </div>
          </div>

          <div className="gameWrap">
            <div className="grid3">
              {grid.map((v, idx) => (
                <button
                  key={idx}
                  className={`cell ${activeCell === idx ? "active" : ""}`}
                  onClick={() => setActiveCell((cur) => (cur === idx ? null : idx))}
                  type="button"
                >
                  {v || "?"}
                </button>
              ))}
            </div>

            <div className="panel">
              <div className="panelTitle">Pick a letter</div>
              <div className="panelSub">
                {activeCell === null ? "Tap letters to fill boxes (left to right), or tap a box to replace it." : `Replacing box #${activeCell + 1}`}
              </div>
              <div className="letters">
                {LETTERS.map((l) => (
                  <button key={l} type="button" className="letterBtn" onClick={() => onPick(l)}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="panelActions">
                <button className="btn ghost" type="button" onClick={clear}>
                  Clear
                </button>
                <button className="btn primary" type="button" onClick={submit} disabled={status.loading}>
                  {status.loading ? "Submitting..." : "Submit Entry"}
                </button>
              </div>
              {status.error ? (
                <div className="error" style={{ marginTop: 10 }}>
                  {status.error}
                </div>
              ) : null}
              {status.ok ? (
                <div className="ok" style={{ marginTop: 10 }}>
                  {status.ok}
                </div>
              ) : null}
            </div>
          </div>

          <div className="resultRow">
            <div className="resultTitle">Result (5 letters)</div>
            <div className="resultBoxes">
              {shownResult.map((l, i) => (
                <div key={i} className="resultBox">
                  {l}
                </div>
              ))}
            </div>
            {canReveal ? (
              <div className={`resultBanner ${win ? "win" : "lose"}`}>{win ? "WINNER" : "NOT A WIN"}</div>
            ) : (
              <div className="finePrint">Results unlock at Sunday 22:00.</div>
            )}
            <div className="finePrint">Result source: {result.source}</div>
          </div>
        </div>
        <div className="footer">© {new Date().getFullYear()} Biggi Rewards</div>
      </main>
    </div>
  );
}
