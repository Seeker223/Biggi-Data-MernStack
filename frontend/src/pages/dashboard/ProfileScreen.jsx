import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { User, Settings, Headset, LogOut, ChevronRight, ReceiptText } from "lucide-react";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import { AuthContext } from "../../context/AuthContext";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  const options = [
    {
      icon: <User size={20} color="#fff" />,
      label: "Edit Profile",
      onClick: () => navigate("/edit-profile"),
    },
    {
      icon: <Settings size={20} color="#fff" />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    {
      icon: <ReceiptText size={20} color="#fff" />,
      label: "Transaction History",
      onClick: () => navigate("/transactions"),
    },
    {
      icon: <Headset size={20} color="#fff" />,
      label: "Support",
      onClick: () => navigate("/notifications"),
    },
    {
      icon: <LogOut size={20} color="#fff" />,
      label: "Logout",
      onClick: () => setShowLogoutConfirm(true),
    },
  ];

  return (
    <Page>
      <Container>
        <Title>Profile</Title>
        <Content>
          <Avatar src={user.photo || DEFAULT_AVATAR} alt="Profile" />
          <Name>{user.username || "User"}</Name>
          <IdText>ID: {String(user._id || "").slice(-8)}</IdText>
          <IdText>Referral Code: {user.referralCode || "—"}</IdText>

          <Options>
            {options.map((item) => (
              <Option key={item.label} onClick={item.onClick}>
                <Left>
                  <IconCircle>{item.icon}</IconCircle>
                  <Label>{item.label}</Label>
                </Left>
                <ChevronRight size={18} color="#666" />
              </Option>
            ))}
          </Options>
        </Content>
      </Container>

      {showLogoutConfirm && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Logout</ModalTitle>
            <ModalText>Are you sure you want to logout?</ModalText>
            <ModalRow>
              <ModalButton $secondary onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </ModalButton>
              <ModalButton
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                Logout
              </ModalButton>
            </ModalRow>
          </ModalCard>
        </ModalOverlay>
      )}

      <FloatingBottomNav />
    </Page>
  );
};

export default ProfileScreen;

const Page = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 0 14px 96px;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 460px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  color: #1a1a1a;
  font-weight: 800;
  text-align: center;
  padding: 14px 0;
`;

const Content = styled.div`
  background: #fff;
  border-radius: 22px;
  border: 1px solid #ececec;
  margin-top: 8px;
  padding: 24px 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #000;
  object-fit: cover;
`;

const Name = styled.h2`
  margin: 10px 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: #003322;
`;

const IdText = styled.p`
  margin: 0;
  color: #555;
  font-size: 14px;
`;

const Options = styled.div`
  width: 94%;
  margin-top: 28px;
  display: grid;
  gap: 10px;
`;

const Option = styled.button`
  border: 1px solid #efefef;
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  cursor: pointer;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const IconCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: #007bff;
`;

const Label = styled.span`
  font-size: 16px;
  color: #003322;
  font-weight: 500;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 1200;
  padding: 18px;
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 320px;
  background: #fff;
  border-radius: 14px;
  padding: 18px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  color: #111;
`;

const ModalText = styled.p`
  margin: 8px 0 14px;
  color: #555;
`;

const ModalRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ModalButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  color: #fff;
  font-weight: 700;
  background: ${(p) => (p.$secondary ? "#777" : "#ff7a00")};
  cursor: pointer;
`;
