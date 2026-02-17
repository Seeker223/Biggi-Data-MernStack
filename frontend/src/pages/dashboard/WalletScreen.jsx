import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft } from "lucide-react";

const WalletScreen = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <Container>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </BackButton>
          <Title>Wallet</Title>
          <Spacer />
        </Header>

        <Card>
          <PrimaryButton onClick={() => navigate("/deposit")}>Deposit Funds</PrimaryButton>
          <PrimaryButton onClick={() => navigate("/withdraw")}>Withdraw Funds</PrimaryButton>
          <PrimaryButton onClick={() => navigate("/redeem")}>Redeem Rewards</PrimaryButton>
        </Card>
      </Container>
    </Page>
  );
};

export default WalletScreen;

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
  border-radius: 8px;
  width: 34px;
  height: 34px;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
`;

const Spacer = styled.div`
  width: 34px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  font-weight: 700;
  color: #fff;
  background: #FF7A00;
`;
