import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "../components/Container";

const Wrapper = styled(Container)`
  padding: 40px 0 60px;
  max-width: 760px;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
`;

const Sub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
`;

const Grid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.card};
  display: grid;
  gap: 10px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  font-weight: 900;
  background: ${({ $color }) => `${$color}15`};
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => `${$color}30`};
`;

const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  display: inline-block;
`;

const Name = styled.div`
  font-weight: 1000;
`;

const Desc = styled.div`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 14px;
`;

const SelectText = styled.div`
  margin-top: 4px;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.primary};
`;

const NETWORKS = [
  {
    code: "mtn",
    label: "MTN",
    description: "Largest network coverage",
    color: "#f4be00",
  },
  {
    code: "airtel",
    label: "Airtel",
    description: "Fast 4G speeds",
    color: "#de1c2f",
  },
  {
    code: "glo",
    label: "Glo",
    description: "Affordable data plans",
    color: "#1a9e2a",
  },
  {
    code: "9mobile",
    label: "9mobile",
    description: "Reliable network service",
    color: "#007e59",
  },
];

export default function SelectNetwork() {
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
    <Wrapper>
      <Header>
        <Title>Select Network</Title>
        <Sub>Choose your mobile network to view available data plans.</Sub>
      </Header>

      <Grid>
        {NETWORKS.map((n) => (
            <Card key={n.code} type="button" onClick={() => onSelect(n)}>
              <TopRow>
                <Badge $color={n.color}>
                  <Dot $color={n.color} aria-hidden="true" />
                  <Name>{n.label}</Name>
                </Badge>
              </TopRow>
              <Desc>{n.description}</Desc>
              <SelectText>Select</SelectText>
            </Card>
          ))}
      </Grid>
    </Wrapper>
  );
}
