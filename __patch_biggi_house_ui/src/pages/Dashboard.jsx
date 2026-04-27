import styled from "styled-components";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import WalletCard from "../components/WalletCard";
import {
  getAuthToken,
} from "../utils/auth";
import { useAuth } from "../utils/AuthContext";
import {
  getBiggiHouseMemberships,
  getBiggiHouseWallet,
  getBiggiHousePublicConfig,
  getBiggiHouseWeeklyCardAccess,
} from "../services/api";

const Wrapper = styled(Container)`
  padding: 40px 0 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 32px;
`;

const Button = styled.button`
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
`;

const GhostButton = styled.button`
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 600;
`;

const WarningButton = styled.button`
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-top: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const CardLabel = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const CardValue = styled.div`
  font-size: 26px;
  font-weight: 700;
  margin-top: 6px;
`;

const ProgressWrap = styled.div`
  margin-top: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.soft};
  overflow: hidden;
`;

const Progress = styled.div`
  width: ${({ $value }) => `${Math.max(0, Math.min(100, Number($value || 0)))}%`};
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
`;

const Activity = styled.ul`
  list-style: none;
  margin-top: 16px;
  display: grid;
  gap: 12px;
`;

const ActivityItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 24, 0.35);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: min(520px, 100%);
  background: #fff;
  border-radius: 20px;
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  display: grid;
  gap: 12px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
`;

const ModalText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
`;

const ModalGhost = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 900;
  cursor: pointer;
`;

