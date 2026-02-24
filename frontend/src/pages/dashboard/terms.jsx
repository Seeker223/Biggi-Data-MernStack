import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft } from "lucide-react";

export default function TermsScreen() {
  const navigate = useNavigate();

  return (
    <Page>
      <Container>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </BackBtn>
          <Title>Terms And Conditions</Title>
          <Spacer />
        </Header>

        <Card>
          <SectionTitle>Biggi Data Terms</SectionTitle>
          <Paragraph>
            By using Biggi Data, you agree to provide accurate account details and comply with applicable
            laws when purchasing data bundles, participating in weekly/monthly reward games, and using
            wallet services.
          </Paragraph>
          <Paragraph>
            All wallet transactions are subject to verification checks. Deposits, withdrawals, and rewards
            may be delayed for fraud prevention, system maintenance, or provider processing windows.
          </Paragraph>
          <Paragraph>
            Game and redeem features can be adjusted or paused based on compliance requirements. Abuse,
            duplicate accounts, or attempts to exploit rewards may result in suspension.
          </Paragraph>
        </Card>
      </Container>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const BackBtn = styled.button`
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #fff;
  color: #ff7a00;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
`;

const Spacer = styled.div`
  width: 32px;
  height: 32px;
`;

const Card = styled.div`
  margin: 16px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #efefef;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
`;

const SectionTitle = styled.h2`
  margin: 0 0 10px;
  font-size: 18px;
  color: #111;
`;

const Paragraph = styled.p`
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.55;
  color: #444;
`;

