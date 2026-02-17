import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import FloatingBottomNav from "../../components/FloatingBottomNav";
import { AuthContext } from "../../context/AuthContext";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <Wrap>
      <Card>
        <Title>Profile</Title>
        <Avatar
          src={user.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          alt="profile"
        />
        <Name>{user.username}</Name>
        <Sub>ID: {String(user._id || "").slice(-8)}</Sub>

        <Action onClick={() => navigate("/")}>Back Home</Action>
        <Action onClick={() => navigate("/notifications")}>Notifications</Action>
        <Danger
          onClick={() => {
            if (window.confirm("Logout now?")) logout();
          }}
        >
          Logout
        </Danger>
      </Card>
      <FloatingBottomNav />
    </Wrap>
  );
};

export default ProfileScreen;

const Wrap = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  padding: 20px 14px 100px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 14px;
  font-size: 22px;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #222;
  object-fit: cover;
`;

const Name = styled.h2`
  font-size: 20px;
  margin: 10px 0 6px;
`;

const Sub = styled.p`
  color: #666;
  margin: 0 0 16px;
`;

const Action = styled.button`
  width: 100%;
  border: 0;
  border-radius: 10px;
  padding: 12px;
  margin-top: 10px;
  background: #ececec;
  cursor: pointer;
`;

const Danger = styled(Action)`
  background: #d62828;
  color: #fff;
`;
