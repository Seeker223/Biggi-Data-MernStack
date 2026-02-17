import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Trophy } from "lucide-react";

const DailyDrawScreen = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <Container>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </BackButton>
          <Title>Daily Draw</Title>
          <Spacer />
        </Header>
        <Card>
          <Trophy size={42} color="#FF7A00" />
          <Text>Daily draw page is ready for integration.</Text>
          <Button onClick={() => navigate("/daily-game")}>Go to Daily Game</Button>
        </Card>
      </Container>
    </Page>
  );
};

export default DailyDrawScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  justify-content: center;
  padding: 20px;
`;
const Container = styled.div`width:100%;max-width:440px;`;
const Header = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;`;
const BackButton = styled.button`border:none;background:#fff;border-radius:8px;width:34px;height:34px;cursor:pointer;`;
const Title = styled.h1`margin:0;font-size:20px;`;
const Spacer = styled.div`width:34px;`;
const Card = styled.div`background:#fff;border-radius:14px;padding:24px;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,0.08);`;
const Text = styled.p`color:#555;line-height:1.5;`;
const Button = styled.button`border:none;border-radius:10px;background:#FF7A00;color:#fff;padding:12px 16px;font-weight:700;cursor:pointer;`;
