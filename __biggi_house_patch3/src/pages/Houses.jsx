import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import HouseCard from "../components/HouseCard";
import { getAuthToken } from "../utils/auth";
import { useAuth } from "../utils/AuthContext";
import {
  getBiggiHouseHouses,
  getBiggiHouseMemberships,
  getBiggiHouseWallet,
  joinBiggiHouseHouse,
  getBiggiHouseWeeklyCardAccess,
  getSubscriptionStatus,
} from "../services/api";

const PageHeader = styled.div`
  padding: 40px 0 12px;
`;

const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 8px;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
`;

const Filters = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const Chip = styled.button`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : "transparent"};
  color: ${({ $active }) => ($active ? "#fff" : "inherit")};
  font-weight: 600;
  cursor: pointer;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
`;

const Grid = styled(Container)`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  padding-top: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 24, 0.35);
  display: grid;
  place-items: center;
  z-index: 50;
  padding: 20px;
`;

const ModalCard = styled.div`
  width: min(520px, 100%);
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  display: grid;
  gap: 14px;
`;

const ModalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

const GhostButton = styled.button`
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 600;
`;

const PrimaryButton = styled.button`
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

const InfoCard = styled.div`
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  display: grid;
  gap: 8px;
`;

const InfoTitle = styled.div`
  font-weight: 700;
`;

const InfoText = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

