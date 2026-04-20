import styled from "styled-components";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import { useAuth } from "../utils/AuthContext";
import { getAuthToken } from "../utils/auth";
import { getDataPlans, buyData } from "../services/api";

const Wrapper = styled(Container)`
  padding: 40px 0;
  display: flex;
  justify-content: center;

  @media (max-width: 640px) {
    padding: 20px 0;
    width: min(100%, 92%);
  }
`;

const Card = styled.div`
  width: min(500px, 100%);
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 32px;
  box-shadow: ${({ theme }) => theme.shadows.soft};

  @media (max-width: 640px) {
    padding: 24px 18px;
    border-radius: 22px;
  }
`;

const Title = styled.h1`
  font-size: 26px;
  margin-bottom: 8px;
  font-weight: 700;

  @media (max-width: 640px) {
    font-size: 22px;
  }
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 22px;
`;

const Field = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
`;

const Label = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fdfdff;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.soft};
  }

  &:disabled {
    background: #f5f5f7;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fdfdff;
  font-size: 16px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    background: #f5f5f7;
    cursor: not-allowed;
  }
`;

const PriceBox = styled.div`
  background: ${({ theme }) => theme.colors.soft};
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PriceLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
`;

const PriceValue = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.ink};
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  margin-top: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMsg = styled.p`
  color: #c02626;
  font-size: 13px;
  margin-bottom: 12px;
  background: #fef2f2;
  padding: 8px 12px;
  border-radius: 8px;
`;

const SuccessMsg = styled.p`
  color: #059669;
  font-size: 13px;
  margin-bottom: 12px;
  background: #f0fdf4;
  padding: 8px 12px;
  border-radius: 8px;
`;

const InfoBox = styled.div`
  background: ${({ theme }) => theme.colors.soft};
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.6;
`;

export default function BuyData() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("mtn");
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadPlans();
  }, [user, navigate]);

  // Auto-select first plan when plans load or network changes
  useEffect(() => {
    console.log("useEffect triggered - plans:", plans.length, "network:", network, "current planId:", planId);
    if (plans.length === 0) return;
    
    const plansForCurrentNetwork = plans.filter(
      (p) => (p.network || "").toLowerCase().trim() === network.toLowerCase().trim()
    );
    console.log("Plans for current network:", plansForCurrentNetwork);
    
    if (plansForCurrentNetwork.length > 0) {
      // If current planId is valid for this network, keep it
      if (plansForCurrentNetwork.some((p) => (p.plan_id || "").trim() === (planId || "").trim())) {
        console.log("Current planId is valid, keeping it");
        return;
      }
      // Otherwise, select the first plan for this network
      console.log("Setting new planId:", plansForCurrentNetwork[0].plan_id);
      setPlanId(plansForCurrentNetwork[0].plan_id);
    } else {
      // No plans for this network, clear selection
      console.log("No plans for network, clearing planId");
      setPlanId("");
    }
  }, [plans, network]);

  const loadPlans = async () => {
    try {
      const token = getAuthToken();
      const data = await getDataPlans(token);
      console.log("Raw plans data:", data);
      const filtered = Array.isArray(data)
        ? data.filter((p) => p.active && p.network && p.amount)
        : [];
      console.log("Filtered plans:", filtered);
      setPlans(filtered);
      setError(""); // Clear error on successful load
      if (filtered.length > 0) {
        const mtnPlan = filtered.find((p) => p.network?.toLowerCase() === "mtn");
        console.log("Selected MTN plan:", mtnPlan);
        setPlanId(mtnPlan?.plan_id || filtered[0].plan_id);
      }
    } catch (err) {
      setError(err.message || "Failed to load plans");
    }
  };

  const normalizePhone = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.startsWith("234") && digits.length >= 13) {
      return `0${digits.slice(digits.length - 10)}`.slice(0, 11);
    }
    return digits.slice(0, 11);
  };

  const networkPlans = plans.filter(
    (p) => (p.network || "").toLowerCase().trim() === network.toLowerCase().trim()
  );
  const selectedPlan = networkPlans.find((p) => (p.plan_id || "").trim() === (planId || "").trim());
  const isValid = phone.length === 11 && planId && selectedPlan;

  // Debug logging
  console.log("BuyData Debug:", {
    phone: phone.length,
    planId: `"${planId}"`,
    selectedPlan: selectedPlan ? `"${selectedPlan.plan_id}"` : null,
    networkPlansCount: networkPlans.length,
    network: `"${network}"`,
    networkPlansIds: networkPlans.map(p => `"${p.plan_id}"`),
    isValid
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isValid) {
      setError("Please fill all fields correctly");
      return;
    }

    if (!user?.id) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token not found. Please sign in again.");
        return;
      }
      const result = await buyData({ plan_id: planId, mobile_no: phone }, token);

      if (result.success) {
        setSuccess(`Data purchase successful! Reference: ${result.reference || "pending"}`);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        setError(result.msg || result.error || "Purchase failed");
      }
    } catch (err) {
      setError(err.message || "Purchase failed. Please try again.");
      console.error("Buy data error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Card>
        <Title>Buy Data</Title>
        <Sub>Recharge your data using your Biggi House wallet</Sub>

        <form onSubmit={handleSubmit}>
          <Field>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              placeholder="Enter phone number (e.g. 08012345678)"
              value={phone}
              onChange={(e) => setPhone(normalizePhone(e.target.value))}
              maxLength={11}
              disabled={loading}
            />
          </Field>

          <Field>
            <Label>Network</Label>
            <Select
              value={network}
              onChange={(e) => {
                const newNetwork = e.target.value;
                console.log("Network changed to:", newNetwork);
                setNetwork(newNetwork);
                // Find first plan for the new network from already-filtered plans
                const plansForNetwork = plans.filter(
                  (p) => p.network?.toLowerCase() === newNetwork.toLowerCase()
                );
                console.log("Plans for new network:", plansForNetwork);
                setPlanId(plansForNetwork.length > 0 ? plansForNetwork[0].plan_id : "");
                console.log("Set planId to:", plansForNetwork.length > 0 ? plansForNetwork[0].plan_id : "");
              }}
              disabled={loading}
            >
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
              <option value="glo">Glo</option>
            </Select>
          </Field>

          <Field>
            <Label>Data Plan</Label>
            <Select
              value={planId}
              onChange={(e) => {
                const newPlanId = (e.target.value || "").trim();
                console.log("Plan changed to:", `"${newPlanId}"`);
                setPlanId(newPlanId);
              }}
              disabled={loading || networkPlans.length === 0}
            >
              <option value="">Select a plan</option>
              {networkPlans.map((p) => (
                <option key={p.plan_id} value={p.plan_id}>
                  {p.name || p.plan_name} - ₦{Number(p.amount || 0).toLocaleString()}
                </option>
              ))}
            </Select>
          </Field>

          {selectedPlan && (
            <PriceBox>
              <PriceLabel>{selectedPlan.name || selectedPlan.plan_name}</PriceLabel>
              <PriceValue>₦{Number(selectedPlan.amount || 0).toLocaleString()}</PriceValue>
            </PriceBox>
          )}

          {error && <ErrorMsg>{error}</ErrorMsg>}
          {success && <SuccessMsg>{success}</SuccessMsg>}

          <Button type="submit" disabled={loading || !isValid}>
            {loading ? "Processing..." : "Buy Data"}
          </Button>
        </form>

        <InfoBox style={{ marginTop: "16px" }}>
          • Ensure phone number is correct
          <br />
          • Network must match your SIM card
          <br />
          • Data will be delivered instantly
        </InfoBox>
      </Card>
    </Wrapper>
  );
}
