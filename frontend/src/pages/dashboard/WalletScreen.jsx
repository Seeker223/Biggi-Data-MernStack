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
  background: #fff;
  display: flex;
  justify-content: center;
  padding: 0;
`;

const Container = styled.div`
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const BackButton = styled.button`
  border: none;
  background: #fff;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  cursor: pointer;
  color: #ff7a00;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  color: #fff;
`;

const Spacer = styled.div`
  width: 34px;
`;

const Card = styled.div`
  margin: 0 16px;
  background: #fff;
  border: 1px solid #efefef;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
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
