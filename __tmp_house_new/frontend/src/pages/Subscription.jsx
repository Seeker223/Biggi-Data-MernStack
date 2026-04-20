import styled from "styled-components";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/Container";
import { getAuthToken } from "../utils/auth";
import { useAuth } from "../utils/AuthContext";
import {
  getSubscriptionStatus,
  subscribe,
  cancelSubscription,
  renewSubscription,
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

const SubscriptionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 24px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  margin-top: 24px;
  display: grid;
  gap: 20px;
`;

const PriceSection = styled.div`
  display: grid;
  gap: 12px;
  align-items: center;
`;

const PriceTag = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
`;

const PriceLabel = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 14px;
  background: ${({ $active, theme }) =>
    $active ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)"};
  color: ${({ $active }) => ($active ? "#22c55e" : "#ef4444")};
`;

const SubscriptionDetails = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.soft};
  border-radius: 12px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailLabel = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const DetailValue = styled.div`
  font-weight: 600;
`;

const Features = styled.div`
  display: grid;
  gap: 12px;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
`;

const FeatureCheck = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: grid;
  place-items: center;
  font-size: 12px;
  flex-shrink: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  font-weight: 600;
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  flex: 1;
  min-width: 150px;
`;

const SecondaryButton = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  color: inherit;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  min-width: 150px;
`;

const Message = styled.div`
  padding: 12px 16px;
  border-radius: 12px;
  margin-top: 12px;
  font-size: 14px;
  ${({ $type, theme }) => {
    if ($type === "success") {
      return `
        background: rgba(34, 197, 94, 0.12);
        color: #16a34a;
        border: 1px solid rgba(34, 197, 94, 0.3);
      `;
    }
    if ($type === "error") {
      return `
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
      `;
    }
    return `
      background: rgba(59, 130, 246, 0.12);
      color: #2563eb;
      border: 1px solid rgba(59, 130, 246, 0.3);
    `;
  }}
`;

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    getSubscriptionStatus(token)
      .then((data) => {
        setSubscription(data.subscription);
        setIsActive(data.isActive);
      })
      .catch((err) => {
        setError(err.message || "Failed to load subscription status");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleSubscribe = () => {
    if (!user) return;
    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = getAuthToken();
    subscribe({ autoRenew: true }, token)
      .then((data) => {
        setSubscription(data.subscription);
        setIsActive(true);
        setSuccess(data.message || "Subscription activated successfully!");
      })
      .catch((err) => {
        setError(err.message || "Failed to subscribe");
      })
      .finally(() => setActionLoading(false));
  };

  const handleCancel = () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = getAuthToken();
    cancelSubscription(token)
      .then((data) => {
        setSubscription(data.subscription);
        setIsActive(false);
        setSuccess("Subscription cancelled successfully");
      })
      .catch((err) => {
        setError(err.message || "Failed to cancel subscription");
      })
      .finally(() => setActionLoading(false));
  };

  const handleRenew = () => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    const token = getAuthToken();
    renewSubscription(token)
      .then((data) => {
        setSubscription(data.subscription);
        setIsActive(true);
        setSuccess(data.message || "Subscription renewed successfully!");
      })
      .catch((err) => {
        setError(err.message || "Failed to renew subscription");
      })
      .finally(() => setActionLoading(false));
  };

  if (loading) {
    return (
      <Container>
        <PageHeader>
          <p style={{ color: "#5b6475" }}>Loading subscription status...</p>
        </PageHeader>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <PageHeader>
          <Title>Biggi House Subscription</Title>
          <Sub>Join the Biggi House community with a weekly subscription</Sub>
        </PageHeader>

        <SubscriptionCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <PriceSection>
                <PriceTag>₦50</PriceTag>
                <PriceLabel>per week</PriceLabel>
              </PriceSection>
            </div>
            <StatusBadge $active={isActive}>
              {isActive ? "✓ Active" : "Inactive"}
            </StatusBadge>
          </div>

          {isActive && subscription && (
            <SubscriptionDetails>
              <DetailRow>
                <DetailLabel>Status</DetailLabel>
                <DetailValue>Active</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Started</DetailLabel>
                <DetailValue>
                  {subscription.startDate
                    ? new Date(subscription.startDate).toLocaleDateString()
                    : "N/A"}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Renewal Date</DetailLabel>
                <DetailValue>
                  {subscription.renewalDate
                    ? new Date(subscription.renewalDate).toLocaleDateString()
                    : "N/A"}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Auto-Renew</DetailLabel>
                <DetailValue>{subscription.autoRenew ? "Enabled" : "Disabled"}</DetailValue>
              </DetailRow>
            </SubscriptionDetails>
          )}

          <Features>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>What you get:</div>
            <FeatureItem>
              <FeatureCheck>✓</FeatureCheck>
              <span>Access to all available houses</span>
            </FeatureItem>
            <FeatureItem>
              <FeatureCheck>✓</FeatureCheck>
              <span>Participate in house pooling cycles</span>
            </FeatureItem>
            <FeatureItem>
              <FeatureCheck>✓</FeatureCheck>
              <span>Weekly savings opportunities</span>
            </FeatureItem>
            <FeatureItem>
              <FeatureCheck>✓</FeatureCheck>
              <span>Community support and updates</span>
            </FeatureItem>
          </Features>

          <Actions>
            {!isActive ? (
              <PrimaryButton onClick={handleSubscribe} disabled={actionLoading}>
                {actionLoading ? "Processing..." : "Subscribe Now"}
              </PrimaryButton>
            ) : (
              <>
                <SecondaryButton onClick={handleCancel} disabled={actionLoading}>
                  {actionLoading ? "Processing..." : "Cancel Subscription"}
                </SecondaryButton>
                {subscription?.renewalDate && new Date(subscription.renewalDate) < new Date() && (
                  <PrimaryButton onClick={handleRenew} disabled={actionLoading}>
                    {actionLoading ? "Processing..." : "Renew Now"}
                  </PrimaryButton>
                )}
              </>
            )}
          </Actions>

          {error && <Message $type="error">{error}</Message>}
          {success && <Message $type="success">{success}</Message>}
        </SubscriptionCard>
      </Container>
    </>
  );
}
