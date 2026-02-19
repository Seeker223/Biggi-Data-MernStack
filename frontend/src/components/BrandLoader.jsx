import React from "react";
import styled, { keyframes } from "styled-components";
import logo from "../assets/images/biggiDataLogo.png";

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 122, 0, 0.35);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0 14px rgba(255, 122, 0, 0);
    opacity: 0.92;
  }
`;

const BrandLoader = ({ text = "Loading..." }) => {
  return (
    <Wrap>
      <LogoRing>
        <Logo src={logo} alt="Biggi Data" />
      </LogoRing>
      <Text>{text}</Text>
    </Wrap>
  );
};

export default BrandLoader;

const Wrap = styled.div`
  min-height: 70vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
`;

const LogoRing = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255, 122, 0, 0.28);
  display: grid;
  place-items: center;
  animation: ${pulse} 1.6s ease-in-out infinite;
`;

const Logo = styled.img`
  width: 84px;
  height: 84px;
  object-fit: contain;
`;

const Text = styled.p`
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
`;
