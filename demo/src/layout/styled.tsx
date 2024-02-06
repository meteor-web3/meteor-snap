import styled from "styled-components";

export const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const BodyWrapper = styled.div`
  flex: 1 1 auto;
  display: flex;
  overflow: auto;
`;

export const Note = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 25px;
  background-color: #007aff;
  /* opacity: 0.6; */
  font-size: 12px;
  color: white;
  text-align: center;
  line-height: 25px;
  a {
    color: white;
    text-decoration: underline;
  }
  .closeIcon {
    width: 12px;
    height: 12px;
    margin-left: 1.5rem;
    cursor: pointer;
  }
`;
