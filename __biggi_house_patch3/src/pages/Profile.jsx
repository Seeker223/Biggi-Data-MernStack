import styled from "styled-components";
import { useCallback, useEffect, useMemo, useState } from "react";
import Container from "../components/Container";
import { getAuthToken, setRefreshToken } from "../utils/auth";
import { useAuth } from "../utils/AuthContext";
import { getBiggiHouseMemberships, getBiggiHouseWallet, getMe } from "../services/api";

const Wrapper = styled(Container)`
  padding: 40px 0 60px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 32px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.card};
  padding: 24px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Avatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: ${({ theme }) => theme.gradients.brand};
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 24px;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.muted};
`;

const Badge = styled.span`
  padding: 6px 12px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.soft};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 12px;
  font-weight: 600;
`;

const InfoList = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};
`;

const InfoValue = styled.span`
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 600;
  text-align: right;
`;

const HighlightStat = styled.div`
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.gradients.brandSoft};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-weight: 600;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 12px;
`;

const Activity = styled.ul`
  list-style: none;
  display: grid;
  gap: 12px;
`;

const ActivityItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.soft};
`;

const DetailList = styled.div`
  display: grid;
  gap: 12px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.muted};

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const DetailValue = styled.span`
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 600;
  text-align: right;
`;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profileUser, setProfileUser] = useState(user);
  const [wallet, setWallet] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = useMemo(() => getAuthToken(), []);

  const reload = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError("");

    Promise.all([
      getMe(token).then((data) => {
        if (data?.user) {
          setProfileUser(data.user);
          updateUser(data.user);
        }
        if (data?.refreshToken) setRefreshToken(data.refreshToken);
      }),
      getBiggiHouseWallet(token).then((data) => setWallet(data)),
      getBiggiHouseMemberships(token).then((data) => setMemberships(data || [])),
    ])
      .catch((err) => setError(err?.message || "Unable to load profile details."))
      .finally(() => setLoading(false));
  }, [token, updateUser]);

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

  const housesJoined = memberships.length;
  const displayName = profileUser?.name || profileUser?.username || "Member";
  const initials =
    displayName
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2) || "BH";

  const registrationNumber =
    profileUser?.referralCode ||
    `BH-${String(profileUser?.id || "").slice(-6).toUpperCase()}`;

  const formatDate = (value) => {
    if (!value) return "Not provided";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const primaryDetails = [
    ["Registration number", registrationNumber || "Pending"],
    ["Username", profileUser?.username || "Not provided"],
    ["Email address", profileUser?.email || "Not provided"],
    ["Phone number", profileUser?.phoneNumber || "Not provided"],
    ["State", profileUser?.state || "Not provided"],
    ["Date of birth", formatDate(profileUser?.birthDate)],
  ];

  const identityDetails = [
    ["NIN", profileUser?.nin || "Not provided"],
    ["Referral code", profileUser?.referralCode || "Not provided"],
    ["Referred by", profileUser?.referredByCode || "Not provided"],
    ["User role", profileUser?.userRole || profileUser?.role || "User"],
    ["Verification", profileUser?.isVerified ? "Verified" : "Pending"],
    ["Allowed apps", Array.isArray(profileUser?.allowedApps) ? profileUser.allowedApps.join(", ") : "Not set"],
  ];

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>Profile</Title>
          <Sub>Manage your account and view your participation details.</Sub>
          {loading && (
            <Sub style={{ marginTop: "10px" }}>Refreshing...</Sub>
          )}
          {error && (
            <Sub style={{ marginTop: "10px", color: "#c02626" }}>{error}</Sub>
          )}
        </div>
        <Badge>
          {profileUser?.isVerified ? "Verified member" : "Pending verification"}
        </Badge>
      </Header>

      <Grid>
        <Card>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Avatar>{initials.toUpperCase()}</Avatar>
            <div>
              <h3 style={{ marginBottom: "4px" }}>{displayName}</h3>
              <Sub>{profileUser?.email || "member@biggihouse.com"}</Sub>
            </div>
          </div>
          <InfoList>
            <InfoRow>
              <span>Membership status</span>
              <InfoValue>{profileUser?.isVerified ? "Active" : "Pending"}</InfoValue>
            </InfoRow>
            <InfoRow>
              <span>Joined houses</span>
              <InfoValue>{housesJoined}</InfoValue>
            </InfoRow>
            <InfoRow>
              <span>BiggiHouse wallet</span>
              <InfoValue>
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  maximumFractionDigits: 0,
                }).format(Number(wallet?.balance || 0))}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <span>Registration number</span>
              <InfoValue>{registrationNumber || "Pending"}</InfoValue>
            </InfoRow>
          </InfoList>
          <HighlightStat>
            <span>Total houses joined</span>
            <span>{housesJoined}</span>
          </HighlightStat>
        </Card>

        <Card>
          <SectionTitle>Recent activity</SectionTitle>
          {Array.isArray(wallet?.transactions) && wallet.transactions.length ? (
            <Activity>
              {wallet.transactions.slice(0, 5).map((tx) => (
                <ActivityItem key={tx.reference || tx._id || String(tx.date)}>
                  <span>
                    {tx.type === "deposit"
                      ? "Deposit"
                      : tx.type === "withdraw"
                      ? "Withdraw"
                      : "House contribution"}{" "}
                    {"\u00B7"}{" "}
                    {new Date(tx.date || Date.now()).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <strong>
                    {new Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      maximumFractionDigits: 0,
                    }).format(Number(tx.amount || 0))}
                  </strong>
                </ActivityItem>
              ))}
            </Activity>
          ) : (
            <Sub>No activity yet.</Sub>
          )}
        </Card>
      </Grid>

      <DetailsGrid>
        <Card>
          <SectionTitle>Registration Details</SectionTitle>
          <DetailList>
            {primaryDetails.map(([label, value]) => (
              <DetailRow key={label}>
                <span>{label}</span>
                <DetailValue>{value}</DetailValue>
              </DetailRow>
            ))}
          </DetailList>
        </Card>

        <Card>
          <SectionTitle>Identity And Access</SectionTitle>
          <DetailList>
            {identityDetails.map(([label, value]) => (
              <DetailRow key={label}>
                <span>{label}</span>
                <DetailValue>{value}</DetailValue>
              </DetailRow>
            ))}
          </DetailList>
        </Card>
      </DetailsGrid>
    </Wrapper>
  );
}
