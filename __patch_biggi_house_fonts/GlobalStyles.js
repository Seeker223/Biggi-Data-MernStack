import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    color-scheme: light;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: "Space Grotesk", system-ui, -apple-system, sans-serif;
    background:
      radial-gradient(1200px 600px at 10% -10%, rgba(27, 77, 182, 0.18), transparent 60%),
      radial-gradient(900px 500px at 85% 0%, rgba(245, 158, 11, 0.15), transparent 60%),
      #f5f8ff;
    color: #0b1220;
    min-height: 100vh;
    line-height: 1.45;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    font-family: inherit;
  }

  img {
    max-width: 100%;
    display: block;
  }
`;
