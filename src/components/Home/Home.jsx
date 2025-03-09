import React from 'react';
import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Title = styled.h1`
  margin-bottom: 2rem;
`;

export default function Home() {
  return (
    <HomeContainer>
      <Title>Добро пожаловать!</Title>
    </HomeContainer>
  );
}