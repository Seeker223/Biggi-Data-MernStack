import React, { useContext, useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { Briefcase, User, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { updateUserProfile } from "../../services/api";

const UserRoleScreen = () => {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    const role = user?.role || user?.userRole;
    if (role) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSelectRole = async (role) => {
    if (saving) return;
    setSelectedRole(role);
    setSaving(true);
    setErrorMsg("");

    try {
      const res = await updateUserProfile({ role, userRole: role });
      const updatedUser =
        res?.data?.user || res?.data?.updatedUser || res?.data?.data || null;

      if (!updatedUser && res?.data?.success === false) {
        throw new Error(res?.data?.message || "Failed to save role");
      }

      if (updatedUser) {
        updateUser(updatedUser);
      } else {
        updateUser({ role, userRole: role });
      }
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to save role. Try again.");
      setSaving(false);
    }
  };

  return (
    <Page>
      <Header>
        <BackBtn onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </BackBtn>
        <HeaderTitle>Select Your Role</HeaderTitle>
        <Spacer />
      </Header>

      <Card>
        <Title>Choose account type</Title>
        <Subtitle>This helps us tailor game access to your account.</Subtitle>

        <RoleGrid>
          <RoleCard
            type="button"
            onClick={() => handleSelectRole("private")}
            $active={selectedRole === "private"}
            disabled={saving}
          >
            <RoleIcon $active={selectedRole === "private"}>
              <User size={24} />
            </RoleIcon>
            <RoleName>Private</RoleName>
            <RoleDesc>Weekly game + Top Random picks</RoleDesc>
            {selectedRole === "private" && <SelectedBadge><CheckCircle2 size={16} /> Selected</SelectedBadge>}
          </RoleCard>

          <RoleCard
            type="button"
            onClick={() => handleSelectRole("merchant")}
            $active={selectedRole === "merchant"}
            disabled={saving}
          >
            <RoleIcon $active={selectedRole === "merchant"}>
              <Briefcase size={24} />
            </RoleIcon>
            <RoleName>Merchant</RoleName>
            <RoleDesc>Access all game cards</RoleDesc>
            {selectedRole === "merchant" && <SelectedBadge><CheckCircle2 size={16} /> Selected</SelectedBadge>}
          </RoleCard>
        </RoleGrid>

        {saving && <SavingText>Saving role...</SavingText>}
        {errorMsg && <ErrorText>{errorMsg}</ErrorText>}
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