export default function Houses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || user?._id || user?.userId;
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("amount-asc");
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [memberships, setMemberships] = useState([]);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [access, setAccess] = useState(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...list];
    if (range !== "all") {
      const [min, max] = range.split("-").map(Number);
      result = result.filter(
        (house) => house.minimum >= min && house.minimum <= max
      );
    }
    if (sort === "amount-asc") {
      result.sort((a, b) => a.minimum - b.minimum);
    }
    if (sort === "amount-desc") {
      result.sort((a, b) => b.minimum - a.minimum);
    }
    if (sort === "availability") {
      result.sort((a, b) => Number(a.members || 0) - Number(b.members || 0));
    }
    return result;
  }, [list, range, sort]);

  useEffect(() => {
    setLoadingList(true);
    const token = getAuthToken();

    Promise.all([
      getBiggiHouseHouses(token).then((data) => {
        if (data.length) setList(data);
      }),
      getBiggiHouseWallet(token).then((wallet) => {
        setWalletBalance(Number(wallet?.balance || 0));
      }),
      getBiggiHouseMemberships(token).then((items) => setMemberships(items || [])),
      getSubscriptionStatus(token).then((data) => setSubscriptionStatus(data)),
      getBiggiHouseWeeklyCardAccess(token).then((data) => setAccess(data)).catch(() => null),
    ])
      .catch((err) => {
        setError(err.message || "Unable to load houses right now.");
      })
      .finally(() => setLoadingList(false));
  }, []);

  const joinedHouseIds = useMemo(() => {
    return new Set((memberships || []).map((m) => String(m?.house?.id || "")));
  }, [memberships]);

  const refreshAccess = () => {
    const token = getAuthToken();
    if (!token) return;
    getBiggiHouseWeeklyCardAccess(token)
      .then((data) => setAccess(data))
      .catch(() => setAccess(null));
  };

  const handleJoin = (house) => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check subscription first
    if (!subscriptionStatus?.isActive) {
      setSelected(house);
      setSubscriptionOpen(true);
      return;
    }

    if (joinedHouseIds.has(String(house.id))) {
      setError(`You have already joined House ${house.number}.`);
      return;
    }

    const requireWeeklyPurchase = Boolean(access?.requireWeeklyDataPurchase);
    const weeklyPurchaseOk = requireWeeklyPurchase ? Boolean(access?.weeklyPurchaseOk) : true;
    if (requireWeeklyPurchase && !weeklyPurchaseOk) {
      setSelected(house);
      setPurchaseOpen(true);
      return;
    }

    setError("");
    setSuccess("");
    setSelected(house);
  };

  const confirmJoin = () => {
    if (!selected) return;
    if (walletBalance < Number(selected.minimum || 0)) {
      setError("Insufficient wallet balance to pay into this house.");
      return;
    }

    setLoading(true);
    const token = getAuthToken();

    joinBiggiHouseHouse(selected.id, token)
      .then((response) => {
        if (response?.wallet?.balance !== undefined) {
          setWalletBalance(Number(response.wallet.balance || 0));
        }
        return Promise.all([
          getBiggiHouseMemberships(token).then((items) => setMemberships(items || [])),
          getBiggiHouseHouses(token).then((houses) => {
            setList(houses);
            if (response?.house) {
              const updatedHouse = houses.find((item) => item.id === response.house.id);
              if (updatedHouse) {
                setSelected(updatedHouse);
              }
            }
          }),
        ]);
      })
      .catch((err) => {
        const msg = err?.message || "Unable to join house. Please try again.";
        setError(msg);
        if (err?.code === "DATA_PURCHASE_REQUIRED" || /purchase at least 1 data/i.test(msg)) {
          setPurchaseOpen(true);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Container>
        <PageHeader>
          <Title>Choose your house</Title>
          <Sub>
            Select a weekly minimum and join a cycle that fits your budget.
          </Sub>
          {Boolean(access?.requireWeeklyDataPurchase) ? (
            <InfoCard>
              <InfoTitle>Weekly eligibility</InfoTitle>
              <InfoText>
                Buy at least 1 data bundle this week to qualify to join a house and play the Weekly Card Game.
              </InfoText>
              <InfoText>
                Status:{" "}
                <strong>{access?.weeklyPurchaseOk ? "Eligible" : "Not eligible"}</strong>
                {typeof access?.weeklyPurchaseCount === "number"
                  ? ` (purchases this week: ${access.weeklyPurchaseCount})`
                  : ""}
              </InfoText>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <PrimaryButton type="button" onClick={() => navigate("/buy-data")}>
                  Buy Data
                </PrimaryButton>
                <GhostButton type="button" onClick={refreshAccess}>
                  Refresh status
                </GhostButton>
              </div>
            </InfoCard>
          ) : null}
          <Controls>
            <Filters>
              <Chip $active={range === "all"} onClick={() => { setRange("all"); setError(""); }} aria-label="Show all houses">
                All houses
              </Chip>
              <Chip
                $active={range === "100-300"}
                onClick={() => { setRange("100-300"); setError(""); }}
                aria-label="Filter houses 100 to 300 naira"
              >
                {"\u20A6"}100 - {"\u20A6"}300
              </Chip>
              <Chip
                $active={range === "400-700"}
                onClick={() => { setRange("400-700"); setError(""); }}
                aria-label="Filter houses 400 to 700 naira"
              >
                {"\u20A6"}400 - {"\u20A6"}700
              </Chip>
              <Chip
                $active={range === "800-1000"}
                onClick={() => { setRange("800-1000"); setError(""); }}
                aria-label="Filter houses 800 to 1000 naira"
              >
                {"\u20A6"}800 - {"\u20A6"}1000
              </Chip>
            </Filters>
            <Select value={sort} onChange={(e) => { setSort(e.target.value); setError(""); }} aria-label="Sort houses">
              <option value="amount-asc">Sort: Amount (low to high)</option>
              <option value="amount-desc">Sort: Amount (high to low)</option>
              <option value="availability">Sort: Availability</option>
            </Select>
          </Controls>
          {loadingList && (
            <p style={{ marginTop: "10px", color: "#5b6475" }}>
              Loading houses...
            </p>
          )}
          {success && (
            <p style={{ marginTop: "10px", color: "#15803d" }}>{success}</p>
          )}
          {error && (
            <p style={{ marginTop: "10px", color: "#b45309" }}>{error}</p>
          )}

        </PageHeader>
      </Container>

      <Grid>
        {filtered.map((house) => (
          <HouseCard
            key={house.id}
            house={house}
            onJoin={handleJoin}
            isSelected={joinedHouseIds.has(String(house.id))}
          />
        ))}
      </Grid>

      {selected && (
        <ModalBackdrop>
          <ModalCard>
            <h2>Confirm your selection</h2>
            <p style={{ color: "#5b6475" }}>
              You are about to join House {selected.number}. This house requires
              a minimum weekly contribution of {"\u20A6"}
              {selected.minimum}.
            </p>
            <ModalRow>
              <span>Wallet balance</span>
              <strong>
                {"\u20A6"}
                {walletBalance.toLocaleString()}
              </strong>
            </ModalRow>
            <ModalRow>
              <span>Contribution amount</span>
              <strong>
                {"\u20A6"}
                {Number(selected.minimum || 0).toLocaleString()}
              </strong>
            </ModalRow>
            <ModalRow>
              <span>Balance after payment</span>
              <strong>
                {"\u20A6"}
                {Math.max(0, walletBalance - Number(selected.minimum || 0)).toLocaleString()}
              </strong>
            </ModalRow>
            <ModalRow>
              <span>Current members</span>
              <strong>{selected.members}</strong>
            </ModalRow>
            <ModalRow>
              <span>Estimated pool</span>
              <strong>
                {"\u20A6"}
                {Number(selected.totalPool || 0).toLocaleString()}
              </strong>
            </ModalRow>
            <ModalActions>
              <GhostButton onClick={() => setSelected(null)}>
                Cancel
              </GhostButton>
              <PrimaryButton onClick={confirmJoin} disabled={loading}>
                {loading ? "Processing..." : "Pay and join house"}
              </PrimaryButton>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {subscriptionOpen && (
        <ModalBackdrop>
          <ModalCard>
            <h2>Subscription Required</h2>
            <p style={{ color: "#5b6475" }}>
              You need an active subscription to join a house. Subscribe for just ₦50/week to access
              all houses and start saving.
            </p>
            <ModalRow>
              <span>Weekly Fee</span>
              <strong>₦50</strong>
            </ModalRow>
            <ModalRow>
              <span>Status</span>
              <strong style={{ color: "#ef4444" }}>No Active Subscription</strong>
            </ModalRow>
            <ModalActions>
              <GhostButton
                type="button"
                onClick={() => {
                  setSubscriptionOpen(false);
                  setSelected(null);
                }}
              >
                Cancel
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={() => {
                  setSubscriptionOpen(false);
                  navigate("/subscription");
                }}
                aria-label="Go to subscription page"
              >
                Subscribe Now
              </PrimaryButton>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {purchaseOpen && (
        <ModalBackdrop>
          <ModalCard>
            <h2>Buy Data Required</h2>
            <p style={{ color: "#5b6475" }}>
              To join a house, you must purchase at least 1 data bundle this week. After buying data, refresh your status and try again.
            </p>
            <ModalActions>
              <GhostButton
                type="button"
                onClick={() => {
                  setPurchaseOpen(false);
                  refreshAccess();
                }}
              >
                Close
              </GhostButton>
              <PrimaryButton
                type="button"
                onClick={() => {
                  setPurchaseOpen(false);
                  navigate("/buy-data");
                }}
              >
                Buy Data
              </PrimaryButton>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}
    </>
  );
}
