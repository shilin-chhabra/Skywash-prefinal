from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Dict, Optional
import json, math, os, pathlib
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import asyncio
import aiohttp

# Load environment variables
load_dotenv()

app = FastAPI(title="SkyWash API")

# --------------------------------------------------------------------------- #
#  File & directory paths                                                     #
# --------------------------------------------------------------------------- #
BACKEND_DIR = pathlib.Path(__file__).parent
STATIC_DIR = BACKEND_DIR.parent / "static"
DATA_PATH = BACKEND_DIR / "data" / "cities.json"

# --------------------------------------------------------------------------- #
#  Air Quality API Configuration                                              #
# --------------------------------------------------------------------------- #
WAQI_API_TOKEN = os.getenv("WAQI_API_TOKEN", "demo")  # Use demo token as fallback
WAQI_BASE_URL = "https://api.waqi.info/feed"

# Cache for API responses (to avoid rate limits)
cache: Dict[str, Dict] = {}
CACHE_DURATION = 3600  # 1 hour in seconds

# --------------------------------------------------------------------------- #
#  Data                                                                       #
# --------------------------------------------------------------------------- #
with DATA_PATH.open("r", encoding="utf-8") as f:
    STATIC_CITIES: List[dict] = json.load(f)

# City mapping for WAQI API (some cities need specific names)
CITY_MAPPING = {
    "Delhi": "delhi",
    "Beijing": "beijing", 
    "Lahore": "lahore",
    "Mexico City": "mexico-city",
    "Los Angeles": "los-angeles",
    "London": "london",
    "Sydney": "sydney",
    "Tokyo": "tokyo",
    "Johannesburg": "johannesburg",
    "Paris": "paris",
    
    # North America
    "New York City": "new-york-city",
    "Chicago": "chicago",
    "Houston": "houston",
    "Toronto": "toronto",
    "Dallas": "dallas",
    
    # Western Europe
    "Berlin": "berlin",
    "Madrid": "madrid",
    "Rome": "rome",
    "Barcelona": "barcelona",
    "Amsterdam": "amsterdam",
    "Munich": "munich",
    
    # Eastern Europe
    "Moscow": "moscow",
    "Saint Petersburg": "saint-petersburg",
    "Warsaw": "warsaw",
    "Kyiv": "kyiv",
    "Budapest": "budapest",
    "Bucharest": "bucharest",
    "Prague": "prague",
    
    # Middle East
    "Istanbul": "istanbul",
    "Tehran": "tehran",
    "Baghdad": "baghdad",
    "Riyadh": "riyadh",
    "Dubai": "dubai",
    "Cairo": "cairo",
    
    # South Asia
    "Mumbai": "mumbai",
    "Karachi": "karachi",
    "Dhaka": "dhaka",
    "Bangalore": "bangalore",
    "Kolkata": "kolkata",
    "Chennai": "chennai",
    
    # Southeast Asia
    "Jakarta": "jakarta",
    "Manila": "manila",
    "Bangkok": "bangkok",
    "Ho Chi Minh City": "ho-chi-minh-city",
    "Kuala Lumpur": "kuala-lumpur",
    "Singapore": "singapore",
    "Hanoi": "hanoi",
    
    # East Asia
    "Shanghai": "shanghai",
    "Guangzhou": "guangzhou",
    "Shenzhen": "shenzhen",
    "Seoul": "seoul",
    "Osaka": "osaka",
    
    # Oceania
    "Melbourne": "melbourne",
    "Brisbane": "brisbane",
    "Auckland": "auckland",
    
    # South America
    "Sao Paulo": "sao-paulo",
    "Rio de Janeiro": "rio-de-janeiro",
    "Buenos Aires": "buenos-aires",
    "Lima": "lima",
    "Bogota": "bogota",
    "Santiago": "santiago",
    "Caracas": "caracas",
    
    # Africa
    "Lagos": "lagos",
    "Nairobi": "nairobi"
}

async def fetch_real_time_pm25(city_name: str) -> Optional[float]:
    """Fetch real-time PM2.5 data from WAQI API"""
    cache_key = f"pm25_{city_name}"
    current_time = datetime.now()
    
    # Check cache first
    if cache_key in cache:
        cached_data = cache[cache_key]
        cache_time = datetime.fromisoformat(cached_data["timestamp"])
        if current_time - cache_time < timedelta(seconds=CACHE_DURATION):
            return cached_data["pm25"]
    
    # Map city name for API
    api_city_name = CITY_MAPPING.get(city_name, city_name.lower().replace(" ", "-"))
    
    try:
        async with aiohttp.ClientSession() as session:
            url = f"{WAQI_BASE_URL}/{api_city_name}/?token={WAQI_API_TOKEN}"
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("status") == "ok" and "data" in data:
                        # Extract PM2.5 from WAQI response
                        pm25_data = data["data"].get("iaqi", {}).get("pm25", {})
                        if pm25_data and "v" in pm25_data:
                            try:
                                # Ensure the value is numeric and valid
                                pm25_raw = pm25_data["v"]
                                pm25_value = float(pm25_raw)
                                
                                # Additional validation - PM2.5 should be a reasonable positive number
                                if pm25_value < 0 or pm25_value > 1000:
                                    print(f"Invalid PM2.5 value for {city_name}: {pm25_value}")
                                    return None
                                
                                # Cache the result
                                cache[cache_key] = {
                                    "pm25": pm25_value,
                                    "timestamp": current_time.isoformat(),
                                    "source": "waqi_api"
                                }
                                
                                return pm25_value
                                
                            except (ValueError, TypeError) as e:
                                print(f"Error converting PM2.5 value to float for {city_name}: {pm25_data['v']} - {e}")
                                return None
                            
    except Exception as e:
        print(f"Error fetching real-time data for {city_name}: {e}")
    
    return None

