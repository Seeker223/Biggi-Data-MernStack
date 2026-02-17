import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import styled from "styled-components";

const SelectPlanScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedNetwork = location.state?.selectedNetwork || null;
  const returnTo = location.state?.returnTo || "/buy-data";

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    let live = true;

    const load = async () => {
      if (!selectedNetwork?.code) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/plans/network/${selectedNetwork.code}`);
        if (!live) return;
        setPlans(Array.isArray(res.data?.plans) ? res.data.plans : []);
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
          <BackBtn onClick={() => navigate(-1)}>Back</BackBtn>
          <Title>{selectedNetwork.label} Plans</Title>
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
            <PlanPrice>N{Number(plan.amount || 0).toLocaleString()}</PlanPrice>
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
  padding: 24px 14px;
  background: #fff;
`;

const Card = styled.div`
  width: 100%;
  max-width: 460px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
`;

const BackBtn = styled.button`
  border: 0;
  background: #f1f1f1;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
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
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  background: #f8f8f8;
  cursor: pointer;
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
`;

const Info = styled.p`
  color: #555;
`;

const ErrorText = styled.p`
  color: #d11a2a;
`;
