import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function DeleteAccountScreen() {
  const navigate = useNavigate();
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <Page>
      <Container>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </BackBtn>
          <Title>Delete Account</Title>
          <Spacer />
        </Header>

        <Card>
          <WarningIcon>
            <AlertTriangle size={28} />
          </WarningIcon>
          <CardTitle>This action is irreversible</CardTitle>
          <CardText>
            Deleting your account removes access to wallet, rewards, and purchase history.
            Ensure any pending transactions are completed first.
          </CardText>
          <DangerBtn onClick={() => setConfirmVisible(true)}>Continue</DangerBtn>
        </Card>
      </Container>

      {confirmVisible && (
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>Delete Account</ModalTitle>
            <ModalText>Delete account flow will be added to the web dashboard shortly.</ModalText>
            <ModalRow>
              <ModalBtn $secondary onClick={() => setConfirmVisible(false)}>
                Close
              </ModalBtn>
              <ModalBtn onClick={() => setConfirmVisible(false)}>OK</ModalBtn>
            </ModalRow>
          </ModalCard>
        </ModalOverlay>
      )}
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  display: flex;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 20px;
  background: linear-gradient(90deg, #ff7a00 0%, #ff5c00 100%);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
`;

const BackBtn = styled.button`
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: #fff;
  color: #ff7a00;
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
`;

const Spacer = styled.div`
  width: 32px;
  height: 32px;
`;

const Card = styled.div`
  margin: 16px;
  padding: 20px;
  border-radius: 14px;
  border: 1px solid #fee2e2;
  background: #fff7f7;
  text-align: center;
`;

const WarningIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  margin: 0 auto 10px;
  color: #dc2626;
  background: #fee2e2;
  display: grid;
  place-items: center;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #991b1b;
`;

const CardText = styled.p`
  margin: 10px 0 14px;
  font-size: 14px;
  line-height: 1.5;
  color: #7f1d1d;
`;

const DangerBtn = styled.button`
  border: none;
  border-radius: 10px;
  background: #dc2626;
  color: #fff;
  font-weight: 700;
  padding: 11px 16px;
  cursor: pointer;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 1200;
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

