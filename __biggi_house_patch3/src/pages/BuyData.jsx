import styled from "styled-components";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import { useAuth } from "../utils/AuthContext";
import { getAuthToken } from "../utils/auth";
import {
  buyData,
  getDataPlans,
  getTransactionSecurityStatus,
  setTransactionPin,
} from "../services/api";

const Wrapper = styled(Container)`
  padding: 40px 0 60px;
  max-width: 760px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`;

const Sub = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const Card = styled.div`
  margin-top: 18px;
  background: #fff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 18px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  display: grid;
  gap: 14px;
`;

const Row = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.div`
  font-weight: 800;
`;

const Input = styled.input`
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  outline: none;
`;

const Select = styled.select`
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  background: #fff;
`;

const HelperRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const Helper = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
`;

const Price = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.soft};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const PriceLabel = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 700;
`;

const PriceValue = styled.div`
  font-weight: 1000;
`;

const Primary = styled.button`
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  opacity: ${({ disabled }) => (disabled ? 0.65 : 1)};
`;

const Notice = styled.div`
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "error" ? "rgba(220,38,38,.25)" : "rgba(16,185,129,.25)"};
  background: ${({ $tone }) =>
    $tone === "error" ? "rgba(220,38,38,.08)" : "rgba(16,185,129,.10)"};
  color: ${({ $tone }) => ($tone === "error" ? "#7f1d1d" : "#065f46")};
  font-weight: 800;
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
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  display: grid;
  gap: 12px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

const Ghost = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  font-weight: 900;
  cursor: pointer;
`;

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) {
    return `0${digits.slice(digits.length - 10)}`.slice(0, 11);
  }
  return digits.slice(0, 11);
};

