import React from "react";

// import Header from "./Header";
import { Outlet } from "react-router-dom";

import { Container, BodyWrapper } from "./styled";

const Layout: React.FC = (): React.ReactElement => {
  return (
    <Container>
      <BodyWrapper>
        <Outlet />
      </BodyWrapper>
    </Container>
  );
};

export default Layout;
