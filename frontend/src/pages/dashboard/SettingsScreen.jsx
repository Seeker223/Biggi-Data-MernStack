import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  Info,
  Languages,
  Lock,
  LogOut,
  PencilLine,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import { AuthContext } from "../../context/AuthContext";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const accountItems = [
    {
      icon: <User size={22} color="#1d76d2" />,
      bg: "#e8f2ff",
      label: "Profile Settings",
      onClick: () => navigate("/edit-profile"),
    },
    {
      icon: <Lock size={22} color="#2ea44f" />,
      bg: "#e7f7ec",
      label: "Change Password",
      onClick: () => navigate("/forgot-password"),
    },
    {
      icon: <CreditCard size={22} color="#d1a00f" />,
      bg: "#fff8e3",
      label: "Payment Methods",
      onClick: () => navigate("/payment-methods"),
    },
  ];

  const preferenceItems = [
    {
      icon: <Bell size={22} color="#0ea5a4" />,
      bg: "#e8faf9",
      label: "Push Notifications",
      right: (
        <Switch onClick={() => setPushEnabled((v) => !v)} $on={pushEnabled}>
          <SwitchThumb $on={pushEnabled} />
        </Switch>
      ),
    },
    {
      icon: <Languages size={22} color="#7b55c7" />,
      bg: "#f2eafb",
      label: "Language",
      onClick: () => navigate("/language"),
    },
  ];

  const moreItems = [
    {
      icon: <FileText size={22} color="#c8862b" />,
      bg: "#fff1e5",
      label: "Terms & Conditions",
      onClick: () => navigate("/terms"),
    },
    {
      icon: <ShieldCheck size={22} color="#c2478b" />,
      bg: "#fdeaf4",
      label: "Privacy Policy",
      onClick: () => navigate("/privacy-policy"),
    },
    {
      icon: <Info size={22} color="#6b7280" />,
      bg: "#f1f3f5",
      label: "About Biggidata",
      onClick: () => navigate("/about"),
    },
  ];

  const dangerItems = [
    {
      icon: <LogOut size={22} color="#cc3154" />,
      bg: "#fdecef",
      label: "Logout",
      labelColor: "#cc3154",
      onClick: () => setShowLogoutModal(true),
    },
    {
      icon: <Trash2 size={22} color="#cc3154" />,
      bg: "#fdecef",
      label: "Delete Account",
      labelColor: "#cc3154",
      onClick: () => navigate("/delete-account"),
    },
  ];

  return (
    <Page>
      <Container>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </BackBtn>
          <Title>Settings</Title>
          <HeaderSpacer />
        </Header>

        <Body>
          <ProfileCard>
            <ProfileLeft>
              <Avatar src={user?.photo || DEFAULT_AVATAR} alt="Profile" />
              <ProfileText>
                <ProfileName>{user?.username || "User"}</ProfileName>
                <ProfileMeta>{user?.email || "No email"}</ProfileMeta>
                <ProfileMeta>{user?.phoneNumber || "No phone number"}</ProfileMeta>
              </ProfileText>
            </ProfileLeft>
            <EditBtn onClick={() => navigate("/edit-profile")}>
              <PencilLine size={18} />
            </EditBtn>
          </ProfileCard>

          <SectionTitle>Account</SectionTitle>
          <SectionCard>
            {accountItems.map((item) => (
              <RowButton key={item.label} onClick={item.onClick}>
                <RowLeft>
                  <IconWrap style={{ background: item.bg }}>{item.icon}</IconWrap>
                  <RowLabel>{item.label}</RowLabel>
                </RowLeft>
                <ChevronRight size={22} color="#999" />
              </RowButton>
            ))}
          </SectionCard>

          <SectionTitle>Preferences</SectionTitle>
          <SectionCard>
            {preferenceItems.map((item) => (
              <RowButton key={item.label} onClick={item.onClick}>
                <RowLeft>
                  <IconWrap style={{ background: item.bg }}>{item.icon}</IconWrap>
                  <RowLabel>{item.label}</RowLabel>
                </RowLeft>
                {item.right || <ChevronRight size={22} color="#999" />}
              </RowButton>
            ))}
          </SectionCard>

          <SectionCard style={{ marginTop: 16 }}>
            {moreItems.map((item) => (
              <RowButton key={item.label} onClick={item.onClick}>
                <RowLeft>
                  <IconWrap style={{ background: item.bg }}>{item.icon}</IconWrap>
                  <RowLabel>{item.label}</RowLabel>
                </RowLeft>
                <ChevronRight size={22} color="#999" />
              </RowButton>
            ))}
          </SectionCard>

          <SectionTitle>Danger Zone</SectionTitle>
          <SectionCard>
            {dangerItems.map((item) => (
              <RowButton key={item.label} onClick={item.onClick}>
                <RowLeft>
                  <IconWrap style={{ background: item.bg }}>{item.icon}</IconWrap>
                  <RowLabel style={{ color: item.labelColor }}>{item.label}</RowLabel>
                </RowLeft>
                <ChevronRight size={22} color={item.labelColor} />
              </RowButton>
            ))}
          </SectionCard>

          <FooterText>Biggidata v1.0.0</FooterText>
          <FooterText style={{ marginTop: 2 }}>© 2024 Biggidata. All rights reserved.</FooterText>
        </Body>
      </Container>

      {showLogoutModal && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Logout</ModalTitle>
            <ModalText>Are you sure you want to logout?</ModalText>
            <ModalRow>
              <ModalBtn $secondary onClick={() => setShowLogoutModal(false)}>
                Cancel
              </ModalBtn>
              <ModalBtn
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
              >
                Logout
              </ModalBtn>
            </ModalRow>
          </ModalCard>
        </ModalOverlay>
      )}
      <FloatingBottomNav />
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  padding: 0 0 96px;
`;

const Container = styled.div`
  width: 100%;
  max-width: 460px;
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 14px 16px;
  border-bottom: 1px solid #ececec;