const ModalPrimary = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
`;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [config, setConfig] = useState(null);
  const [access, setAccess] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);

  const token = useMemo(() => getAuthToken(), []);

  const reload = useCallback(() => {
    if (!token) return;
    setLoadingData(true);
    setError("");
    Promise.all([
      getBiggiHouseWallet(token).then((data) => setWallet(data)),
      getBiggiHouseMemberships(token).then((data) => setMemberships(data || [])),
      getBiggiHousePublicConfig().then((data) => setConfig(data)).catch(() => null),
      getBiggiHouseWeeklyCardAccess(token).then((data) => setAccess(data)).catch(() => null),
    ])
      .catch((err) => setError(err?.message || "Unable to load dashboard data."))
      .finally(() => setLoadingData(false));
  }, [token]);

  useEffect(() => {
    reload();

    const onFocus = () => reload();
    const onVisibility = () => {
      if (document.visibilityState === "visible") reload();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reload]);

  const walletBalance = Number(wallet?.balance || 0);
  const latestHouse = memberships[0]?.house || null;
  const latestJoin = (wallet?.transactions || []).find((item) => item.type === "house_join");
  const weeklyPayout = config?.weeklyPayout || { dayOfWeek: 0, hour: 22, minute: 0 };
  const weeklyPayoutTime = (() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayLabel = days[Number(weeklyPayout.dayOfWeek) % 7] || "Sunday";
    const hh = String(Number(weeklyPayout.hour || 0)).padStart(2, "0");
    const mm = String(Number(weeklyPayout.minute || 0)).padStart(2, "0");
    return `${dayLabel} ${"\u00B7"} ${hh}:${mm}`;
  })();

  const nextPayout = useMemo(() => {
    const now = new Date();
    const next = new Date(now);
    const targetDow = Number(weeklyPayout.dayOfWeek || 0); // 0 = Sun
    const currentDow = next.getDay();
    let addDays = (targetDow - currentDow + 7) % 7;
    const targetHour = Number(weeklyPayout.hour || 22);
    const targetMinute = Number(weeklyPayout.minute || 0);
    if (
      addDays === 0 &&
      (next.getHours() > targetHour ||
        (next.getHours() === targetHour && next.getMinutes() >= targetMinute))
    ) {
      addDays = 7;
    }
    next.setDate(next.getDate() + addDays);
    next.setHours(targetHour, targetMinute, 0, 0);
    return next.toLocaleString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [weeklyPayout.dayOfWeek, weeklyPayout.hour, weeklyPayout.minute]);

  const gameEnabled = Boolean(access?.enabled ?? config?.features?.weeklyCardGameEnabled);
  const requireWeeklyPurchase = Boolean(access?.requireWeeklyDataPurchase);
  const weeklyPurchaseOk = requireWeeklyPurchase ? Boolean(access?.weeklyPurchaseOk) : true;
  const gamePlayable = Boolean(gameEnabled && weeklyPurchaseOk);
  const needsWeeklyPurchase = Boolean(gameEnabled && requireWeeklyPurchase && !weeklyPurchaseOk);

  const handleLogout = () => {
    setLogoutOpen(false);
    logout();
    navigate("/");
  };

  const handleLeaveHouse = () => {
    // Memberships are persisted server-side; leaving is not implemented yet.
    navigate("/houses");
  };

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>Dashboard</Title>
          <p style={{ color: "#5b6475" }}>
            Welcome back, {user?.name || "Member"}. Track your savings cycle in
            one glance.
          </p>
          {user?.email && (
            <p style={{ color: "#5b6475", marginTop: "4px" }}>
              {user.email}
            </p>
          )}
          {loadingData && (
            <p style={{ color: "#5b6475", marginTop: "10px" }}>Refreshing...</p>
          )}
          {error && <p style={{ color: "#c02626", marginTop: "10px" }}>{error}</p>}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Button type="button" onClick={() => navigate("/wallet")}>
            Fund Wallet
          </Button>
          {memberships.length > 0 && (
            <WarningButton onClick={handleLeaveHouse}>View houses</WarningButton>
          )}
          <GhostButton onClick={() => setLogoutOpen(true)}>Logout</GhostButton>
        </div>
      </Header>

      <Grid>
        <WalletCard
          balance={walletBalance}
          currentHouse={latestHouse ? `House ${latestHouse.number}` : "Not joined"}
          lastBalance={latestJoin?.meta?.previousBalance ?? walletBalance}
          weeklyPayoutTime={weeklyPayoutTime}
        />
        <Card>
          <CardLabel>Current house</CardLabel>
          <CardValue>
            {latestHouse ? `House ${latestHouse.number}` : "Not joined"}
          </CardValue>
          <ProgressWrap>
            <Progress $value={memberships.length ? 70 : 15} />
          </ProgressWrap>
          <p style={{ color: "#5b6475", marginTop: "10px" }}>
            {memberships.length ? "Your weekly cycle is active." : "Join a house to start."}
          </p>
        </Card>
        <Card>
          <CardLabel>Next payout</CardLabel>
          <CardValue>{nextPayout}</CardValue>
          <p style={{ color: "#5b6475", marginTop: "10px" }}>
            Weekly payout time: {weeklyPayoutTime}
          </p>
        </Card>
      </Grid>

      <Grid style={{ marginTop: "24px" }}>
        <Card>
          <CardLabel>Weekly Card Game</CardLabel>
          <CardValue>
            {!gameEnabled ? "Disabled" : gamePlayable ? "Ready" : "Not eligible"}
          </CardValue>
          <p style={{ color: "#5b6475", marginTop: "10px" }}>
            Pick 5 letters (A–Z). If all 5 appear in the 9-letter Sunday (10pm) result, you win a free data bundle.
          </p>
          <p style={{ color: "#5b6475", marginTop: "8px" }}>
            Requires at least 1 data purchase this week. One play per week.
          </p>
          {gameEnabled && requireWeeklyPurchase && !weeklyPurchaseOk ? (
            <p style={{ color: "#b91c1c", marginTop: "8px", fontWeight: 600 }}>
              Purchase at least 1 data bundle this week to unlock the game.
            </p>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <Button
              type="button"
              disabled={!gameEnabled}
              onClick={() => navigate(needsWeeklyPurchase ? "/buy-data" : "/weekly-card-game")}
              style={{ opacity: gameEnabled ? 1 : 0.6 }}
            >
              {needsWeeklyPurchase ? "Buy Data" : "Open game"}
            </Button>
          </div>
        </Card>
        <Card>
          <CardLabel>BiggiHouse wallet</CardLabel>
          <CardValue>
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(walletBalance)}
          </CardValue>
          <p style={{ color: "#5b6475", marginTop: "10px" }}>
            {latestJoin?.meta?.houseNumber
              ? `Last paid: House ${latestJoin.meta.houseNumber}`
              : "No house payment yet."}
          </p>
        </Card>
        <Card>
          <CardLabel>Recent activity</CardLabel>
          <Activity>
            {(wallet?.transactions || []).slice(0, 3).map((item) => (
              <ActivityItem key={item.reference || item._id}>
                <span>
                  {item.type === "deposit"
                    ? "Deposit"
                    : item.type === "withdraw"
                    ? "Withdraw"
                    : "House contribution"}
                </span>
                <span>
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                    maximumFractionDigits: 0,
                  }).format(Number(item.amount || 0))}{" "}
                  {"\u00B7"}{" "}
                  {new Date(item.date || Date.now()).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </ActivityItem>
            ))}
          </Activity>
        </Card>
      </Grid>

      <Grid style={{ marginTop: "24px" }}>
        <Card>
          <CardLabel>Joined houses</CardLabel>
          {memberships.length ? (
            <ul style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
              {memberships.map((membership) => (
                <li key={membership.id}>
                  House {membership.house.number} {"\u00B7"} {"\u20A6"}
                  {membership.house.minimum}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#5b6475", marginTop: "10px" }}>
              You have not joined a house yet.
            </p>
          )}
        </Card>
      </Grid>

      {logoutOpen ? (
        <ModalBackdrop
          role="dialog"
          aria-modal="true"
          aria-label="Confirm logout"
          onClick={() => setLogoutOpen(false)}
        >
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Confirm logout</ModalTitle>
            <ModalText>Are you sure you want to log out?</ModalText>
            <ModalActions>
              <ModalGhost type="button" onClick={() => setLogoutOpen(false)}>
                Cancel
              </ModalGhost>
              <ModalPrimary type="button" onClick={handleLogout}>
                Logout
              </ModalPrimary>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      ) : null}
    </Wrapper>
  );
}