async def get_cities_with_real_time_data() -> List[dict]:
    """Get cities data with real-time PM2.5 values where available"""
    updated_cities = []
    
    # Create tasks for all cities
    tasks = []
    for city in STATIC_CITIES:
        task = fetch_real_time_pm25(city["city"])
        tasks.append((city, task))
    
    # Execute all API calls concurrently
    for city, task in tasks:
        try:
            real_time_pm25 = await task
            updated_city = city.copy()
            
            if real_time_pm25 is not None:
                updated_city["pm25"] = round(real_time_pm25, 1)
                updated_city["data_source"] = "real_time"
                updated_city["last_updated"] = datetime.now().isoformat()
            else:
                updated_city["data_source"] = "static"
                updated_city["last_updated"] = "static_data"
                
            updated_cities.append(updated_city)
            
        except Exception as e:
            print(f"Error processing {city['city']}: {e}")
            # Fallback to static data
            fallback_city = city.copy()
            fallback_city["data_source"] = "static"
            fallback_city["last_updated"] = "static_data"
            updated_cities.append(fallback_city)
    
    return updated_cities

# --------------------------------------------------------------------------- #
#  API routes                                                                 #
# --------------------------------------------------------------------------- #
@app.get("/api/cities")
async def list_cities() -> List[dict]:
    """Get cities with real-time PM2.5 data where available"""
    try:
        cities_data = await get_cities_with_real_time_data()
        return cities_data
    except Exception as e:
        print(f"Error getting real-time data, falling back to static: {e}")
        # Fallback to static data
        fallback_cities = []
        for city in STATIC_CITIES:
            fallback_city = city.copy()
            fallback_city["data_source"] = "static"
            fallback_city["last_updated"] = "static_data"
            fallback_cities.append(fallback_city)
        return fallback_cities

@app.get("/api/cities/refresh")
async def refresh_cities_data() -> dict:
    """Force refresh of cities data (clears cache)"""
    cache.clear()
    cities_data = await get_cities_with_real_time_data()
    
    real_time_count = sum(1 for city in cities_data if city.get("data_source") == "real_time")
    static_count = len(cities_data) - real_time_count
    
    return {
        "message": "Data refreshed successfully",
        "total_cities": len(cities_data),
        "real_time_sources": real_time_count,
        "static_sources": static_count,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/washout")
def washout(
    pm25: float = Query(..., gt=0, description="Initial PM2.5 concentration in µg/m³"),
    rain_mm: float = Query(..., gt=0, description="Rainfall intensity in mm/h"),
    duration_h: float = Query(..., gt=0, description="Duration in hours"),
):
    # Additional validation to ensure parameters are valid numbers
    try:
        # Ensure pm25 is a valid number and not a string/hash
        pm25_value = float(pm25)
        rain_value = float(rain_mm)
        duration_value = float(duration_h)
        
        # Range validation
        if pm25_value <= 0 or pm25_value > 1000:
            raise HTTPException(status_code=400, detail="PM2.5 concentration must be between 0 and 1000 µg/m³")
        if rain_value <= 0 or rain_value > 1000:
            raise HTTPException(status_code=400, detail="Rainfall intensity must be between 0 and 1000 mm/h")
        if duration_value <= 0 or duration_value > 168:  # 1 week max
            raise HTTPException(status_code=400, detail="Duration must be between 0 and 168 hours")
            
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameter values: {str(e)}")
    
    try:
        try:
            k = float(os.getenv("WASHOUT_COEFF", "0.08"))
        except ValueError:
            # If the environment variable is set but not a valid float (e.g. a token string),
            # fall back to the default coefficient and log a warning.
            print("[washout] Invalid WASHOUT_COEFF value – falling back to 0.08")
            k = 0.08
        rainfall = rain_value * duration_value
        final = pm25_value * math.exp(-k * rainfall)
        
        # Ensure final value is not negative
        final = max(0, final)
        
        return {
            "initial": pm25_value, 
            "rainfall_mm": rainfall, 
            "final": round(final, 1),
            "washout_coefficient": k
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# --------------------------------------------------------------------------- #
#  SPA front-end: serve everything in /static at the root path                #
# --------------------------------------------------------------------------- #
from fastapi.staticfiles import StaticFiles

STATIC_DIR = BACKEND_DIR.parent / "static"

# IMPORTANT: register /api routes first (already done above), then mount "/"
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
