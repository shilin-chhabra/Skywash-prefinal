import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Container, Row, Col, Card, Button, Badge, Form } from "react-bootstrap";

import CityChart      from "./components/CityChart";
import MapView        from "./components/MapView";
import WashoutSimulator from "./components/WashoutSimulator";

export interface City {
  city: string;
  lat: number;
  lon: number;
  pm25: number;
  /**
   * Approximate population (millions). Used for determining the “largest” cities
   * when limiting the bar-chart to the top 10 cities.
   */
  population?: number;
  /**
   * Broad geographical region. Enables filtering the chart to a subset of
   * cities (e.g. “North America”, “South Asia”…).
   */
  region?: string;
  data_source?: 'real_time' | 'static';
  last_updated?: string;
}

export default function App() {
  const [cities, setCities] = useState<City[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Global');
  const [simulationData, setSimulationData] = useState<{cityName: string; original: number; simulated: number} | null>(null);

  // fetch once on mount
  useEffect(() => {
    fetchCitiesData();
  }, []);

  const fetchCitiesData = async () => {
    try {
      const response = await fetch("/api/cities");
      const data = await response.json();
      setCities(data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching cities data:", error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/cities/refresh");
      if (response.ok) {
        await fetchCitiesData();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRealTimeCount = () => {
    return cities.filter(city => city.data_source === 'real_time').length;
  };

  // --------------------------------------------------------------
  //  Region & display-list helpers
  // --------------------------------------------------------------
  const regions = [
    'Global',
    'North America',
    'South America',
    'South Asia',
    'Southeast Asia',
    'East Asia',
    'Middle East',
    'Western Europe',
    'Eastern Europe',
    'Oceania',
    'Africa',
  ];

  const displayedCities: City[] = (() => {
    let list = cities;
    if (selectedRegion !== 'Global') {
      list = cities.filter(c => c.region === selectedRegion);
    }
    // Sort descending by population (fallback to PM2.5 if population missing)
    list = [...list].sort((a, b) => {
      const popA = a.population ?? 0;
      const popB = b.population ?? 0;
      if (popA === popB) return b.pm25 - a.pm25;
      return popB - popA;
    });
    return list.slice(0, 10);
  })();

  const scrollToSimulator = () => {
    const element = document.getElementById('simulator');
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
      
      window.scrollTo({
        top: middle,
        behavior: 'smooth'
      });
    }
  };

  const scrollToMap = () => {
    const element = document.getElementById('global-map');
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
      
      window.scrollTo({
        top: middle,
        behavior: 'smooth'
      });
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden starfield">
      {/* Starfield overlay (kept subtle) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Banner */}
        <motion.header 
          className="bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 text-white pt-16 pb-8 mb-0 relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.pexels.com/photos/314726/pexels-photo-314726.jpeg?auto=compress&cs=tinysrgb&dpr=2&fit=crop&w=1920&h=1080')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Hero Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <Row className="justify-content-center text-center py-5">
            <Col lg={10} xl={8}>
              <h1 className="display-2 fw-bold text-uppercase mb-4 text-white">
                SkyWash
              </h1>
              <p className="lead mb-5 text-light fs-4">
                Real-time PM₂.₅ pollution tracking and washout simulation
              </p>
              <motion.button
                onClick={scrollToSimulator}
                className="btn btn-lg px-5 py-3 rounded-pill shadow-lg fw-semibold me-3 border-0"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                  color: 'white',
                  fontSize: '1.1rem',
                  border: 'none'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Simulator
              </motion.button>
              <motion.button
                onClick={scrollToMap}
                className="btn btn-lg px-5 py-3 rounded-pill shadow-lg fw-semibold border-0"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  color: 'white',
                  fontSize: '1.1rem',
                  border: 'none'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Map
              </motion.button>
            </Col>
          </Row>
        </motion.header>

        <Container fluid className="px-4">
          {/* Data Status Indicator */}
          <Row className="justify-content-center mb-4">
            <Col xl={10} lg={12}>
              <Card className="shadow-sm border-0" style={{
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px'
              }}>
                <Card.Body className="py-3 px-4">
                  <Row className="align-items-center">
                    <Col md={8}>
                      <div className="d-flex align-items-center">
                        <Badge 
                          bg={getRealTimeCount() > 0 ? "success" : "danger"} 
                          className="me-3 px-3 py-2"
                        >
                          {getRealTimeCount() > 0 ? (
                            <>🟢 <span style={{color: '#f8f9fa !important', WebkitTextFillColor: '#f8f9fa'}}>LIVE DATA</span></>
                          ) : (
                            <>🔴 OFFLINE</>
                          )}
                        </Badge>
                        <div>
                          <small className="text-muted d-block">
                            <strong>{getRealTimeCount()}</strong> of <strong>{cities.length}</strong> cities with real-time data
                            {lastRefresh && ` • Last updated: ${lastRefresh}`}
                          </small>
                          <small className="text-muted">
                            Data source: World Air Quality Index (WAQI) API
                          </small>
                        </div>
                      </div>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className="px-3"
                      >
                        {isRefreshing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Refreshing...
                          </>
                        ) : (
                          <>
                            🔄 Refresh Data
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Chart and Simulator Section - Side by Side */}
          <Row className="g-4 mb-5 justify-content-center">
            {/* Chart Card */}
            <Col xl={6} lg={6} md={12}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="h-100 shadow-lg border-0" style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(25px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  minHeight: '650px'
                }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-center mb-4">
                      <div className="rounded-pill me-3" style={{
                        width: '5px',
                        height: '40px',
                        background: 'linear-gradient(to bottom, #10b981, #3b82f6)'
                      }}></div>
                      <Card.Title className="h3 mb-0 fw-bold text-dark text-center">
                        PM₂.₅ Snapshot (2025)
                      </Card.Title>
                    </div>
                    {/* Region selector */}
                    <div className="mb-3 d-flex justify-content-center">
                      <Form.Select
                        className="w-auto"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                      >
                        {regions.map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </Form.Select>
                    </div>

                    {/* Chart */}
                    <div style={{ height: '550px' }}>
                      <CityChart cities={displayedCities} region={selectedRegion} simulationData={simulationData} />
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>

            {/* Simulator Card */}
            <Col xl={6} lg={6} md={12}>
              <motion.div
                id="simulator"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="h-100 shadow-lg border-0" style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(25px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  minHeight: '650px'
                }}>
                  <Card.Body className="p-4">
                    <div className="d-flex align-items-center justify-content-center mb-4">
                      <div className="rounded-pill me-3" style={{
                        width: '5px',
                        height: '40px',
                        background: 'linear-gradient(to bottom, #8b5cf6, #ec4899)'
                      }}></div>
                      <Card.Title className="h3 mb-0 fw-bold text-dark text-center">
                        Wash-Out Simulator
                      </Card.Title>
                    </div>
                    <WashoutSimulator cities={cities} setCities={setCities} setSimulationData={setSimulationData} />
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Map Section - Full Width (Now Below Chart and Simulator) */}
          <Row className="justify-content-center mb-4">
            <Col lg={10} xl={8}>
              <motion.div
                id="global-map"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="shadow-lg border-0" style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(25px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  minHeight: '500px'
                }}>
                  <Card.Body className="p-5">
                    <div className="d-flex align-items-center justify-content-center mb-4">
                      <div className="rounded-pill me-3" style={{
                        width: '5px',
                        height: '40px',
                        background: 'linear-gradient(to bottom, #f59e0b, #ef4444)'
                      }}></div>
                      <Card.Title className="h2 mb-0 fw-bold text-dark text-center">
                        Global Hotspots – Interactive Map
                      </Card.Title>
                    </div>
                    <div style={{ height: '420px' }}>
                      <MapView cities={cities} />
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>

        <footer className="text-center py-4 mt-3">
          <Container>
            <Card className="border-0 shadow-sm" style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px'
            }}>
              <Card.Body className="py-3">
                <small className="text-muted">
                  Data: WHO &amp; OpenAQ — Visuals © 2025 SkyWash
                </small>
              </Card.Body>
            </Card>
          </Container>
        </footer>
      </div>
    </main>
  );
}
