import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Footer from './components/Footer/Footer';
import Home from './components/Home/Home';
import Map from './components/Map/Map';
import Account from './components/Account/Account'; // Добавляем компонент аккаунта
import Settings from './components/Settings/Settings'; // Добавляем компонент настроек

const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 60px); 
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
`;

const MapWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem; 
`;

const ButtonContainer = styled.div`
  padding-left: 1rem; 
`;

const Button = styled.button`
  background: #f0f0f0;
  color: black;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: #007bff; 
    color: white;
  }
`;

export default function App() {
  const [markers, setMarkers] = useState([]);

  const handleConfirm = () => {
    console.log('Метки отправлены: ' + JSON.stringify(markers));
  };

  return (
    <Router>
      <Container>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={
              <MapWrapper>
                <Map onMarkerAdd={(marker) => setMarkers(p => [...p, marker])} />
                <ButtonContainer>
                  <Button onClick={handleConfirm}>Подтвердить</Button>
                </ButtonContainer>
              </MapWrapper>
            } /> 
          <Route path="/settings" element={<Settings />} /> 
        </Routes>
      </Container>
      <Footer />
    </Router>
  );
}