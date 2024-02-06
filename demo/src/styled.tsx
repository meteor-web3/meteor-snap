import styled, { createGlobalStyle } from "styled-components";

import InterBold from "@/assets/fonts/Inter/Inter-Bold.ttf";
import InterExtraBold from "@/assets/fonts/Inter/Inter-ExtraBold.ttf";
import InterMedium from "@/assets/fonts/Inter/Inter-Medium.ttf";
import InterRegular from "@/assets/fonts/Inter/Inter-Regular.ttf";
import InterSemiBold from "@/assets/fonts/Inter/Inter-SemiBold.ttf";
import LatoBold from "@/assets/fonts/Lato/Lato-Bold.ttf";
import LatoExtraBold from "@/assets/fonts/Lato/Lato-ExtraBold.ttf";
import LatoMedium from "@/assets/fonts/Lato/Lato-Medium.ttf";
import LatoRegular from "@/assets/fonts/Lato/Lato-Regular.ttf";
import LatoSemiBold from "@/assets/fonts/Lato/Lato-SemiBold.ttf";
import PoppinsBold from "@/assets/fonts/Poppins/Poppins-Bold.ttf";
import PoppinsExtraBold from "@/assets/fonts/Poppins/Poppins-ExtraBold.woff2";
import PoppinsMedium from "@/assets/fonts/Poppins/Poppins-Medium.ttf";
import PoppinsSemiBold from "@/assets/fonts/Poppins/Poppins-SemiBold.woff2";
import Poppins from "@/assets/fonts/Poppins/Poppins.ttf";

export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: Lato;
    font-style: normal;
    src: url(${LatoRegular});
  }
  @font-face {
    font-family: Lato-Medium;
    font-style: normal;
    src: url(${LatoMedium});
  }
  @font-face {
    font-family: Lato-SemiBold;
    font-style: normal;
    src: url(${LatoSemiBold});
  }
  @font-face {
    font-family: Lato-Bold;
    font-style: normal;
    src: url(${LatoBold});
  }
  @font-face {
    font-family: Lato-ExtraBold;
    font-style: normal;
    src: url(${LatoExtraBold});
  }

  @font-face {
    font-family: Poppins;
    font-style: normal;
    src: url(${Poppins});
  }
  @font-face {
    font-family: Poppins-Medium;
    font-style: normal;
    src: url(${PoppinsMedium});
  }
  @font-face {
    font-family: Poppins-SemiBold;
    font-style: normal;
    src: url(${PoppinsSemiBold});
  }
  @font-face {
    font-family: Poppins-Bold;
    font-style: normal;
    src: url(${PoppinsBold});
  }
  @font-face {
    font-family: Poppins-ExtraBold;
    font-style: normal;
    src: url(${PoppinsExtraBold});
  }

  @font-face {
    font-family: Inter;
    font-style: normal;
    src: url(${InterRegular});
  }
  @font-face {
    font-family: Inter-Medium;
    font-style: normal;
    src: url(${InterMedium});
  }
  @font-face {
    font-family: Inter-SemiBold;
    font-style: normal;
    src: url(${InterSemiBold});
  }
  @font-face {
    font-family: Inter-Bold;
    font-style: normal;
    src: url(${InterBold});
  }
  @font-face {
    font-family: Inter-ExtraBold;
    font-style: normal;
    src: url(${InterExtraBold});
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
  }
  body {
    background: #F8F9FD;
  }
  body,
  h1,
  button {
    margin: 0;
    font:
      16px/1.4 Poppins,
      monospace;
  }
  button {
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
  }
  body,
  a {
    text-decoration: none;
    outline: 0;
  }
  .hideScrollbar::-webkit-scrollbar {
    display: none;
  }
  input,
  textarea {
    border: none;
    outline: none;
    font-family: Poppins, sans-serif;
  }
  font-family: Poppins;

:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #fff;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}
`;

export const Frame = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  max-width: 100%;
  margin: 0;
`;

export const FlexRow = styled.div`
  display: flex;
  align-items: center;
  align-content: center;
`;
