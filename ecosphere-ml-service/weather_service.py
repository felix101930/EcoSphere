import requests
import os
import json
from datetime import datetime, timedelta
import hashlib
import time
from pathlib import Path
import sys

class WeatherService:
    def __init__(self, api_key=None):
        # Use provided API key or get from environment
        self.api_key = api_key or os.environ.get('OPENWEATHER_API_KEY', '')
        if not self.api_key:
            # Fallback to a test key if none provided
            self.api_key = 'test_api_key'
            
        self.base_url = "https://api.openweathermap.org/data/3.0/onecall"
        self.cache_dir = Path(__file__).parent / 'weather_cache'
        self.cache_dir.mkdir(exist_ok=True)
        
        # Rate limiting (950 calls/day)
        self.max_calls_per_day = 950
        self.call_log_file = self.cache_dir / 'api_calls.json'
        self._init_call_log()
        
        print(f"WeatherService initialized with API key: {'Yes' if self.api_key else 'No'}", file=sys.stderr)
        
    def _init_call_log(self):
        """Initialize or load API call log"""
        if not self.call_log_file.exists():
            self.call_log = {
                'today': datetime.now().strftime('%Y-%m-%d'),
                'calls_today': 0,
                'last_reset': datetime.now().isoformat(),
                'history': []
            }
            self._save_call_log()
        else:
            with open(self.call_log_file, 'r') as f:
                self.call_log = json.load(f)
            
            # Reset if it's a new day
            today = datetime.now().strftime('%Y-%m-%d')
            if self.call_log['today'] != today:
                self.call_log['today'] = today
                self.call_log['calls_today'] = 0
                self.call_log['last_reset'] = datetime.now().isoformat()
                self._save_call_log()
    
    def _save_call_log(self):
        """Save API call log to file"""
        with open(self.call_log_file, 'w') as f:
            json.dump(self.call_log, f, indent=2)
    
    def _check_rate_limit(self):
        """Check if we can make another API call"""
        today = datetime.now().strftime('%Y-%m-%d')
        
        if self.call_log['today'] != today:
            # New day, reset counter
            self.call_log['today'] = today
            self.call_log['calls_today'] = 0
            self.call_log['last_reset'] = datetime.now().isoformat()
        
        return self.call_log['calls_today'] < self.max_calls_per_day
    
    def _log_api_call(self, endpoint, success=True):
        """Log an API call"""
        self.call_log['calls_today'] += 1
        self.call_log['history'].append({
            'timestamp': datetime.now().isoformat(),
            'endpoint': endpoint,
            'success': success
        })
        
        # Keep only last 1000 entries
        if len(self.call_log['history']) > 1000:
            self.call_log['history'] = self.call_log['history'][-1000:]
        
        self._save_call_log()
        
        print(f"API calls today: {self.call_log['calls_today']}/{self.max_calls_per_day}", file=sys.stderr)
    
    def _get_cache_key(self, lat, lon, start_date, end_date):
        """Generate cache key for weather data"""
        cache_str = f"{lat}_{lon}_{start_date}_{end_date}"
        return hashlib.md5(cache_str.encode()).hexdigest()
    
    def _get_cache_path(self, cache_key):
        """Get cache file path"""
        return self.cache_dir / f"{cache_key}.json"
    
    def _is_cache_valid(self, cache_path, max_age_minutes=10):
        """Check if cache is still valid"""
        if not cache_path.exists():
            return False
        
        # Check file age
        file_age = time.time() - cache_path.stat().st_mtime
        return file_age <= (max_age_minutes * 60)
    
    def get_cached_weather(self, lat, lon, start_date, end_date):
        """Get weather from cache if available and fresh"""
        cache_key = self._get_cache_key(lat, lon, start_date, end_date)
        cache_path = self._get_cache_path(cache_key)
        
        if self._is_cache_valid(cache_path):
            print(f"Using cached weather data (fresh)", file=sys.stderr)
            with open(cache_path, 'r') as f:
                return json.load(f)
        
        return None
    
    def _save_to_cache(self, lat, lon, start_date, end_date, data):
        """Save weather data to cache"""
        cache_key = self._get_cache_key(lat, lon, start_date, end_date)
        cache_path = self._get_cache_path(cache_key)
        
        with open(cache_path, 'w') as f:
            json.dump({
                'data': data,
                'cached_at': datetime.now().isoformat(),
                'lat': lat,
                'lon': lon,
                'date_range': f"{start_date}_{end_date}"
            }, f, indent=2)
        
        print(f"Saved weather data to cache", file=sys.stderr)
    
    def get_weather_forecast(self, lat, lon, start_date, end_date, force_fresh=False):
        """
        Get weather forecast with caching and rate limiting
        Returns forecast for maximum 48 hours from current time
        """
        try:
            print(f"Getting weather for {lat},{lon} from {start_date} to {end_date}", file=sys.stderr)
            
            # Calculate date range constraints
            current_time = datetime.now()
            end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
            start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")
            
            # Adjust to max 48 hours from now
            max_end_date = current_time + timedelta(hours=48)
            if end_date_dt > max_end_date:
                print(f"Limiting forecast to 48 hours from now", file=sys.stderr)
                end_date_dt = max_end_date
                end_date = end_date_dt.strftime("%Y-%m-%d")
            
            # Check cache first (unless force_fresh)
            if not force_fresh:
                cached_data = self.get_cached_weather(lat, lon, start_date, end_date)
                if cached_data:
                    return cached_data['data']
            
            # Check rate limit
            if not self._check_rate_limit():
                print(f"Rate limit reached ({self.max_calls_per_day}/day). Using cached data if available.", file=sys.stderr)
                # Try to get any cached data, even if not fresh
                cache_key = self._get_cache_key(lat, lon, start_date, end_date)
                cache_path = self._get_cache_path(cache_key)
                if cache_path.exists():
                    with open(cache_path, 'r') as f:
                        cached = json.load(f)
                        print(f"Using cached weather data (stale)", file=sys.stderr)
                        return cached['data']
                return None
            
            # Make API call
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric',
                'exclude': 'minutely,daily,alerts'
            }
            
            print(f"Fetching fresh weather data from API...", file=sys.stderr)
            print(f"   URL: {self.base_url}", file=sys.stderr)
            print(f"   Params: lat={lat}, lon={lon}", file=sys.stderr)
            
            response = requests.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            weather_data = response.json()
            
            # Log successful API call
            self._log_api_call('onecall', success=True)
            
            # Process hourly forecasts
            forecasts = {}
            current_date = current_time.date()
            
            # Get data for today and tomorrow
            for day_offset in range(2):  # Today and tomorrow
                date = current_date + timedelta(days=day_offset)
                date_str = date.strftime("%Y-%m-%d")
                forecasts[date_str] = []
                
                for hour in range(0, 24):
                    target_time = datetime.combine(date, datetime.min.time()).replace(hour=hour)
                    
                    # Skip if more than 48 hours in future
                    if (target_time - current_time).total_seconds() > 48 * 3600:
                        continue
                    
                    closest_forecast = self._find_closest_hourly(weather_data['hourly'], target_time)
                    if closest_forecast:
                        forecasts[date_str].append({
                            'hour': hour,
                            'timestamp': target_time.isoformat(),
                            'uv_index': closest_forecast.get('uvi', 0),
                            'temperature_c': closest_forecast.get('temp', 15),
                            'humidity_pct': closest_forecast.get('humidity', 50),
                            'pressure_kpa': closest_forecast.get('pressure', 1013) / 10.0,
                            'dew_point_c': closest_forecast.get('dew_point', 10),
                            'wind_speed_ms': closest_forecast.get('wind_speed', 3),
                            'wind_direction_deg': closest_forecast.get('wind_deg', 0),
                            'clouds_pct': closest_forecast.get('clouds', 50),
                            'visibility_m': closest_forecast.get('visibility', 10000),
                            'precipitation_mmh': self._get_precipitation(closest_forecast),
                            'weather_main': closest_forecast.get('weather', [{}])[0].get('main', 'Clear'),
                            'weather_description': closest_forecast.get('weather', [{}])[0].get('description', 'clear sky')
                        })
            
            # Debug: show what we got
            print(f"Received weather data for:", file=sys.stderr)
            for date_str, hours in forecasts.items():
                if hours:
                    print(f"   {date_str}: {len(hours)} hours (hours: {[h['hour'] for h in hours[:5]]}...)", file=sys.stderr)
            
            # Cache the results
            self._save_to_cache(lat, lon, start_date, end_date, forecasts)
            
            return forecasts
            
        except requests.exceptions.RequestException as e:
            print(f"Weather API error: {e}", file=sys.stderr)
            self._log_api_call('onecall', success=False)
            return None
        except Exception as e:
            print(f"Unexpected error in get_weather_forecast: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return None
    
    def _find_closest_hourly(self, hourly_data, target_time):
        """Find closest hourly forecast to target time"""
        target_timestamp = target_time.timestamp()
        
        closest = None
        min_diff = float('inf')
        
        for forecast in hourly_data:
            diff = abs(forecast['dt'] - target_timestamp)
            if diff < min_diff:
                min_diff = diff
                closest = forecast
        
        return closest if min_diff <= 3600 else None
    
    def _get_precipitation(self, forecast):
        """Extract precipitation amount"""
        rain = forecast.get('rain', {}).get('1h', 0)
        snow = forecast.get('snow', {}).get('1h', 0)
        return rain + snow
    
    def get_api_stats(self):
        """Get API usage statistics"""
        return {
            'calls_today': self.call_log['calls_today'],
            'max_calls_per_day': self.max_calls_per_day,
            'remaining_calls': self.max_calls_per_day - self.call_log['calls_today'],
            'last_reset': self.call_log['last_reset'],
            'today': self.call_log['today']
        }

# Singleton instance with API key
weather_service = WeatherService()