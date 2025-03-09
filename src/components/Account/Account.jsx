import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 1rem;
  text-align: center;
`;

export default function Account() {
  return (
    <Container>
      <h1>Аккаунт</h1>
      <br />
      <p>Тут будет информация об аккаунте</p>
    </Container>
  );
}