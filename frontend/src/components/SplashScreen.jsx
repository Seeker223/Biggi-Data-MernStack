import React from "react";
import styled from "styled-components";
import BrandLoader from "./BrandLoader";

const SplashScreen = () => {
  return (
    <Screen>
      <BrandLoader text="Welcome to Biggi Data" />
    </Screen>
  );
};

export default SplashScreen;

const Screen = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
`;
