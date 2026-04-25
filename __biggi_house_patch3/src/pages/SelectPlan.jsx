import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import { getAuthToken } from "../utils/auth";
import { getNetworkPlans } from "../services/api";

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
  margin: 0;
  font-size: 28px;
`;

const Sub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const Tabs = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $active, theme }) => ($active ? theme.gradients.brand : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#111827")};
  font-weight: 900;
  cursor: pointer;
`;

const Grid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.card};
  display: grid;
  gap: 10px;
`;

const PlanTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const PlanName = styled.div`
  font-weight: 1000;
`;

const Price = styled.div`
  font-weight: 1000;
  color: ${({ theme }) => theme.colors.primary};
`;

const MetaRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 700;
  font-size: 13px;
`;

const Meta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.soft};
`;

const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary};
  display: inline-block;
`;

const Notice = styled.div`
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(15, 23, 42, 0.03);
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 800;
`;

export default function SelectPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedNetwork = location.state?.selectedNetwork || null;
  const returnTo = location.state?.returnTo || "/buy-data";
  const phone = location.state?.phone || "";
  const token = useMemo(() => getAuthToken(), []);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let live = true;

    const load = async () => {
      if (!selectedNetwork?.code || !token) return;
      setLoading(true);
      setError("");
      try {
        const rows = await getNetworkPlans(selectedNetwork.code, token);
        if (!live) return;
        const clean = (Array.isArray(rows) ? rows : [])
          .map((p, idx) => ({ ...p, uiId: String(p.plan_id || p._id || idx) }))
          .filter((p) => p.plan_id && p.amount !== undefined);
        setPlans(clean);
      } catch (e) {
        if (!live) return;
        setError(e?.message || "Could not load plans.");
      } finally {
        if (live) setLoading(false);
      }
    };

    load();
    return () => {
      live = false;
    };
  }, [selectedNetwork?.code, token]);

  const categories = useMemo(() => {
    const cats = plans
      .map((p) => String(p.category || "").trim())
      .filter(Boolean);
    return ["all", ...new Set(cats)];
  }, [plans]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return plans;
    return plans.filter((p) => String(p.category || "").trim() === activeCategory);
  }, [activeCategory, plans]);

  const onSelect = (plan) => {
    navigate(returnTo, {
      state: { selectedNetwork, selectedPlan: plan, phone },
      replace: true,
    });
  };

  if (!selectedNetwork?.code) {
    return (
      <Wrapper>
        <Header>
          <Title>Select Plan</Title>
          <Sub>Select a network first.</Sub>
        </Header>
        <Notice>
          <button
            type="button"
            onClick={() => navigate("/select-network", { state: { returnTo, phone } })}
            style={{
              border: "none",
              background: "transparent",
              color: "#1B4DB6",
              fontWeight: 900,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Choose Network
          </button>
        </Notice>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>
        <Title>Choose Data Plan</Title>
        <Sub>
          Network: <strong>{selectedNetwork?.label || selectedNetwork?.network}</strong>
        </Sub>
      </Header>

      <Tabs>
        {categories.map((cat) => (
          <Tab
            key={cat}
            type="button"
            $active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          >
            {cat.toUpperCase()}
          </Tab>
        ))}
      </Tabs>

      {loading ? <Notice>Loading plans...</Notice> : null}
      {error ? <Notice>{error}</Notice> : null}
      {!loading && !error && filtered.length === 0 ? (
        <Notice>No plans found.</Notice>
      ) : null}

      <Grid>
        {filtered.map((p) => (
          <PlanCard key={p.uiId} type="button" onClick={() => onSelect(p)}>
            <PlanTop>
              <PlanName>{p.name || p.plan_name || p.plan_id}</PlanName>
              <Price>₦{Number(p.amount || 0).toLocaleString()}</Price>
            </PlanTop>
            <MetaRow>
              <Meta>
                <Dot aria-hidden="true" />
                <span>{String(selectedNetwork?.label || "").toUpperCase()}</span>
              </Meta>
              <Meta>
                <span>{p.validity || "30 days"}</span>
              </Meta>
              <Meta>
                <span>{String(p.category || "all").toUpperCase()}</span>
              </Meta>
            </MetaRow>
          </PlanCard>
        ))}
      </Grid>
    </Wrapper>
  );
}
