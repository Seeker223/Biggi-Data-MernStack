import React, { useCallback, useContext, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, History, RefreshCcw, Ticket, Trophy } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";
import BrandLoader from "../../components/BrandLoader";
import { toLetters } from "../../utils/drawLetters";
import { getMerchantWeeklyWinners } from "../../services/api";

const DailyHistoryScreen = () => {
  const navigate = useNavigate();
  const { user, refreshUser, loading } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [winners, setWinners] = useState([]);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [winnersError, setWinnersError] = useState("");
  const [winnersMeta, setWinnersMeta] = useState({
    week: "",
    revealReady: false,
    revealAt: "",
  });

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

  const isMerchantRole = String(user?.userRole || "").toLowerCase() === "merchant";

  const loadWinners = useCallback(() => {
    let mounted = true;
    setWinnersLoading(true);
    setWinnersError("");
    getMerchantWeeklyWinners()
      .then((res) => {
        if (!mounted) return;
        const payload = res?.data || {};
        setWinners(Array.isArray(payload.winners) ? payload.winners : []);
        setWinnersMeta({
          week: payload.week || "",
          revealReady: Boolean(payload.revealReady),
          revealAt: payload.revealAt || "",
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setWinnersError(err?.response?.data?.message || "Unable to load weekly winners.");
      })
      .finally(() => {
        if (!mounted) return;
        setWinnersLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isMerchantRole || activeTab !== "winners") return;
    const cleanup = loadWinners();
    return cleanup;
  }, [activeTab, isMerchantRole, loadWinners]);

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
          <Title>{activeTab === "winners" ? "Monthly Winners" : "Weekly Plays History"}</Title>
          <IconButton onClick={onRefresh} aria-label="Refresh">
            <RefreshCcw size={18} />
          </IconButton>
        </Header>

        {isMerchantRole && (
          <Tabs>
            <TabButton
              type="button"
              $active={activeTab === "history"}
              onClick={() => setActiveTab("history")}
            >
              My Plays
            </TabButton>
            <TabButton
              type="button"
              $active={activeTab === "winners"}
              onClick={() => setActiveTab("winners")}
            >
              Monthly Winners
            </TabButton>
          </Tabs>
        )}

        <Summary>
          {activeTab === "winners" ? (
            <SummaryText>
              Winners this month: <strong>{winners.length}</strong>
            </SummaryText>
          ) : (
            <SummaryText>
              Total plays: <strong>{history.length}</strong>
            </SummaryText>
          )}
          <Primary onClick={playAgain} disabled={(user?.tickets || 0) <= 0}>
            Play Now ({user?.tickets || 0} tickets)
          </Primary>
        </Summary>

        {refreshing && <SmallText>Refreshing...</SmallText>}

        {activeTab === "winners" ? (
          winnersLoading ? (
            <SmallText>Loading monthly winners...</SmallText>
          ) : winnersError ? (
            <EmptyCard>
              <History size={32} />
              <h3>Unable to load winners</h3>
              <p>{winnersError}</p>
              <Primary onClick={loadWinners}>Try Again</Primary>
            </EmptyCard>
          ) : !winnersMeta.revealReady ? (
            <EmptyCard>
              <Trophy size={32} />
              <h3>Results not yet released</h3>
              <p>
                Monthly winners will be revealed{" "}
                {winnersMeta.revealAt
                  ? `on ${new Date(winnersMeta.revealAt).toLocaleDateString()}`
                  : "at month end"}
                .
              </p>
            </EmptyCard>
          ) : winners.length === 0 ? (
            <EmptyCard>
              <Trophy size={32} />
              <h3>No winners yet</h3>
              <p>Keep playing to appear on the monthly winners list.</p>
            </EmptyCard>
          ) : (
            <List>
              {winners.map((item, idx) => {
                const picked = toLetters(item.numbers);
                const result = toLetters(item.result);
                const matched = result.length
                  ? picked.filter((n) => result.includes(n)).length
                  : 0;
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "Unknown date";

                return (
                  <Card key={item.gameId || `${dateStr}-${idx}`} $winner>
                    <Left>
                      <Trophy size={24} color="#a16207" />
                    </Left>
                    <Middle>
                      <CardTitle>{item.username || "Winner"}</CardTitle>
                      <DateText>{dateStr}</DateText>
                      <Row>
                        <Label>Picked:</Label>
                        <NumberWrap>
                          {picked.map((n) => (
                            <Bubble key={`w-p-${item.gameId || idx}-${n}`} $match>
                              {n}
                            </Bubble>
                          ))}
                        </NumberWrap>
                      </Row>
                      <Row>
                        <Label>Draw:</Label>
                        <NumberWrap>
                          {result.map((n) => (
                            <ResultBubble key={`w-r-${item.gameId || idx}-${n}`}>{n}</ResultBubble>
                          ))}
                        </NumberWrap>
                        <MatchText>
                          {matched}/{picked.length} matched
                        </MatchText>
                      </Row>
                    </Middle>
                    <Right>
                      <WinBadge>WIN</WinBadge>
                    </Right>
                  </Card>
                );
              })}
            </List>
          )
        ) : history.length === 0 ? (
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
              const hasResult = result.length > 0;
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

                    {!hasResult && (
                      <PendingText>Pending until month end</PendingText>
                    )}

                    {hasResult && (
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
  background: #fff;
  padding: 0;
`;

const Container = styled.div`
  width: 100%;
  max-width: 440px;
  margin: 0 auto;
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
  color: #fff;
  font-size: 20px;
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
  color: #ff7a00;
  background: #fff;
`;

const Tabs = styled.div`
  display: flex;
  gap: 10px;
  padding: 0 16px 10px;
`;

const TabButton = styled.button`
  flex: 1;
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  background: ${(p) => (p.$active ? "#ff8c00" : "#f1f1f1")};
  color: ${(p) => (p.$active ? "#fff" : "#333")};
`;

const Summary = styled.div`
  background: #f9f9f9;
  border-radius: 16px;
  padding: 14px;
  margin: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const SummaryText = styled.p`
  margin: 0;
  color: #111;
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
  margin: 8px 18px 0;
  color: #666;
  font-size: 13px;
`;

const EmptyCard = styled.div`
  margin-top: 14px;
  margin-left: 16px;
  margin-right: 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
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
  margin-left: 16px;
  margin-right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 20px;
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

const PendingText = styled.p`
  margin: 8px 0 0;
  color: #d97706;
  font-size: 12px;
  font-weight: 700;
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
