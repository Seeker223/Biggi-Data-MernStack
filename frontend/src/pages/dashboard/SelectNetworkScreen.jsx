import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ArrowLeft,
  Info,
  Signal,
  Wifi,
  Smartphone,
} from "lucide-react";
import mtnLogo from "../../assets/images/mtn.png";
import airtelLogo from "../../assets/images/airtel.png";
import gloLogo from "../../assets/images/glo.png";
import mobile9Logo from "../../assets/images/9mobile.png";

const NETWORKS = [
  {
    code: "mtn",
    label: "MTN",
    description: "Largest network coverage",
    categories: ["SME", "GIFTING"],
    icon: Signal,
    logo: mtnLogo,
    color: "#f4be00",
    logoBg: "#fff7de",
  },
  {
    code: "airtel",
    label: "Airtel",
    description: "Fast 4G speeds",
    categories: ["SME", "GIFTING"],
    icon: Signal,
    logo: airtelLogo,
    color: "#de1c2f",
    logoBg: "#ffeef1",
  },
  {
    code: "glo",
    label: "Glo",
    description: "Affordable data plans",
    categories: ["SME", "GIFTING"],
    icon: Wifi,
    logo: gloLogo,
    color: "#1a9e2a",
    logoBg: "#ebfaee",
  },
  {
    // Backend uses "etisalat" for 9mobile plans.
    // Keep label as "9mobile" for users, but send "etisalat" to API routes.
    code: "etisalat",
    label: "9mobile",
    description: "Reliable network service",
    categories: ["SME", "GIFTING"],
    icon: Smartphone,
    logo: mobile9Logo,
    color: "#007e59",
    logoBg: "#fff3e8",
  },
];

const SelectNetworkScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/buy-data";
  const phone = location.state?.phone || "";

  const onSelect = (selectedNetwork) => {
    navigate("/select-plan", {
      state: {
        selectedNetwork: {
          code: selectedNetwork.code,
          label: selectedNetwork.label,
          network: selectedNetwork.label,
        },
        returnTo,
        phone,
      },
    });
  };

  return (
    <Wrap>
      <Container>
        <Hero>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={28} />
          </BackBtn>
          <HeroInner>
            <HeroBadge>
              <Wifi size={16} />
              <span>Data Bundles</span>
            </HeroBadge>
            <Title>Select Network</Title>
            <Subtitle>Choose your mobile network</Subtitle>
          </HeroInner>
        </Hero>

        <Body>
          <InfoCard>
            <Info size={20} />
            <InfoText>Select your network to view available data plans</InfoText>
          </InfoCard>

          <Grid>
            {NETWORKS.map((item) => {
              const ItemIcon = item.icon;
              return (
                <NetworkCard key={item.code} onClick={() => onSelect(item)}>
                  <NetworkLogoWrap $bg={item.logoBg}>
                    <NetworkLogo src={item.logo} alt={item.label} />
                  </NetworkLogoWrap>

                  <NetworkHeader>
                    <NetworkName>
                      <ItemIcon size={16} />
                      {item.label}
                    </NetworkName>
                    <Status>Available</Status>
                  </NetworkHeader>

                  <Description>{item.description}</Description>

                  <CategoryRow>
                    {item.categories.map((category) => (
                      <Category key={category} $color={item.color}>
                        {category}
                      </Category>
                    ))}
                  </CategoryRow>

                  <SelectBtn>Select</SelectBtn>
                </NetworkCard>
              );
            })}
          </Grid>
        </Body>
      </Container>
    </Wrap>
  );
};

export default SelectNetworkScreen;

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: #f8f8f8;
`;

const Container = styled.div`
  width: 100%;
  max-width: 460px;
  min-height: 100vh;
`;

const Hero = styled.div`
  background: linear-gradient(180deg, #ff8a00 0%, #ff6100 100%);
  border-bottom-left-radius: 44px;
  border-bottom-right-radius: 44px;
  padding: 12px 20px 30px;
`;

const BackBtn = styled.button`
  border: 0;
  background: transparent;
  border-radius: 10px;
  color: #fff;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const HeroInner = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 800;
  color: #fff;
  @media (max-width: 440px) {
    font-size: 22px;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
  font-weight: 500;
`;

const Body = styled.div`
  padding: 20px;
`;

const InfoCard = styled.div`
  border: 1px solid #d4e8f9;
  border-radius: 20px;
  background: #eef6ff;
  color: #0e5ea8;
  padding: 20px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 700;
`;

const Grid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
`;

const NetworkCard = styled.button`
  border: 1px solid #ececec;
  border-radius: 22px;
  background: #fff;
  padding: 18px 14px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NetworkLogoWrap = styled.div`
  width: 92px;
  height: 92px;
  margin: 4px auto;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: ${(p) => p.$bg};
`;

const NetworkLogo = styled.img`
  width: 64px;
  height: 64px;
  object-fit: contain;
`;

const NetworkHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const NetworkName = styled.h3`
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 22px;
  line-height: 1;
`;

const Status = styled.span`
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #666;
  background: #f1f1f1;
`;

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.25;
  text-align: center;
  color: #686868;
  min-height: 40px;
`;

const CategoryRow = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const Category = styled.span`
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: ${(p) => p.$color};
  background: ${(p) => `${p.$color}16`};
`;

const SelectBtn = styled.span`
  margin-top: 2px;
  width: 100%;
  border-radius: 14px;
  padding: 14px 10px;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #555;
  background: #efefef;
`;
