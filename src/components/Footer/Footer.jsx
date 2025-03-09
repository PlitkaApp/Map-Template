import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaClone, FaUser, FaCog } from 'react-icons/fa'; 

const FooterContainer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #fafafa;
  border-top: 1px solid #ccc;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
`;

const IconLink = styled(Link)`
  text-decoration: none;
  color: #333;
  font-size: 1.5rem;
  transition: color 0.2s;

  &:hover {
    color: #007bff;
  }
`;

export default function Footer() {
  return (
    <FooterContainer>

      <IconLink to="/account"> 
        <FaUser />
      </IconLink>

      <IconLink to="/">
        <FaClone />
      </IconLink>

      <IconLink to="/settings">
        <FaCog />
      </IconLink>

    </FooterContainer>
  );
}