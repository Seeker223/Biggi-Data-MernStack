import React, { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, History, RefreshCcw, Ticket, Trophy } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import BrandLoader from "../../components/BrandLoader";
import { toLetters } from "../../utils/drawLetters";

const DailyHistoryScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser, loading } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);

  const history = useMemo(() => {
    const items = Array.isArray(user?.dailyNumberDraw) ? user.dailyNumberDraw : [];
    return items
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser?.();
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const playAgain = () => {
    const tickets = Number(user?.tickets || 0);
    if (tickets <= 0) {
      navigate("/deposit");
      return;
    }
    if (FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM) {
      navigate("/");
      return;
    }
    navigate("/daily-draw");
  };

  if (loading) {
    return (
      <Page>
        <BrandLoader text="Loading Biggi Data..." />
      </Page>
    );
  }

  return (
    <Page>
      <Container>
        <Header>
          <IconButton onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={20} />
          </IconButton>
          <Title>Weekly Plays History</Title>
          <IconButton onClick={onRefresh} aria-label="Refresh">
            <RefreshCcw size={18} />
          </IconButton>
        </Header>

        <Summary>
          <SummaryText>
            Total plays: <strong>{history.length}</strong>
          </SummaryText>
          <Primary onClick={playAgain} disabled={(user?.tickets || 0) <= 0}>
            Play Now ({user?.tickets || 0} tickets)
          </Primary>
        </Summary>

        {refreshing && <SmallText>Refreshing...</SmallText>}

        {history.length === 0 ? (
          <EmptyCard>
            <History size={32} />
            <h3>No plays yet</h3>
            <p>Buy a data bundle to get tickets and start playing weekly draws.</p>
            <Primary onClick={() => navigate("/buy-data")}>Buy Bundle</Primary>
          </EmptyCard>
        ) : (
          <List>
            {history.map((item, idx) => {
              const picked = toLetters(item.numbers);
              const result = toLetters(item.result);
              const isWinner = Boolean(item.isWinner);
              const matched = result.length
                ? picked.filter((n) => result.includes(n)).length
                : 0;
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleString()
                : "Unknown date";

              return (
                <Card key={item._id || `${dateStr}-${idx}`} $winner={isWinner}>
                  <Left>
                    {isWinner ? (
                      <Trophy size={24} color="#a16207" />
                    ) : (
                      <Ticket size={24} color="#374151" />
                    )}
                  </Left>
                  <Middle>
                    <CardTitle>{isWinner ? "Winning Ticket" : "Play"}</CardTitle>
                    <DateText>{dateStr}</DateText>

                    <Row>
                      <Label>Picked:</Label>
                      <NumberWrap>
                        {picked.map((n) => (
                          <Bubble key={`p-${item._id || idx}-${n}`} $match={result.includes(n)}>
                            {n}
                          </Bubble>
                        ))}
                      </NumberWrap>
                    </Row>

                    {result.length > 0 && (
                      <Row>
                        <Label>Draw:</Label>
                        <NumberWrap>
                          {result.map((n) => (
                            <ResultBubble key={`r-${item._id || idx}-${n}`}>{n}</ResultBubble>
                          ))}
                        </NumberWrap>
                        <MatchText>
                          {matched}/{picked.length} matched
                        </MatchText>
                      </Row>
                    )}
                  </Middle>
                  <Right>
                    {isWinner ? <WinBadge>WIN</WinBadge> : <SmallBtn onClick={playAgain}>Play Again</SmallBtn>}
                  </Right>
                </Card>
              );
            })}
          </List>
        )}
      </Container>
    </Page>
  );
};

export default DailyHistoryScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #0a0a0a;
  padding: 16px;
`;

const Container = styled.div`
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Title = styled.h1`
  margin: 0;
  color: #ff8c00;
  font-size: 22px;
  font-weight: 800;
`;

const IconButton = styled.button`
  border: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Summary = styled.div`
  background: #111;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const SummaryText = styled.p`
  margin: 0;
  color: #fff;
`;

const Primary = styled.button`
  border: 0;
  border-radius: 10px;
  padding: 9px 14px;
  background: #ff8c00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    background: #999;
    cursor: not-allowed;
  }
`;

const SmallText = styled.p`
  margin: 8px 2px 0;
  color: #ddd;
  font-size: 13px;
`;

const EmptyCard = styled.div`
  margin-top: 14px;
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  h3 {
    margin: 10px 0 6px;
  }
  p {
    margin: 0 0 12px;
    color: #555;
  }
`;

const List = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Card = styled.div`
  background: ${(p) => (p.$winner ? "#fff8e1" : "#fff")};
  border: ${(p) => (p.$winner ? "1px solid #facc15" : "none")};
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const Left = styled.div`
  width: 44px;
  display: flex;
  justify-content: center;
  padding-top: 4px;
`;

const Middle = styled.div`
  flex: 1;
`;

const Right = styled.div`
  width: 90px;
  display: flex;
  justify-content: flex-end;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: #222;
`;

const DateText = styled.p`
  margin: 4px 0 0;
  color: #666;
  font-size: 12px;
`;

const Row = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Label = styled.span`
  font-size: 13px;
  color: #333;
`;

const NumberWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Bubble = styled.span`
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  background: ${(p) => (p.$match ? "#ff8c00" : "#eee")};
  color: ${(p) => (p.$match ? "#fff" : "#111")};
`;

const ResultBubble = styled.span`
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  background: #f3f4f6;
  color: #111;
`;

const MatchText = styled.span`
  margin-left: 4px;
  font-size: 12px;
  color: #666;
`;

const SmallBtn = styled.button`
  border: 0;
  border-radius: 8px;
  padding: 6px 10px;
  background: #ff8c00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;

const WinBadge = styled.span`
  background: #facc15;
  color: #111;
  font-size: 12px;
  font-weight: 800;
  border-radius: 8px;
  padding: 6px 10px;
`;
