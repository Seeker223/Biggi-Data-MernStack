import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ChevronLeft, Trophy, ShoppingCart, RefreshCw } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { getTopPurchasesLeaderboard } from "../../services/api";

const TopPurchasersScreen = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [monthLabel, setMonthLabel] = useState("");
  const [myPurchases, setMyPurchases] = useState(0);
  const [threshold, setThreshold] = useState(10);

  const username = user?.username || "User";

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getTopPurchasesLeaderboard();
      const payload = res?.data || {};
      const rows = Array.isArray(payload.leaderboard) ? payload.leaderboard : [];
      setLeaderboard(rows);
      setMyPurchases(Number(payload.myPurchases || 0));
      setThreshold(Number(payload.threshold || 10));
      if (payload?.month) {
        const date = new Date(`${payload.month}-01T00:00:00`);
        const label = date.toLocaleString(undefined, { month: "long", year: "numeric" });
        setMonthLabel(label);
      } else {
        setMonthLabel("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load top purchases leaderboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const emptyState = !loading && leaderboard.length === 0;
  const headerSubtitle = useMemo(() => {
    if (monthLabel) return `Top purchasers for ${monthLabel}`;
    return "Top purchasers this month";
  }, [monthLabel]);

  return (
    <Page>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <ChevronLeft size={22} />
        </BackButton>
        <HeaderText>
          <Title>Top Purchases</Title>
          <Subtitle>{headerSubtitle}</Subtitle>
        </HeaderText>
        <RefreshButton onClick={loadLeaderboard} disabled={loading}>
          <RefreshCw size={18} />
        </RefreshButton>
      </Header>

      <HeroCard>
        <HeroLeft>
          <HeroTitle>{username}</HeroTitle>
          <HeroMeta>
            Monthly purchases: <strong>{myPurchases}</strong>
          </HeroMeta>
          <HeroMeta>Need {threshold}+ purchases to qualify.</HeroMeta>
        </HeroLeft>
        <HeroIconWrap>
          <Trophy size={26} />
        </HeroIconWrap>
      </HeroCard>

      {error ? <ErrorBox>{error}</ErrorBox> : null}

      {loading ? (
        <LoadingBox>Loading leaderboard...</LoadingBox>
      ) : emptyState ? (
        <EmptyState>
          <ShoppingCart size={26} />
          <p>No qualified users yet this month.</p>
          <span>Make {threshold}+ data purchases to appear here.</span>
        </EmptyState>
      ) : (
        <List>
          {leaderboard.map((entry) => (
            <Row key={`${entry.userId}-${entry.rank}`}>
              <RankBadge>{entry.rank}</RankBadge>
              <Avatar src={entry.photo || fallbackAvatar} alt={entry.username || "User"} />
              <UserInfo>
                <UserName>{entry.username || "User"}</UserName>
                <UserMeta>{entry.state || "Nigeria"}</UserMeta>
              </UserInfo>
              <CountPill>{entry.purchasesCount} purchases</CountPill>
            </Row>
          ))}
        </List>
      )}
    </Page>
  );
};

export default TopPurchasersScreen;

const fallbackAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const Page = styled.div`
  min-height: 100vh;
  background: #0b0b0b;
  color: #fff;
  padding: 18px 16px 120px;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
`;

const BackButton = styled.button`
  background: #111;
  border: 1px solid #232323;
  color: #fff;
  border-radius: 12px;
  height: 40px;
  width: 40px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const RefreshButton = styled(BackButton)``;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 12px;
  color: #ffb26b;
`;

const HeroCard = styled.div`
  background: linear-gradient(135deg, #ff7a00, #ff4d00);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  box-shadow: 0 10px 24px rgba(255, 122, 0, 0.25);
`;

const HeroLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HeroTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
`;

const HeroMeta = styled.p`
  margin: 0;
  font-size: 12px;
  color: #fff;
  opacity: 0.9;
  strong {
    font-size: 14px;
  }
`;

const HeroIconWrap = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  place-items: center;
`;

const LoadingBox = styled.div`
  background: #151515;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  color: #ffb26b;
  font-weight: 700;
`;

const ErrorBox = styled.div`
  background: #2b0e0e;
  color: #ff8f8f;
  border: 1px solid #6b1c1c;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 600;
`;

const EmptyState = styled.div`
  background: #141414;
  border-radius: 14px;
  padding: 24px 18px;
  display: grid;
  gap: 6px;
  justify-items: center;
  text-align: center;
  color: #ddd;
  p {
    margin: 0;
    font-weight: 700;
  }
  span {
    font-size: 12px;
    color: #999;
  }
`;

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const Row = styled.div`
  background: #121212;
  border: 1px solid #232323;
  border-radius: 14px;
  padding: 12px;
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 12px;
  align-items: center;
`;

const RankBadge = styled.div`
  background: #ff7a00;
  color: #fff;
  font-weight: 800;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: grid;
  place-items: center;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid rgba(255, 122, 0, 0.4);
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const UserName = styled.span`
  font-weight: 700;
  font-size: 14px;
  color: #fff;
`;

const UserMeta = styled.span`
  font-size: 12px;
  color: #9a9a9a;
`;

const CountPill = styled.div`
  background: rgba(255, 122, 0, 0.18);
  color: #ffb26b;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
`;
