import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ArrowLeft, Mail, Phone, MessageCircle, Clock3 } from "lucide-react";

const SUPPORT_EMAIL = "support@biggidata.com.ng";
const SUPPORT_PHONE = "+2347000000000";
const SUPPORT_WHATSAPP = "2347000000000";

const SupportScreen = () => {
  const navigate = useNavigate();

  return (
    <Wrap>
      <Card>
        <Header>
          <BackBtn onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </BackBtn>
          <Title>Support</Title>
          <Spacer />
        </Header>

        <Intro>
          Reach out to Biggi Data support using any of the channels below.
        </Intro>

        <Section>
          <Row href={`mailto:${SUPPORT_EMAIL}`}>
            <IconWrap>
              <Mail size={18} />
            </IconWrap>
            <RowBody>
              <Label>Email</Label>
              <Value>{SUPPORT_EMAIL}</Value>
            </RowBody>
          </Row>

          <Row href={`tel:${SUPPORT_PHONE}`}>
            <IconWrap>
              <Phone size={18} />
            </IconWrap>
            <RowBody>
              <Label>Phone</Label>
              <Value>{SUPPORT_PHONE}</Value>
            </RowBody>
          </Row>

          <Row
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
          >
            <IconWrap>
              <MessageCircle size={18} />
            </IconWrap>
            <RowBody>
              <Label>WhatsApp</Label>
              <Value>Chat with support</Value>
            </RowBody>
          </Row>

          <InfoRow>
            <IconWrap>
              <Clock3 size={18} />
            </IconWrap>
            <RowBody>
              <Label>Working Hours</Label>
              <Value>Mon - Sat, 8:00 AM - 8:00 PM (WAT)</Value>
            </RowBody>
          </InfoRow>
        </Section>
      </Card>
    </Wrap>
  );
};

export default SupportScreen;

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: #f6f6f6;
  padding: 0 0 96px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 460px;
  background: #fff;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #efefef;
`;

const BackBtn = styled.button`
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: #f4f4f4;
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

const Spacer = styled.div`
  width: 38px;
  height: 38px;
`;

const Intro = styled.p`
  margin: 16px;
  color: #555;
  font-size: 14px;
  line-height: 1.5;
`;

const Section = styled.div`
  margin: 0 16px;
  border: 1px solid #ececec;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
`;

const Row = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  padding: 14px;
  border-bottom: 1px solid #f1f1f1;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
`;

const IconWrap = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #fff4ea;
  color: #ff7a00;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
`;

const RowBody = styled.div`
  min-width: 0;
`;

const Label = styled.p`
  margin: 0;
  font-size: 13px;
  color: #666;
`;

const Value = styled.p`
  margin: 3px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: #111;
  word-break: break-word;
`;
