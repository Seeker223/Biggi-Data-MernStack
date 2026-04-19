import React, { useContext, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Wifi } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { getUserDataPurchaseCount, isBiggiHouseMember } from "../../utils/biggiHouse";

const UserRoleScreen = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const dataBuys = useMemo(() => getUserDataPurchaseCount(user), [user]);
  const isMember = useMemo(() => isBiggiHouseMember(user), [user]);

  return (
    <Page>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </BackBtn>
        <HeaderTitle>Biggi House</HeaderTitle>
        <Spacer />
      </Header>

      <Card>
        <Title>{isMember ? "You’re in Biggi House" : "Join Biggi House"}</Title>
        <Subtitle>
          Biggi House access is now unlocked by buying data on Biggi Data.
        </Subtitle>

        <InfoBox>
          <InfoRow>
            <strong>Data purchases:</strong> <span>{dataBuys}</span>
          </InfoRow>
          <InfoRow>
            <strong>Status:</strong>{" "}
            <span>{isMember ? "Active member" : "Not a member yet"}</span>
          </InfoRow>
        </InfoBox>

        {isMember ? (
          <PrimaryBtn type="button" onClick={() => navigate("/", { replace: true })}>
            <CheckCircle2 size={18} /> Continue
          </PrimaryBtn>
        ) : (
          <PrimaryBtn type="button" onClick={() => navigate("/buy-data")}>
            <Wifi size={18} /> Buy Data to Join
          </PrimaryBtn>
        )}
      </Card>
    </Page>
  );
};

export default UserRoleScreen;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top, #fff7ee 0%, #ffffff 60%);
  display: flex;
  justify-content: center;
  padding: 0 16px 40px;
`;

const Header = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  z-index: 5;
`;

const BackBtn = styled.button`
  border: none;
  background: #f5f5f5;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #000;
`;

const Spacer = styled.div`
  width: 36px;
  height: 36px;
`;

const Card = styled.div`
  margin-top: 90px;
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid #f2f2f2;
  animation: ${fadeIn} 0.25s ease-out;
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 800;
  color: #000;
`;

const Subtitle = styled.p`
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
`;

const RoleCard = styled.button`
  border: 2px solid ${(p) => (p.$active ? "#ff7a00" : "#f0f0f0")};
  border-radius: 18px;
  padding: 18px;
  text-align: left;
  background: ${(p) => (p.$active ? "#fff7ef" : "#ffffff")};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${(p) => (p.$active ? "0 10px 18px rgba(255, 122, 0, 0.2)" : "none")};

  &:hover {
    border-color: #ff7a00;
  }
`;

const RoleIcon = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: ${(p) => (p.$active ? "#ff7a00" : "#f5f5f5")};
  color: ${(p) => (p.$active ? "#fff" : "#666")};
  display: grid;
  place-items: center;
  margin-bottom: 12px;
`;

const RoleName = styled.h3`
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 800;
  color: #000;
`;

const InfoBox = styled.div`
  margin-top: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  padding: 14px;
  background: #ffffff;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  color: #333;

  strong {
    color: #111;
  }

  span {
    color: #555;
    font-weight: 700;
  }
`;

const PrimaryBtn = styled.button`
  margin-top: 16px;
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 14px 16px;
  font-weight: 900;
  cursor: pointer;
  background: linear-gradient(90deg, #ff7a00 0%, #111 100%);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const RoleDesc = styled.p`
  margin: 0;
  color: #555;
  font-size: 13px;
`;

const SelectedBadge = styled.div`
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #0f7a2f;
`;

const SavingText = styled.div`
  margin-top: 16px;
  font-size: 13px;
  color: #666;
`;

const ErrorText = styled.div`
  margin-top: 12px;
  color: #d11a2a;
  font-size: 13px;
`;
