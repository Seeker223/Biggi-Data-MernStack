import React, { useContext, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/biggiData2.png";
import { AuthContext } from "../context/AuthContext";

const LaunchScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <Page>
      <Content>
        <Logo src={logo} alt="Biggi Data" />
        <TextBlock>
          <Brand>Biggi Data</Brand>
          <Title>Biggi Reward</Title>
          <Subtitle>Buy Biggi Data, And Win Biggi Rewards</Subtitle>
          <Note>Daily, Weekly, Monthly</Note>
        </TextBlock>

        <Actions>
          <PrimaryButton onClick={() => navigate("/login")}>Log In</PrimaryButton>
          <SecondaryButton onClick={() => navigate("/signup")}>Sign Up</SecondaryButton>
        </Actions>
      </Content>
    </Page>
  );
};

export default LaunchScreen;

const Page = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8vh 8vw;
`;

const Content = styled.div`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.img`
  width: min(80vw, 360px);
  height: auto;
  margin-bottom: 24px;
`;

const TextBlock = styled.div`
  text-align: center;
  margin-bottom: 28px;
`;

const Brand = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #f97316;
  margin-bottom: 4px;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #334155;
  margin: 0 0 4px 0;
`;

const Note = styled.p`
  font-size: 13px;
  color: #475569;
  font-style: italic;
  margin: 0;
`;

const Actions = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
`;

const PrimaryButton = styled.button`
  width: 85%;
  padding: 14px 0;
  border-radius: 999px;
  border: none;
  background: #0f172a;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  width: 85%;
  padding: 14px 0;
  border-radius: 999px;
  border: none;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
`;
