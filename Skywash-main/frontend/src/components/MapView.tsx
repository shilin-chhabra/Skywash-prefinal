import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { City } from "../App";

export default function MapView({ cities }: { cities: City[] }) {
  console.log('MapView cities:', cities); // Debug log
  
  if (!cities.length) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100">
        <p className="text-dark text-center">Loading map data…</p>
      </div>
    );
  }

  // Function to get marker color based on PM2.5 value
  const getMarkerColor = (pm25: number, city: City) => {
    // For static cities, always show grey regardless of PM2.5 value
    if (city.data_source === 'static') return "#9ca3af"; // Grey
    
    // For live cities, use AQI colors
    if (pm25 >= 301) return "#7e0023"; // Hazardous
    if (pm25 >= 201) return "#8f3f97"; // Very Unhealthy
    if (pm25 >= 151) return "#ff0000"; // Unhealthy
    if (pm25 >= 101) return "#ff7e00"; // Unhealthy for Sensitive Groups
    if (pm25 >= 51) return "#ffff00"; // Moderate
    return "#00e400"; // Good
  };

  // Function to get border color (darker version)
  const getBorderColor = (pm25: number, city: City) => {
    // For static cities, always show dark grey regardless of PM2.5 value
    if (city.data_source === 'static') return "#6b7280"; // Dark grey
    
    // For live cities, use darker AQI colors
    if (pm25 >= 301) return "#5a0019"; // Darker #7e0023 - Hazardous
    if (pm25 >= 201) return "#642d69"; // Darker #8f3f97 - Very Unhealthy
    if (pm25 >= 151) return "#c80000"; // Darker #ff0000 - Unhealthy
    if (pm25 >= 101) return "#c85a00"; // Darker #ff7e00 - Unhealthy for Sensitive Groups
    if (pm25 >= 51) return "#c8c800"; // Darker #ffff00 - Moderate
    return "#00b400"; // Darker #00e400 - Good
  };

  // Function to get data source icon
  const getDataSourceIcon = (city: City) => {
    return city.data_source === 'real_time' ? '📡' : '❌';
  };

  // Function to format last updated time
  const formatLastUpdated = (city: City) => {
    if (city.data_source === 'static' || !city.last_updated) {
      return 'Offline';
    }
    
    try {
      const date = new Date(city.last_updated);
      return `Updated: ${date.toLocaleTimeString()}`;
    } catch {
      return 'Real-time data';
    }
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <small className="text-muted">Cities: {cities.length}</small>
        <small className="text-muted">
          📡 Live • ❌ Offline
        </small>
      </div>
      
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        key={cities.length} // Force re-render when cities data changes
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {cities.map((city, index) => (
          <CircleMarker
            key={`${city.city}-${index}`}
            center={[city.lat, city.lon]}
            radius={8}
            pathOptions={{
              fillColor: getMarkerColor(city.pm25, city),
              color: getBorderColor(city.pm25, city),
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }}
          >
            <Tooltip permanent={false} sticky>
              <div style={{ 
                minWidth: '180px', 
                background: 'rgba(255, 255, 255, 0.95)', 
                padding: '8px 12px', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                <div className="fw-bold d-flex align-items-center justify-content-between">
                  <span style={{ color: '#1a1a1a', fontSize: '14px' }}>{city.city}</span>
                  <span>{getDataSourceIcon(city)}</span>
                </div>
                {city.data_source === 'real_time' && (
                  <div className="mt-1">
                    <strong style={{ color: '#2d3748' }}>
                      PM₂.₅: {city.pm25} µg/m³
                    </strong>
                  </div>
                )}
                <div style={{ color: '#4a5568', fontSize: '12px', marginTop: '4px' }}>
                  {formatLastUpdated(city)}
                </div>
                {city.data_source === 'real_time' && (
                  <div style={{ color: '#4a5568', fontSize: '12px' }}>
                    Source: WAQI API
                  </div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
