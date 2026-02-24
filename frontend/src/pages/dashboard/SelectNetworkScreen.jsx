import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, ChevronRight, Wifi } from "lucide-react";

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
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </BackBtn>
          <Title>Select Network</Title>
          <HeaderSpacer />
        </Header>

        {NETWORKS.map((item) => (
          <Item key={item.code} onClick={() => onSelect(item)}>
            <ItemLeft>
              <ItemIcon>
                <Wifi size={16} />
              </ItemIcon>
              <span>{item.label}</span>
            </ItemLeft>
            <ItemRight>
              <ChooseText>Choose</ChooseText>
              <ChevronRight size={16} />
            </ItemRight>
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
  padding: 0;
  background: #fff;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const BackBtn = styled.button`
  border: 0;
  background: transparent;
  border-radius: 8px;
  color: #fff;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  color: #fff;
`;

const HeaderSpacer = styled.div`
  width: 32px;
  height: 32px;
`;

const Item = styled.button`
  width: 100%;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  cursor: pointer;
  margin-left: 16px;
  margin-right: 16px;
`;

const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #111;
  font-weight: 700;
`;

const ItemIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: #ff7a0015;
  color: #ff7a00;
  display: grid;
  place-items: center;
`;

const ItemRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
`;

const ChooseText = styled.span`
  font-size: 12px;
  font-weight: 700;
`;
