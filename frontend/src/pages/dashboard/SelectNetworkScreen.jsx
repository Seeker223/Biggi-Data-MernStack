import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

const NETWORKS = [
  { code: "mtn", label: "MTN" },
  { code: "airtel", label: "Airtel" },
  { code: "glo", label: "Glo" },
  { code: "9mobile", label: "9mobile" },
];

const SelectNetworkScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/buy-data";

  const onSelect = (selectedNetwork) => {
    navigate("/select-plan", { state: { selectedNetwork, returnTo } });
  };

  return (
    <Wrap>
      <Card>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>Back</BackBtn>
          <Title>Select Network</Title>
        </Header>

        {NETWORKS.map((item) => (
          <Item key={item.code} onClick={() => onSelect(item)}>
            <span>{item.label}</span>
            <span>Choose</span>
          </Item>
        ))}
      </Card>
    </Wrap>
  );
};

export default SelectNetworkScreen;

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 24px 14px;
  background: #fff;
`;

const Card = styled.div`
  width: 100%;
  max-width: 460px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const BackBtn = styled.button`
  border: 0;
  background: #f1f1f1;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
`;

const Item = styled.button`
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f8f8;
  cursor: pointer;
`;
