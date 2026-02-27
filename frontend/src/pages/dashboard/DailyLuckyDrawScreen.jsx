import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Trophy, Ticket, Clock, ChevronLeft } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { FEATURE_FLAGS } from "../../constants/featureFlags";

const DailyLuckyDrawScreen = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const tickets = Number(user?.tickets || 0);

  return (
    <Page>
      <Container>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </BackButton>
          <Title>Daily Lucky Draw</Title>
          <div style={{ width: 22 }} />
        </Header>

        <Hero>
          <Trophy size={34} color="#fff" />
          <HeroTitle>{FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM ? "Prize Hidden" : "Win N10,000 Daily"}</HeroTitle>
          <HeroSub>Draw time: 7:30 PM every day</HeroSub>
        </Hero>

        <Card>
          <Stat>
            <Ticket size={18} color="#FF7A00" />
            <span>Available Tickets: {tickets}</span>
          </Stat>
          <Stat>
            <Clock size={18} color="#FF7A00" />
            <span>Use tickets to play daily draw</span>
          </Stat>

          <Primary onClick={() => navigate("/daily-game")} disabled={tickets <= 0 || FEATURE_FLAGS.DISABLE_GAME_AND_REDEEM}>
            Play Daily Draw
          </Primary>
          <Secondary onClick={() => navigate("/buy-data")}>Get More Tickets (Buy Data)</Secondary>
        </Card>
      </Container>
    </Page>
  );
};

export default DailyLuckyDrawScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  justify-content: center;
  padding: 20px;
`;
const Container = styled.div`
  width: 100%;
  max-width: 440px;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;
const BackButton = styled.button`
  border: none;
  background: #fff;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
`;
const Title = styled.h1`
  margin: 0;
  font-size: 20px;
`;
const Hero = styled.div`
  background: linear-gradient(135deg, #ff7a00 0%, #e56a00 100%);
  border-radius: 18px;
  padding: 20px;
  color: #fff;
  text-align: center;
`;
const HeroTitle = styled.h2`
  margin: 8px 0 4px;
  font-size: 24px;
`;
const HeroSub = styled.p`
  margin: 0;
  opacity: 0.95;
`;
const Card = styled.div`
  margin-top: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;
const Stat = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  color: #333;
`;
const Primary = styled.button`
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 13px;
  margin-top: 8px;
  background: #ff7a00;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;
const Secondary = styled.button`
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 13px;
  margin-top: 8px;
  background: #111;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;
