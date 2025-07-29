import { useState } from "react";
import { Row, Col, Form, Button, Alert, Card } from "react-bootstrap";
import type { City } from "../App";

interface Props {
  cities: City[];
  setCities: (c: City[]) => void;
  setSimulationData: (data: {cityName: string; original: number; simulated: number} | null) => void;
}

export default function WashoutSimulator({ cities, setCities, setSimulationData }: Props) {
  const [cityIdx, setCityIdx] = useState(-1); // -1 means no city selected
  const [rain, setRain]       = useState("");
  const [dur,  setDur]        = useState("");
  const [result, setResult]   = useState<number | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [originalCities, setOriginalCities] = useState<City[]>([]);

  if (!cities.length) return <p>Loading…</p>;

  // Store original cities data when component mounts or cities change
  if (originalCities.length === 0 && cities.length > 0) {
    setOriginalCities([...cities]);
  }

  const selCity = cityIdx >= 0 ? (originalCities[cityIdx] || cities[cityIdx]) : null;

  async function run() {
    // Prevent double clicks
    if (isLoading) return;
    
    // Check if city is selected
    if (cityIdx === -1 || !selCity) {
      setError("Please select a city");
      return;
    }
    
    // Clear previous errors
    setError(null);
    
    // Validate inputs
    const rainValue = parseFloat(rain);
    const durValue = parseFloat(dur);
    
    if (isNaN(rainValue) || rainValue <= 0) {
      setError("Rainfall intensity must be greater than 0");
      return;
    }
    if (isNaN(durValue) || durValue <= 0) {
      setError("Duration must be greater than 0");
      return;
    }

    // Validate PM2.5 value from selected city
    const pm25Value = typeof selCity.pm25 === 'number' ? selCity.pm25 : parseFloat(String(selCity.pm25));
    if (isNaN(pm25Value) || pm25Value <= 0) {
      setError("Invalid PM2.5 data for selected city. Please try refreshing the data or select a different city.");
      return;
    }

    setIsLoading(true);
    
    try {
      const url = `/api/washout?pm25=${pm25Value}&rain_mm=${rainValue}&duration_h=${durValue}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
      }
      
      const json = await res.json();

      // Only update the chart/map data ONCE when simulation is first run
      // Don't update on subsequent runs with same values
      if (result === null) {
        const updated = [...cities];
        updated[cityIdx] = { ...selCity, pm25: json.final };
        setCities(updated);
      }

      setResult(json.final);
      
      // Update simulation data for chart
      setSimulationData({
        cityName: selCity.city,
        original: pm25Value, // Use the validated pm25 value
        simulated: json.final
      });
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during simulation');
    } finally {
      setIsLoading(false);
    }
  }

  // Reset to original PM2.5 levels
  const resetToOriginal = () => {
    if (originalCities.length > 0) {
      setCities([...originalCities]);
      setResult(null);
      setError(null);
      setRain("");
      setDur("");
      setCityIdx(-1);
      setSimulationData(null);
    }
  };

  // Reset simulation when inputs change
  const handleInputChange = (field: 'rain' | 'dur', value: string) => {
    if (field === 'rain') {
      setRain(value);
    } else {
      setDur(value);
    }
    // Reset result and simulation data when inputs change
    setResult(null);
    setError(null);
    setSimulationData(null);
  };

  // Helper function to get safe PM2.5 value
  const getSafePm25 = (city: City | null, useOriginal: boolean = false): number => {
    if (!city) return 0;
    
    let pm25Source: number;
    if (useOriginal && originalCities[cityIdx]) {
      pm25Source = originalCities[cityIdx].pm25;
    } else {
      pm25Source = city.pm25;
    }
    
    const pm25Value = typeof pm25Source === 'number' ? pm25Source : parseFloat(String(pm25Source));
    return isNaN(pm25Value) ? 0 : pm25Value;
  };

  // Check if inputs are valid for button enabling
  const isInputValid = () => {
    const rainValue = parseFloat(rain);
    const durValue = parseFloat(dur);
    const pm25Value = getSafePm25(selCity);
    return !isNaN(rainValue) && rainValue > 0 && !isNaN(durValue) && durValue > 0 && cityIdx >= 0 && pm25Value > 0;
  };

  // Check if cities have been modified from original
  const hasModifications = () => {
    if (originalCities.length === 0) return false;
    return cities.some((city, index) => 
      originalCities[index] && city.pm25 !== originalCities[index].pm25
    );
  };

  // Helper: pick colour based on PM2.5 value
  const colourForPm25 = (pm: number) => {
    if (pm >= 301) return '#7e0023';    // Hazardous
    if (pm >= 201) return '#8f3f97';    // Very Unhealthy
    if (pm >= 151) return '#ff0000';    // Unhealthy
    if (pm >= 101) return '#ff7e00';    // Unhealthy for Sensitive Groups
    if (pm >= 51)  return '#ffff00';    // Moderate
    return   '#00e400';                 // Good
  };

  return (
    <div>
        <h4 className="text-dark mb-4 fw-semibold">Simulation Parameters</h4>
        
        <Row className="g-3 mb-5">
          <Col md={12}>
            <Card className="border-0 shadow-sm" style={{ background: 'rgba(248, 250, 252, 0.8)' }}>
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-3">City</Form.Label>
                      <Form.Select
                        value={cityIdx}
                        onChange={(e) => {
                          const newIdx = +e.target.value;
                          setCityIdx(newIdx);
                          setResult(null);
                          setError(null);
                          setSimulationData(null);
                        }}
                        className="border-0 shadow-sm"
                        style={{ padding: '12px 16px', fontSize: '14px' }}
                      >
                        <option value="-1">Select City</option>
                        {cities
                          .map((c, i) => ({ city: c, originalIndex: i }))
                          .sort((a, b) => a.city.city.localeCompare(b.city.city))
                          .map(({ city, originalIndex }) => (
                            <option 
                              key={city.city} 
                              value={originalIndex}
                              disabled={city.data_source !== 'real_time'}
                              style={{
                                backgroundColor: city.data_source !== 'real_time' ? '#e5e7eb' : 'inherit',
                                color: city.data_source !== 'real_time' ? '#9ca3af' : 'inherit'
                              }}
                              title={city.data_source !== 'real_time' ? 'Offline - Live data not available' : ''}
                            >
                              {city.city}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-3">
                        Rainfall Intensity (mm h⁻¹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.1"
                        value={rain}
                        onChange={(e) => handleInputChange('rain', e.target.value)}
                        placeholder="Enter value"
                        className="border-0 shadow-sm"
                        style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px',
                          MozAppearance: 'textfield'
                        }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-dark mb-3">
                        Duration (hours)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.1"
                        value={dur}
                        onChange={(e) => handleInputChange('dur', e.target.value)}
                        placeholder="Enter value"
                        className="border-0 shadow-sm"
                        style={{ 
                          padding: '12px 16px', 
                          fontSize: '14px',
                          MozAppearance: 'textfield'
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="d-flex gap-3 flex-wrap align-items-center mb-5">
          <Button
            onClick={run}
            disabled={isLoading || !isInputValid() || cityIdx === -1}
            size="lg"
            className="px-5 py-2 border-0 fw-semibold position-relative"
            style={{
              background: isLoading 
                ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' 
                : 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
              minWidth: '160px',
              height: '48px',
              transition: 'none'
            }}
          >
            <span style={{ 
              opacity: isLoading ? 0 : 1,
              transition: 'none'
            }}>
              Run Simulation
            </span>
            {isLoading && (
              <span 
                className="position-absolute top-50 start-50 translate-middle"
                style={{ transition: 'none' }}
              >
                Running...
              </span>
            )}
          </Button>

          {hasModifications() && (
            <Button
              onClick={resetToOriginal}
              variant="outline-secondary"
              size="lg"
              className="px-4 fw-semibold"
              style={{
                minWidth: '140px',
                height: '48px',
                transition: 'none'
              }}
            >
              Reset to Original
            </Button>
          )}
        </div>
        <div>
          <h4 className="text-dark mb-4 fw-semibold text-center">Simulation Result</h4>
          <Card className="border-0 shadow-sm" style={{ background: 'rgba(248, 250, 252, 0.8)' }}>
            <Card.Body className="p-5 text-center">
              {result !== null ? (
                <div>
                  {/* Details */}
                  <div className="mb-4 text-start" style={{maxWidth: '400px', margin: '0 auto'}}>
                    <p className="mb-1"><strong>City:</strong> {selCity?.city || 'N/A'}</p>
                    <p className="mb-1"><strong>Current PM₂.₅:</strong> {getSafePm25(selCity, true).toFixed(1)} µg/m³</p>
                    <p className="mb-1"><strong>Rainfall Intensity:</strong> {rain || 'N/A'} mm h⁻¹</p>
                    <p className="mb-3"><strong>Duration:</strong> {dur || 'N/A'} h</p>
                  </div>

                  {/* Badges row */}
                  <div className="d-flex justify-content-center align-items-center gap-4 mb-3 flex-wrap">
                    {/* Current PM2.5 */}
                    <div className="text-center">
                      <div
                        className="d-inline-block rounded-pill fw-bold shadow-lg mb-2"
                        style={{
                          background: colourForPm25(getSafePm25(selCity, true)),
                          color: getSafePm25(selCity, true) >= 151 ? '#ffffff' : '#000000',
                          fontSize: '2rem',
                          padding: '16px 20px'
                        }}
                      >
                        {getSafePm25(selCity, true).toFixed(1)} µg/m³
                      </div>
                      <p className="text-muted fw-medium mb-0 small">
                        Current PM₂.₅ level
                      </p>
                    </div>

                    {/* Simulated PM2.5 */}
                    <div className="text-center">
                      <div 
                        className="d-inline-block fw-bold shadow-lg mb-2"
                        style={{
                          background: colourForPm25(result),
                          color: result >= 151 ? '#ffffff' : '#000000',
                          fontSize: '2rem',
                          border: '4px solid #374151',
                          borderRadius: '50px',
                          padding: '16px 20px'
                        }}
                      >
                        {result.toFixed(1)} µg/m³
                      </div>
                      <p className="text-muted fw-medium mb-0 small">
                        New PM₂.₅ after washout
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0 fs-5">
                  Run simulation to see results
                </p>
              )}
            </Card.Body>
          </Card>
        </div>
    </div>
  );
}