export default function BuyData() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = useMemo(() => getAuthToken(), []);

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [planId, setPlanId] = useState("");

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    setPhone((p) => p || normalizePhone(user?.phoneNumber || ""));
  }, [user?.phoneNumber]);

  useEffect(() => {
    if (!token) return;
    setLoadingPlans(true);
    getDataPlans(token)
      .then((rows) => setPlans(Array.isArray(rows) ? rows : []))
      .catch((e) => setNotice({ tone: "error", text: e?.message || "Failed to load plans." }))
      .finally(() => setLoadingPlans(false));
  }, [token]);

  const networks = useMemo(() => {
    const set = new Set();
    (plans || []).forEach((p) => {
      if (p?.network) set.add(String(p.network).toUpperCase());
    });
    return Array.from(set).sort();
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const net = String(network || "").toUpperCase();
    return (plans || [])
      .filter((p) => (net ? String(p.network || "").toUpperCase() === net : true))
      .sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }, [plans, network]);

  const selectedPlan = useMemo(() => {
    const id = String(planId || "").trim().toLowerCase();
    return filteredPlans.find((p) => String(p.plan_id || "").toLowerCase() === id) || null;
  }, [filteredPlans, planId]);

  const validate = () => {
    const p = normalizePhone(phone);
    if (!p || p.length !== 11) return "Enter a valid 11-digit phone number.";
    if (!network) return "Select a network.";
    if (!selectedPlan?.plan_id) return "Select a data plan.";
    return null;
  };

  const submitPurchase = async ({ transactionPin }) => {
    if (!token) return;
    const err = validate();
    if (err) {
      setNotice({ tone: "error", text: err });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      await buyData(
        {
          plan_id: selectedPlan.plan_id,
          mobile_no: normalizePhone(phone),
          transactionPin: transactionPin || undefined,
        },
        token
      );
      setNotice({ tone: "success", text: "Data purchase successful." });
      setPin("");
      setNewPin("");
      setConfirmPin("");
      setPinModalOpen(false);
    } catch (e) {
      const msg = e?.message || "Purchase failed.";
      setNotice({ tone: "error", text: msg });
      if (/pin/i.test(msg) && /required|enable|enabled/i.test(msg)) {
        setPinModalOpen(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const onPay = async () => {
    if (!token) return;
    const err = validate();
    if (err) {
      setNotice({ tone: "error", text: err });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const security = await getTransactionSecurityStatus(token).catch(() => null);
      const enabled = Boolean(security?.transactionPinEnabled);
      setPinEnabled(enabled);
      if (enabled) {
        setPinModalOpen(true);
      } else {
        await submitPurchase({});
      }
    } finally {
      setBusy(false);
    }
  };

  const onConfirmPin = async () => {
    if (!token) return;
    if (pinEnabled) {
      if (!/^\d{4}$/.test(pin)) {
        setNotice({ tone: "error", text: "Enter your 4-digit transaction PIN." });
        return;
      }
      await submitPurchase({ transactionPin: pin });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setNotice({ tone: "error", text: "Create a 4-digit PIN." });
      return;
    }
    if (newPin !== confirmPin) {
      setNotice({ tone: "error", text: "PIN confirmation does not match." });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      await setTransactionPin(newPin, token);
      setPinEnabled(true);
      await submitPurchase({ transactionPin: newPin });
    } catch (e) {
      setNotice({ tone: "error", text: e?.message || "Failed to set transaction PIN." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>Buy Data</Title>
          <Sub>
            Buy at least 1 data bundle weekly to qualify to join a house and play the Weekly Card Game.
          </Sub>
        </div>
        <Helper type="button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Helper>
      </Header>

      <Card>
        {loadingPlans ? (
          <Notice>Loading data plans...</Notice>
        ) : null}

        <Row>
          <Label>Phone Number</Label>
          <Input
            value={phone}
            onChange={(e) => {
              setPhone(normalizePhone(e.target.value));
              setNotice(null);
            }}
            placeholder="08012345678"
            inputMode="numeric"
            maxLength={11}
            disabled={busy}
          />
          {user?.phoneNumber ? (
            <HelperRow>
              <Helper
                type="button"
                onClick={() => setPhone(normalizePhone(user.phoneNumber))}
                disabled={busy}
              >
                Use my profile number
              </Helper>
            </HelperRow>
          ) : null}
        </Row>

        <Row>
          <Label>Select Network</Label>
          <Select
            value={network}
            onChange={(e) => {
              setNetwork(e.target.value);
              setPlanId("");
              setNotice(null);
            }}
            disabled={busy}
          >
            <option value="">Choose network</option>
            {networks.map((n) => (
              <option key={`net-${n}`} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Row>

        <Row>
          <Label>Select Data Plan</Label>
          <Select
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value);
              setNotice(null);
            }}
            disabled={busy || !network}
          >
            <option value="">Choose data plan</option>
            {filteredPlans.map((p) => (
              <option key={p.plan_id} value={p.plan_id}>
                {p.name || p.plan_name || p.plan_id} — ₦{Number(p.amount || 0).toLocaleString()}
              </option>
            ))}
          </Select>
        </Row>

        {selectedPlan?.amount ? (
          <Price>
            <PriceLabel>Plan Amount</PriceLabel>
            <PriceValue>₦{Number(selectedPlan.amount || 0).toLocaleString()}</PriceValue>
          </Price>
        ) : null}

        {notice ? <Notice $tone={notice.tone}>{notice.text}</Notice> : null}

        <Primary type="button" disabled={busy || Boolean(validate())} onClick={onPay}>
          {busy ? "Processing..." : "Pay Now"}
        </Primary>
      </Card>

      {pinModalOpen ? (
        <ModalBackdrop>
          <ModalCard>
            <h2 style={{ margin: 0 }}>Authorize Purchase</h2>
            <p style={{ margin: 0, color: "#5b6475" }}>
              {pinEnabled
                ? "Enter your 4-digit transaction PIN to complete this data purchase."
                : "Create a new 4-digit transaction PIN to continue."}
            </p>

            {pinEnabled ? (
              <Row>
                <Label>Transaction PIN</Label>
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="****"
                  inputMode="numeric"
                  maxLength={4}
                  disabled={busy}
                />
              </Row>
            ) : (
              <>
                <Row>
                  <Label>New PIN</Label>
                  <Input
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="****"
                    inputMode="numeric"
                    maxLength={4}
                    disabled={busy}
                  />
                </Row>
                <Row>
                  <Label>Confirm PIN</Label>
                  <Input
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="****"
                    inputMode="numeric"
                    maxLength={4}
                    disabled={busy}
                  />
                </Row>
              </>
            )}

            <ModalActions>
              <Ghost type="button" onClick={() => setPinModalOpen(false)} disabled={busy}>
                Cancel
              </Ghost>
              <Primary type="button" onClick={onConfirmPin} disabled={busy}>
                {busy ? "Please wait..." : "Continue"}
              </Primary>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      ) : null}
    </Wrapper>
  );
}
