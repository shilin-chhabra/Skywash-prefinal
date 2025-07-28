# SkyWash - Real-Time Air Quality Dashboard

A modern web application for tracking PM₂.₅ pollution levels and simulating atmospheric washout effects using real-time data from the World Air Quality Index (WAQI) API.

## Features

- Real-Time Data: Live PM₂.₅ readings from 64 major cities worldwide
- Interactive Visualization: Dynamic charts and maps with color-coded pollution levels
- Washout Simulation: Simulate how rainfall affects air pollution levels
- Modern UI: NCAR and NASA-inspired dashboard with responsive Bootstrap design
- Smart Caching: Efficient API usage with 1-hour data caching
- Mobile Friendly: Fully responsive design for all devices

##  Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Get WAQI API Token (FREE)
1. Visit [WAQI Token Request](https://aqicn.org/data-platform/token/)
2. Agree to terms of service
3. Enter your email and name
4. You'll receive your free API token (1000 requests/second limit!)

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create environment file
echo "WAQI_API_TOKEN=your_token_here" > .env
echo "WASHOUT_COEFF=0.08" >> .env

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run build

# Copy built files to backend static directory
cp -r dist/* ../backend/static/
```

### 4. Access the Application
Open your browser to `http://localhost:8000`

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Required: Your WAQI API token
WAQI_API_TOKEN=your_actual_token_here

# Optional: Washout coefficient for simulation (default: 0.08)
WASHOUT_COEFF=0.08
```

### API Rate Limits
- **Free Tier**: 1000 requests/second (very generous!)
- **Caching**: Data cached for 1 hour to minimize API calls
- **Fallback**: Automatic fallback to static data if API fails

## 📡 API Endpoints

### Real-Time Data
- `GET /api/cities` - Get all cities with real-time PM₂.₅ data
- `GET /api/cities/refresh` - Force refresh data (clears cache)

### Simulation
- `GET /api/washout?pm25=92&rain_mm=10&duration_h=2` - Calculate washout effect

## 🌟 Data Sources

### Real-Time Data
- **Primary**: World Air Quality Index (WAQI) API
- **Coverage**: Global network of 11,000+ monitoring stations
- **Update Frequency**: Real-time (cached for 1 hour)
- **Attribution**: Data provided by local EPA agencies worldwide

### Fallback Data
- **Source**: Static baseline values for demonstration
- **Purpose**: Ensures app functionality when API is unavailable

## 🎨 UI Features

### Data Status Indicator
- 🟢 **LIVE DATA**: Shows count of cities with real-time data
- 📊 **STATIC DATA**: Fallback mode indicator
- 🔄 **Refresh Button**: Manual data refresh capability

### Interactive Elements
- **Chart Tooltips**: Show data source, update time, and health categories
- **Map Markers**: Color-coded by pollution level with live/static indicators
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### Health Categories
- 🟢 **Good** (0-25 µg/m³): Safe air quality
- 🟠 **Moderate** (25-50 µg/m³): Acceptable for most people
- 🔴 **Unhealthy** (50+ µg/m³): Health warnings for sensitive groups

## 🐳 Docker Deployment

### Option 1 — Docker Compose (recommended)

```bash
# spin everything up (builds image on first run)
docker compose up --build
```

The application will be reachable at <http://localhost:8000>.

### Option 2 — plain Docker

```bash
docker build -t skywash .
docker run -p 8000:8000 skywash
```

The image is built with a demo WAQI token
`d637fde34e7053b3d3110c41de9b9ed82fa9e65e`. Override it at build or run time with `--build-arg WAQI_API_TOKEN=<your_token>` or `-e WAQI_API_TOKEN=<your_token>` respectively if you have your own token.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Test with real API data
5. Submit a pull request

## 📄 License

This project is for educational and non-commercial use. Real-time data provided by WAQI must include proper attribution as per their terms of service.

## 🙏 Credits

- **Data**: World Air Quality Index Project and global EPA agencies
- **Design**: Inspired by NASA Worldview and Observable
- **Libraries**: FastAPI, React, Chart.js, Leaflet, Bootstrap
