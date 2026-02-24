import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Info } from "lucide-react";

export default function AboutScreen() {
  const navigate = useNavigate();
  return (
    <Page>
      <Container>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </BackBtn>
          <Title>About Biggidata</Title>
          <Spacer />
        </Header>
        <Card>
          <IconWrap>
            <Info size={28} />
          </IconWrap>
          <CardTitle>Unavailable On Web</CardTitle>
          <CardText>Detailed about page will be added to the web dashboard shortly.</CardText>
        </Card>
      </Container>
    </Page>
  );
}

const Page = styled.div`min-height: 100vh; background: #fff; display: flex; justify-content: center;`;
const Container = styled.div`width: 100%; max-width: 440px;`;
const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 16px 20px; background: linear-gradient(90deg,#ff7a00 0%,#ff5c00 100%);
  border-bottom-left-radius: 30px; border-bottom-right-radius: 30px;
`;
const BackBtn = styled.button`
  border: none; width: 32px; height: 32px; border-radius: 16px;
  background: #fff; color: #ff7a00; display: grid; place-items: center; cursor: pointer;
`;
const Title = styled.h1`margin: 0; color: #fff; font-size: 20px; font-weight: 800;`;
const Spacer = styled.div`width: 32px; height: 32px;`;
const Card = styled.div`
  margin: 16px; padding: 20px; border-radius: 14px; border: 1px solid #efefef; background: #fff;
  text-align: center;
`;
const IconWrap = styled.div`
  width: 56px; height: 56px; border-radius: 28px; margin: 0 auto 10px;
  background: #f1f3f5; color: #6b7280; display: grid; place-items: center;
`;
const CardTitle = styled.h2`margin: 0; font-size: 18px; color: #111;`;
const CardText = styled.p`margin: 8px 0 0; color: #555; font-size: 14px;`;

