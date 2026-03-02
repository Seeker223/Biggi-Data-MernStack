import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import styled from "styled-components";
import {
  ArrowLeft,
  ChevronRight,
  Wifi,
  Clock3,
  CreditCard,
  ShieldCheck,
  Zap,
  Signal,
  Smartphone,
} from "lucide-react";

const SelectPlanScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedNetwork = location.state?.selectedNetwork || null;
  const returnTo = location.state?.returnTo || "/buy-data";

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const PLAN_PRESETS = {
    mtn: [
      { label: "500MB", sizeMb: 500, validity: "7 days", amount: 405, category: "SME" },
      { label: "1GB", sizeMb: 1024, validity: "1 day", amount: 315, category: "SME" },
      { label: "1GB", sizeMb: 1024, validity: "7 days", amount: 510, category: "SME" },
      { label: "1GB", sizeMb: 1024, validity: "30 days", amount: 630, category: "SME" },
      { label: "2GB", sizeMb: 2048, validity: "30 days", amount: 899, category: "SME" },
      { label: "2.5GB", sizeMb: 2560, validity: "1 day", amount: 616, category: "SME" },
      { label: "3GB", sizeMb: 3072, validity: "30 days", amount: 1230, category: "SME" },
      { label: "5GB", sizeMb: 5120, validity: "30 days", amount: 1670, category: "SME" },
      { label: "10GB", sizeMb: 10240, validity: "30 days", amount: 4430, category: "SME" },
    ],
    glo: [
      { label: "200MB", sizeMb: 200, validity: "14 days", amount: 205, category: "CG" },
      { label: "500MB", sizeMb: 500, validity: "30 days", amount: 310, category: "CG" },
      { label: "1GB", sizeMb: 1024, validity: "30 days", amount: 505, category: "CG" },
      { label: "2GB", sizeMb: 2048, validity: "30 days", amount: 910, category: "CG" },
      { label: "3GB", sizeMb: 3072, validity: "30 days", amount: 1315, category: "CG" },
      { label: "5GB", sizeMb: 5120, validity: "30 days", amount: 2125, category: "CG" },
      { label: "10GB", sizeMb: 10240, validity: "30 days", amount: 4150, category: "CG" },
    ],
    airtel: [
      { label: "100MB", sizeMb: 100, validity: "1/7 days", amount: 300, category: "CG" },
      { label: "300MB", sizeMb: 300, validity: "1/7 days", amount: 409, category: "CG" },
      { label: "500MB", sizeMb: 500, validity: "7/30 days", amount: 610, category: "CG" },
      { label: "1GB", sizeMb: 1024, validity: "30 days", amount: 1120, category: "CG" },
    ],
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
  const pickClosestPlan = (plansWithSize, targetMb) => {
    if (plansWithSize.length === 0) return null;
    const sorted = [...plansWithSize].sort((a, b) => {
      const da = Math.abs(a.sizeMb - targetMb);
      const db = Math.abs(b.sizeMb - targetMb);
      if (da !== db) return da - db;
      return Number(a.plan.amount || 0) - Number(b.plan.amount || 0);
    });
    return sorted[0];
  };
  const buildConfiguredPlans = (rawPlans, networkLabel, networkKey) => {
    const plansWithSize = rawPlans
      .map((plan) => {
        const id = plan.plan_id || plan._id || plan.id;
        return { id, sizeMb: extractSizeInMb(plan), plan };
      })
      .filter((entry) => entry.id && entry.sizeMb !== null);

    if (plansWithSize.length === 0) return [];
    const presets = PLAN_PRESETS[networkKey] || [];
    if (presets.length === 0) return [];

    const selected = presets
      .map((preset, index) => {
        const picked = pickClosestPlan(plansWithSize, preset.sizeMb);
        if (!picked) return null;
        return {
          ...picked.plan,
          name: `${networkLabel} ${preset.label}`,
          plan_name: `${networkLabel} ${preset.label}`,
          validity: preset.validity,
          amount: preset.amount,
          category: preset.category,
          uiId: `${picked.id}-${preset.label}-${preset.validity}-${index}`,
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
        setPlans(buildConfiguredPlans(rawPlans, label || "DATA", networkKey));
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

  const networkCode = normalizeText(selectedNetwork?.code || selectedNetwork?.label || selectedNetwork?.network);
  const networkLabel = selectedNetwork?.label || selectedNetwork?.network || "Network";
  const networkTheme = (() => {
    if (networkCode.includes("mtn")) return { color: "#f5c400", icon: Signal };
    if (networkCode.includes("airtel")) return { color: "#de1b2b", icon: Signal };
    if (networkCode.includes("glo")) return { color: "#0f8d2c", icon: Wifi };
    if (networkCode.includes("9mobile") || networkCode.includes("etisalat"))
      return { color: "#007e59", icon: Smartphone };
    return { color: "#ff7a00", icon: Wifi };
  })();
  const NetworkIcon = networkTheme.icon;
  const isPopular = (index) => index === 0;

  return (
    <Wrap>
      <Card>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={32} />
          </BackBtn>
          <HeaderCenter>
            <NetworkBadge $color={networkTheme.color}>
              <NetworkIcon size={16} />
              <span>{networkLabel}</span>
            </NetworkBadge>
            <Title>Choose Data Plan</Title>
            <Subtitle>Select your preferred bundle</Subtitle>
          </HeaderCenter>
          <HeaderSpacer />
        </Header>

        <InfoPanel>
          <InfoCell>
            <Zap size={20} color="#ff7a00" />
            <span>Instant Delivery</span>
          </InfoCell>
          <Divider />
          <InfoCell>
            <ShieldCheck size={20} color="#ff7a00" />
            <span>Guaranteed</span>
          </InfoCell>
        </InfoPanel>

        <SectionTitle>Plan Types</SectionTitle>
        <Tabs>
          {categories.map((cat) => (
            <Tab
              key={cat}
              onClick={() => setActiveCategory(cat)}
              $active={activeCategory === cat}
            >
              {cat.toUpperCase()}
            </Tab>
          ))}
        </Tabs>

        {loading ? <Info>Loading plans...</Info> : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
        {!loading && !error && filtered.length === 0 ? <Info>No plans found.</Info> : null}

        <PlansWrap>
          {filtered.map((plan, index) => (
            <PlanItem key={plan.uiId || plan.plan_id || plan._id || index} onClick={() => onSelectPlan(plan)} $popular={isPopular(index)}>
              {isPopular(index) ? <PopularTag>POPULAR</PopularTag> : null}
              <PlanTop>
                <PlanName>{plan.name || plan.plan_name}</PlanName>
                <PlanPrice>N{Number(plan.amount || 0).toLocaleString()}</PlanPrice>
              </PlanTop>

              <PlanBottom>
                <PlanMetaRow>
                  <PlanMetaItem>
                    <Wifi size={14} />
                  </PlanMetaItem>
                  <MetaDivider />
                  <PlanMetaItem>
                    <Clock3 size={14} />
                    <span>{plan.validity || "30 days"}</span>
                  </PlanMetaItem>
                  <MetaDivider />
                  <PlanMetaItem>
                    <CreditCard size={14} />
                    <span>{plan.category || activeCategory}</span>
                  </PlanMetaItem>
                </PlanMetaRow>

                <SelectChip>
                  Select <ChevronRight size={15} />
                </SelectChip>
              </PlanBottom>
            </PlanItem>
          ))}
        </PlansWrap>

        {!loading && !error && filtered.length > 0 ? (
          <BottomHint>
            All plans include instant delivery and 24/7 support
          </BottomHint>
        ) : null}
      </Card>
    </Wrap>
  );
};

export default SelectPlanScreen;

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: #fff;
`;

const Card = styled.div`
  width: 100%;
  max-width: 460px;
  min-height: 100vh;
  padding-bottom: 90px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 20px;
  border-bottom: 1px solid #efefef;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  color: #000;
  @media (max-width: 440px) {
    font-size: 22px;
  }
`;

const BackBtn = styled.button`
  border: 0;
  background: transparent;
  border-radius: 8px;
  color: #000;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const HeaderCenter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const NetworkBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  color: #fff;
  background: ${(p) => p.$color};
  font-size: 16px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #666;
  font-size: 15px;
`;

const HeaderSpacer = styled.div`
  width: 38px;
  height: 38px;
`;

const InfoPanel = styled.div`
  margin: 16px;
  border: 1px solid #ececec;
  border-radius: 18px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px;
`;

const InfoCell = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #000;
  font-size: 14px;
  font-weight: 700;
`;

const Divider = styled.div`
  width: 1px;
  height: 30px;
  background: #ddd;
`;

const SectionTitle = styled.h2`
  margin: 6px 16px 12px;
  font-size: 18px;
  line-height: 1.05;
`;

const Tabs = styled.div`
  display: flex;
  gap: 12px;
  margin: 0 16px 14px;
  overflow-x: auto;
`;

const Tab = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 14px 26px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
  background: ${(p) => (p.$active ? "#ff7a00" : "#efefef")};
  color: ${(p) => (p.$active ? "#fff" : "#666")};
`;

const PlanItem = styled.button`
  width: 100%;
  border: 1px solid #ececec;
  border-radius: 22px;
  padding: 24px;
  margin-bottom: 16px;
  text-align: left;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
  position: relative;
  border-width: ${(p) => (p.$popular ? "2px" : "1px")};
  border-color: ${(p) => (p.$popular ? "#ff7a00" : "#ececec")};
`;

const PlanName = styled.div`
  font-size: 20px;
  line-height: 1.05;
  font-weight: 800;
  color: #000;
`;

const PlanTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
`;

const PlanPrice = styled.div`
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
  color: #000;
`;

const PlanBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  gap: 12px;
  flex-wrap: wrap;
`;

const PlanMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
`;

const PlanMetaItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
`;

const MetaDivider = styled.div`
  width: 1px;
  height: 18px;
  background: #d8d8d8;
`;

const Info = styled.p`
  color: #555;
  margin: 0 16px 12px;
  font-size: 18px;
`;

const ErrorText = styled.p`
  color: #d11a2a;
  margin: 0 16px 12px;
  font-size: 16px;
`;

const PlansWrap = styled.div`
  padding: 0 16px;
`;

const PopularTag = styled.span`
  position: absolute;
  right: 16px;
  top: -12px;
  border-radius: 999px;
  background: #ff8a00;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.4px;
  padding: 4px 12px;
`;

const SelectChip = styled.span`
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 16px;
  font-weight: 700;
  color: #ff7a00;
  background: #fff5ec;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const BottomHint = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 460px;
  background: #f7f7f7;
  border-top: 1px solid #ececec;
  padding: 14px 16px;
  text-align: center;
  color: #111;
  font-size: 16px;
`;
