// frontend/src/pages/dashboard/RedeemScreen.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronLeft } from 'lucide-react';

const RedeemScreen = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(-1)}>
          <ChevronLeft size={26} />
        </BackButton>
        <HeaderTitle>Redeem Rewards</HeaderTitle>
        <div style={{ width: '26px' }} />
      </Header>
      
      <Content>
        <h2>Coming Soon</h2>
        <p>Reward redemption functionality will be available soon.</p>
      </Content>
    </Container>
  );
};

export default RedeemScreen;

const Container = styled.div`
  min-height: 100vh;
  background-color: #fff;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  
  &:hover {
    opacity: 0.7;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #000;
  margin: 0;
`;

const Content = styled.div`
  padding: 40px 20px;
  text-align: center;
`;