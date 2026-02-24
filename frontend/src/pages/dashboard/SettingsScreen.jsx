import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Bell, Lock, FileText, Trash2, ChevronRight } from "lucide-react";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import { Alert } from "../../utils/alert";

export default function SettingsScreen() {
  const navigate = useNavigate();

  const settings = [
    {
      icon: <Bell size={20} color="#fff" />,
      label: "Notification Settings",
      onClick: () => navigate("/notifications"),
    },
    {
      icon: <Lock size={20} color="#fff" />,
      label: "Password Settings",
      onClick: () => navigate("/forgot-password"),
    },
    {
      icon: <FileText size={20} color="#fff" />,
      label: "Terms And Conditions",
      onClick: () => Alert.alert("Terms", "Terms page will be added to web shortly."),
    },
    {
      icon: <Trash2 size={20} color="#fff" />,
      label: "Delete Account",
      onClick: () => Alert.alert("Delete Account", "Delete account flow will be added shortly."),
    },
  ];

  return (
    <Page>
      <Container>
        <Header>
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </IconButton>
          <Title>Settings</Title>
          <Spacer />
        </Header>

        <Content>
          {settings.map((item) => (
            <Option key={item.label} onClick={item.onClick}>
              <Left>
                <IconCircle>{item.icon}</IconCircle>
                <Label>{item.label}</Label>
              </Left>
              <ChevronRight size={20} color="#555" />
            </Option>
          ))}
        </Content>
      </Container>
      <FloatingBottomNav />
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 16px 14px 96px;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 460px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const IconButton = styled.button`
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 800;
`;

const Spacer = styled.div`
  width: 36px;
`;

const Content = styled.div`
  margin-top: 10px;
  padding: 18px;
  background: #f5f5f5;
  border-top-left-radius: 35px;
  border-top-right-radius: 35px;
`;

const Option = styled.button`
  width: 100%;
  border: none;
  background: #fff;
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: pointer;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: #007bff;
  display: grid;
  place-items: center;
`;

const Label = styled.span`
  font-size: 16px;
  color: #000;
  font-weight: 500;
`;

