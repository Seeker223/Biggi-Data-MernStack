import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import styled from "styled-components";
import { ArrowLeft, ChevronRight } from "lucide-react";

const SelectPlanScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedNetwork = location.state?.selectedNetwork || null;
  const returnTo = location.state?.returnTo || "/buy-data";

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const PRICE_OVERRIDES = {
    mtn: { "500MB": 450, "1GB": 550 },
    glo: { "500MB": 330, "1GB": 440 },
    airtel: { "500MB": 580, "1GB": 890 },
  };

  const normalizeText = (value) => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  const extractSizeInMb = (plan) => {
    const source = `${plan?.name || ""} ${plan?.plan_name || ""}`;
    const match = source.match(/(\d+(?:\.\d+)?)\s*(gb|mb)/i);
    if (!match) return null;
    const value = Number(match[1]);
    if (Number.isNaN(value)) return null;
    const unit = String(match[2] || "").toLowerCase();
    return unit === "gb" ? value * 1024 : value;
  };
  const pickClosestPlan = (plansWithSize, targetMb, usedIds) => {
    const available = plansWithSize.filter((p) => !usedIds.has(p.id));
    if (available.length === 0) return null;
    available.sort((a, b) => {
      const da = Math.abs(a.sizeMb - targetMb);
      const db = Math.abs(b.sizeMb - targetMb);
      if (da !== db) return da - db;
      return Number(a.plan.amount || 0) - Number(b.plan.amount || 0);
    });
    return available[0];
  };
  const buildLimitedPlans = (rawPlans, networkLabel, networkKey) => {
    const plansWithSize = rawPlans
      .map((plan) => {
        const id = plan.plan_id || plan._id || plan.id;
        return { id, sizeMb: extractSizeInMb(plan), plan };
      })
      .filter((entry) => entry.id && entry.sizeMb !== null);

    if (plansWithSize.length === 0) return [];

    const usedIds = new Set();
    const targetConfigs = [
      { targetMb: 500, label: "500MB" },
      { targetMb: 1024, label: "1GB" },
    ];

    const selected = targetConfigs
      .map((target) => {
        const picked = pickClosestPlan(plansWithSize, target.targetMb, usedIds);
        if (!picked) return null;
        usedIds.add(picked.id);
        return {
          ...picked.plan,
          name: `${networkLabel} ${target.label}`,
          plan_name: `${networkLabel} ${target.label}`,
          validity: "7 days",
          amount: PRICE_OVERRIDES[networkKey]?.[target.label] ?? picked.plan.amount,
        };
      })
      .filter(Boolean);

    return selected;
  };

  useEffect(() => {
    let live = true;

    const load = async () => {
      if (!selectedNetwork?.code) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/plans/network/${selectedNetwork.code}`);
        if (!live) return;
        const rawPlans = Array.isArray(res.data?.plans) ? res.data.plans : [];
        const label = normalizeText(selectedNetwork?.label || selectedNetwork?.network || "").toUpperCase();
        const networkKey = normalizeText(
          selectedNetwork?.code || selectedNetwork?.network || selectedNetwork?.label || ""
        );
        setPlans(buildLimitedPlans(rawPlans, label || "DATA", networkKey));
      } catch (err) {
        if (!live) return;
        setError(err?.response?.data?.msg || "Could not load plans");
      } finally {
        if (live) setLoading(false);
      }
    };

    load();
    return () => {
      live = false;
    };
  }, [selectedNetwork?.code]);

  const categories = useMemo(() => {
    const cats = plans.map((p) => String(p.category || "").trim()).filter(Boolean);
    return ["all", ...new Set(cats)];
  }, [plans]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return plans;
    return plans.filter((p) => String(p.category || "").trim() === activeCategory);
  }, [activeCategory, plans]);

  const onSelectPlan = (plan) => {
    navigate(returnTo, {
      state: { selectedNetwork, selectedPlan: plan },
      replace: true,
    });
  };

  if (!selectedNetwork?.code) {
    return (
      <Wrap>
        <Card>
          <Title>Select Plan</Title>
          <Info>Select a network first.</Info>
          <BackBtn onClick={() => navigate("/select-network", { state: { returnTo } })}>
            Choose Network
          </BackBtn>
        </Card>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Card>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </BackBtn>
          <Title>{selectedNetwork.label} Plans</Title>
          <HeaderSpacer />
        </Header>

        <Tabs>
          {categories.map((cat) => (
            <Tab
              key={cat}
              onClick={() => setActiveCategory(cat)}
              $active={activeCategory === cat}
            >
              {cat}
            </Tab>
          ))}
        </Tabs>

        {loading ? <Info>Loading plans...</Info> : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
        {!loading && !error && filtered.length === 0 ? <Info>No plans found.</Info> : null}

        {filtered.map((plan) => (
          <PlanItem key={plan.plan_id || plan._id} onClick={() => onSelectPlan(plan)}>
            <div>
              <PlanName>{plan.name}</PlanName>
              <PlanMeta>{plan.validity || "No validity"}</PlanMeta>
            </div>
            <PlanRight>
              <PlanPrice>N{Number(plan.amount || 0).toLocaleString()}</PlanPrice>
              <ChevronRight size={16} />
            </PlanRight>
          </PlanItem>
        ))}
      </Card>
    </Wrap>
  );
};

export default SelectPlanScreen;

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 0;
  background: #fff;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  color: #fff;
`;

const BackBtn = styled.button`
  border: 0;
  background: transparent;
  border-radius: 8px;
  color: #fff;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const HeaderSpacer = styled.div`
  width: 32px;
  height: 32px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0 16px 12px;
`;

const Tab = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
  background: ${(p) => (p.$active ? "#ff7a00" : "#eee")};
  color: ${(p) => (p.$active ? "#fff" : "#222")};
`;

const PlanItem = styled.button`
  width: 100%;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  background: #fff;
  cursor: pointer;
  margin-left: 16px;
  margin-right: 16px;
`;

const PlanName = styled.div`
  font-weight: 700;
`;

const PlanMeta = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 2px;
`;

const PlanPrice = styled.div`
  font-weight: 700;
  color: #ff7a00;
`;

const PlanRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
`;

const Info = styled.p`
  color: #555;
  margin-left: 16px;
`;

const ErrorText = styled.p`
  color: #d11a2a;
  margin-left: 16px;
`;
