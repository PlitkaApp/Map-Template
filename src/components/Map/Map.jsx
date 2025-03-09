import { useEffect, useRef, useState, useCallback } from 'react';
import leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styled from 'styled-components';
import useLocalStorage from '../../hooks/useLocalStorage';
import { debounce } from 'lodash';

delete leaflet.Icon.Default.prototype._getIconUrl;
leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Wrapper = styled.div`
  flex: 1;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
  min-height: 400px; 
  
  @media (min-width: 768px) {
    grid-template-columns: minmax(300px, 1fr) 350px;
    min-height: auto;
  }
`;

const MapContainer = styled.div`
  flex: 1;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 300px;
`;

const Sidebar = styled.div`
  order: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  padding-left: 1rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  min-height: 300px;
  max-height: 500px;
  
  @media (min-width: 768px) {
    order: 2;
    max-height: calc(100vh - 120px);
    min-height: auto;
  }
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
`;

const SuggestionsList = styled.ul`
  position: absolute;
  width: 100%;
  margin-top: 0.5rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  max-height: 300px;
  overflow-y: auto;
`;

const SuggestionItem = styled.li`
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  color: #424242;

  &:hover {
    background: #f5f5f5;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #eeeeee;
  }
`;

const MarkersList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-grow: 1;
`;

const MarkerItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: background 0.2s;

  &:hover {
    background: #f1f1f1;
  }
`;

const AddressText = styled.span`
  flex: 1;
  padding-right: 1rem;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: ${props => (props.$expanded ? 'unset' : 2)};
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: #757575;
  position: relative;
  flex-shrink: 0;

  &:hover {
    color: #f44336;
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 2px;
    background: currentColor;
    left: 50%;
    top: 50%;
  }

  &::before {
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    transform: translate(-50%, -50%) rotate(-45deg);
  }
`;

const ErrorMessage = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
  font-weight: 500;
  z-index: 1002;

  @keyframes slideUp {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;

const LocateButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 1rem;
  width: 100%;
  transition: background 0.2s;

  &:hover {
    background: #0069d9;
  }
`;

export default function Map({ onMarkerAdd }) {
  const mapRef = useRef(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedMarkerIndex, setExpandedMarkerIndex] = useState(-1);
  const markersLayerRef = useRef(leaflet.layerGroup());
  
  const [nearbyMarkers, setNearbyMarkers] = useLocalStorage('NEARBY_MARKERS', []);

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = leaflet.map('map').setView([55.7558, 37.6176], 13);
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
      markersLayerRef.current.addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Обновление маркеров
  useEffect(() => {
    markersLayerRef.current.clearLayers();
    nearbyMarkers.forEach((marker) => {
      leaflet
        .marker([marker.latitude, marker.longitude])
        .addTo(markersLayerRef.current)
        .bindPopup(marker.address);
    });
  }, [nearbyMarkers]);

  // Обработка кликов по карте
  useEffect(() => {
    if (!mapRef.current) return;

    const handleClick = async (e) => {
      if (nearbyMarkers.length >= 5) {
        setError('Максимум 5 меток!');
        return;
      }

      const { lat: latitude, lng: longitude } = e.latlng;
      const address = await getAddressFromCoordinates(latitude, longitude);
      const newMarker = { latitude, longitude, address };

      setNearbyMarkers((prev) => [...prev, newMarker]);
      onMarkerAdd(newMarker);
    };

    mapRef.current.on('click', handleClick);
    return () => mapRef.current?.off('click', handleClick);
  }, [nearbyMarkers, onMarkerAdd, setNearbyMarkers]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const handleSuggestionClick = useCallback((suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    mapRef.current?.setView([lat, lon], 15);
    setSearchQuery(suggestion.display_name);
    setSuggestions([]);
  }, []);

  const handleDeleteMarker = useCallback(
    (index) => {
      const newMarkers = nearbyMarkers.filter((_, i) => i !== index);
      if (newMarkers.length < 5) setError('');
      setNearbyMarkers(newMarkers);
      setExpandedMarkerIndex(-1);
    },
    [nearbyMarkers, setNearbyMarkers]
  );

  const handleLocate = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }
  
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
  
      const { latitude, longitude } = position.coords;
      mapRef.current?.setView([latitude, longitude], 16);
  
    } catch (err) {
      setError('Не удалось определить местоположение');
      console.error(err);
    }
  }, []);

  const toggleAddress = useCallback((index) => {
    setExpandedMarkerIndex(prev => prev === index ? -1 : index);
  }, []);

  return (
    <Wrapper>
      <div>
        <SearchBar>
          <SearchInput
            type="text"
            placeholder="Поиск адреса..."
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {isSearchFocused && suggestions.length > 0 && (
            <SuggestionsList>
              {suggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.place_id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                >
                  {suggestion.display_name}
                </SuggestionItem>
              ))}
            </SuggestionsList>
          )}
        </SearchBar>
        
        <MapContainer id="map" />
        {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}
      </div>

      <Sidebar>
        <h3 style={{ margin: '0 0 1rem', color: '#212121' }}>
          Сохранённые места ({nearbyMarkers.length}/5)
        </h3>
        <LocateButton onClick={handleLocate}>
          Мое местоположение
        </LocateButton>
        <MarkersList>
          {nearbyMarkers.map((marker, index) => (
            <MarkerItem key={index}>
              <AddressText 
                $expanded={expandedMarkerIndex === index}
                onClick={() => toggleAddress(index)}
              >
                {marker.address}
              </AddressText>
              <DeleteButton onClick={() => handleDeleteMarker(index)} />
            </MarkerItem>
          ))}
        </MarkersList>
      </Sidebar>
    </Wrapper>
  );
}