`;

const BackBtn = styled.button`
  border: none;
  background: transparent;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #111;
`;

const HeaderSpacer = styled.div`
  width: 32px;
  height: 32px;
`;

const Body = styled.div`
  padding: 12px 16px 20px;
`;

const ProfileCard = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 22px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ProfileLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.img`
  width: 92px;
  height: 92px;
  border-radius: 46px;
  object-fit: cover;
  border: 2px solid #ff7a00;
`;

const ProfileText = styled.div``;

const ProfileName = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #111;
`;

const ProfileMeta = styled.p`
  margin: 2px 0 0;
  font-size: 14px;
  color: #666;
`;

const EditBtn = styled.button`
  border: none;
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background: #fff3e8;
  color: #c8862b;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const SectionTitle = styled.h2`
  margin: 18px 4px 10px;
  font-size: 18px;
  color: #666;
  font-weight: 700;
`;

const SectionCard = styled.div`
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #ececec;
  background: #fff;
`;

const RowButton = styled.button`
  width: 100%;
  border: none;
  background: #fff;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const RowLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
`;

const RowLabel = styled.span`
  font-size: 16px;
  color: #111;
  font-weight: 600;
`;

const Switch = styled.div`
  width: 52px;
  height: 30px;
  border-radius: 15px;
  padding: 3px;
  background: ${(p) => (p.$on ? "#ff7a00" : "#ddd")};
  position: relative;
`;

const SwitchThumb = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: #fff;
  position: absolute;
  top: 3px;
  left: ${(p) => (p.$on ? "25px" : "3px")};
  transition: left 0.2s ease;
`;

const FooterText = styled.p`
  margin: 22px 0 0;
  text-align: center;
  color: #888;
  font-size: 12px;
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
  padding: 16px;
  text-align: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #111;
`;

const ModalText = styled.p`
  margin: 8px 0 12px;
  color: #555;
`;

const ModalRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ModalBtn = styled.button`
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  color: #fff;
  font-weight: 700;
  background: ${(p) => (p.$secondary ? "#777" : "#ff7a00")};
  cursor: pointer;
`;

