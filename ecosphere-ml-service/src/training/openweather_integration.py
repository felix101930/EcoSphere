"""
OPENWEATHER API INTEGRATION FOR SOLAR FORECASTING
Uses OpenWeather One Call API 3.0 to get forecasts and predict solar generation
"""
import requests
import pandas as pd
import numpy as np
from datetime import datetime
import joblib
from typing import Dict, List, Optional

class OpenWeatherSolarForecaster:
    """Predict solar generation using OpenWeather API forecasts"""
    
    def __init__(self, model_path: str, api_key: str):
        """
        Initialize the forecaster.
        
        Args:
            model_path: Path to trained model file (.pkl)
            api_key: OpenWeather API key
        """
        # Load model
        model_data = joblib.load(model_path)
        self.model = model_data['model']
        self.feature_names = model_data['feature_names']
        self.scaler = model_data['scaler']
        self.metrics = model_data.get('metrics', {})
        self.model_name = model_data.get('model_name', 'Unknown')
        
        # API configuration
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/3.0/onecall"
        
        print(f"✅ Loaded {self.model_name} model")
        print(f"   Performance: R²={self.metrics.get('r2', 0):.3f}")
        print(f"   Features: {len(self.feature_names)}")
    
    def get_weather_forecast(self, lat: float, lon: float, units: str = 'metric') -> Dict:
        """
        Get weather forecast from OpenWeather API.
        
        Args:
            lat: Latitude
            lon: Longitude
            units: 'metric', 'imperial', or 'standard'
            
        Returns:
            Dictionary with weather forecast data
        """
        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': units,
            'exclude': 'minutely,alerts'  # We only need hourly forecasts
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ API Error: {e}")
            return {}
    
    def convert_hourly_to_features(self, hourly_data: List[Dict]) -> pd.DataFrame:
        """
        Convert OpenWeather hourly forecast to model features.
        
        Args:
            hourly_data: List of hourly forecast dictionaries from OpenWeather
            
        Returns:
            DataFrame with features for each hour
        """
        features_list = []
        
        for hour_data in hourly_data:
            features = {}
            
            # Direct mappings from OpenWeather API
            features['uv_index'] = hour_data.get('uvi', 0)
            
            # Temperature (already in Celsius if units=metric)
            features['temperature_c'] = hour_data.get('temp', 0)
            
            # Other weather parameters
            features['humidity_pct'] = hour_data.get('humidity', 50)
            features['pressure_kpa'] = hour_data.get('pressure', 1013) / 10.0  # hPa to kPa
            features['dew_point_c'] = hour_data.get('dew_point', 0)
            features['wind_speed_ms'] = hour_data.get('wind_speed', 0)
            features['wind_direction_deg'] = hour_data.get('wind_deg', 0)
            features['clouds_pct'] = hour_data.get('clouds', 0)
            features['visibility_m'] = hour_data.get('visibility', 10000)
            
            # Precipitation (combine rain and snow)
            rain = hour_data.get('rain', {}).get('1h', 0)
            snow = hour_data.get('snow', {}).get('1h', 0)
            features['precipitation_mmh'] = rain + snow
            
            # Time features from timestamp
            dt = datetime.fromtimestamp(hour_data['dt'])
            hour = dt.hour
            month = dt.month
            day_of_year = dt.timetuple().tm_yday
            
            # Circular time features
            features['hour_sin'] = np.sin(2 * np.pi * hour / 24)
            features['hour_cos'] = np.cos(2 * np.pi * hour / 24)
            features['month_sin'] = np.sin(2 * np.pi * month / 12)
            features['month_cos'] = np.cos(2 * np.pi * month / 12)
            features['day_of_year_sin'] = np.sin(2 * np.pi * day_of_year / 365)
            features['day_of_year_cos'] = np.cos(2 * np.pi * day_of_year / 365)
            
            # Daylight flag (6 AM to 9 PM)
            features['is_daylight'] = 1 if 6 <= hour <= 21 else 0
            
            # Season
            if month in [12, 1, 2]:
                features['season'] = 0  # Winter
            elif month in [3, 4, 5]:
                features['season'] = 1  # Spring
            elif month in [6, 7, 8]:
                features['season'] = 2  # Summer
            else:
                features['season'] = 3  # Fall
            
            # Day length estimate (for Calgary - adjust for your location)
            day_lengths = {
                1: 8.5, 2: 10.0, 3: 11.8, 4: 13.7, 5: 15.3,
                6: 16.3, 7: 16.0, 8: 14.5, 9: 12.7, 10: 10.8,
                11: 9.1, 12: 8.2
            }
            features['day_length_hours'] = day_lengths.get(month, 12.0)
            
            features_list.append(features)
        
        return pd.DataFrame(features_list)
    
    def predict_solar_generation(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """
        Predict solar generation from features.
        
        Args:
            features_df: DataFrame with features for each hour
            
        Returns:
            DataFrame with predictions
        """
        # Ensure all required features exist
        for feature in self.feature_names:
            if feature not in features_df.columns:
                features_df[feature] = 0
        
        # Scale features
        features_scaled = self.scaler.transform(features_df[self.feature_names])
        
        # Predict (log1p scale)
        predictions_log1p = self.model.predict(features_scaled)
        
        # Convert to kW (expm1 for log1p)
        predictions_kw = np.expm1(predictions_log1p)
        
        # Create results DataFrame
        results = features_df.copy()
        results['predicted_kw'] = predictions_kw
        
        # Add UV index for reference
        if 'uv_index' in results.columns:
            results['uv_index'] = results['uv_index']
        
        return results
    
    def forecast_solar(self, lat: float, lon: float, hours: int = 48) -> pd.DataFrame:
        """
        Complete solar forecasting pipeline.
        
        Args:
            lat: Latitude
            lon: Longitude
            hours: Number of hours to forecast (max 48)
            
        Returns:
            DataFrame with solar predictions for each hour
        """
        print(f"🌤️  Getting weather forecast for lat={lat}, lon={lon}...")
        
        # Get weather forecast
        weather_data = self.get_weather_forecast(lat, lon, units='metric')
        
        if not weather_data or 'hourly' not in weather_data:
            print("❌ No hourly forecast data available")
            return pd.DataFrame()
        
        # Get hourly data (limit to requested hours)
        hourly_data = weather_data['hourly'][:hours]
        
        print(f"✅ Got {len(hourly_data)} hours of forecast data")
        
        # Convert to features
        features_df = self.convert_hourly_to_features(hourly_data)
        
        # Predict solar generation
        predictions_df = self.predict_solar_generation(features_df)
        
        # Add timestamps
        timestamps = [datetime.fromtimestamp(h['dt']) for h in hourly_data]
        predictions_df['timestamp'] = timestamps
        
        # Filter to daylight hours only for solar predictions
        solar_hours = predictions_df[predictions_df['is_daylight'] == 1].copy()
        
        # Add some summary statistics
        if not solar_hours.empty:
            total_kwh = solar_hours['predicted_kw'].sum()
            peak_kw = solar_hours['predicted_kw'].max()
            peak_hour = solar_hours.loc[solar_hours['predicted_kw'].idxmax(), 'timestamp'] if peak_kw > 0 else None
            
            print(f"📊 SOLAR FORECAST SUMMARY:")
            print(f"   Total {hours}h generation: {total_kwh:.1f} kWh")
            print(f"   Peak generation: {peak_kw:.2f} kW")
            if peak_hour:
                print(f"   Peak time: {peak_hour.strftime('%Y-%m-%d %H:%M')}")
            print(f"   Average during daylight: {solar_hours['predicted_kw'].mean():.2f} kW")
            print(f"   Daylight hours: {len(solar_hours)}")
        
        return predictions_df[['timestamp', 'predicted_kw', 'uv_index', 
                               'temperature_c', 'clouds_pct', 'is_daylight']]

# Example usage
if __name__ == "__main__":
    # Configuration
    MODEL_PATH = "solar_forecast_openweather.pkl"
    OPENWEATHER_API_KEY = "your_api_key_here"  # Get from https://openweathermap.org/api
    
    # Calgary coordinates
    CALGARY_LAT = 51.0447
    CALGARY_LON = -114.0719
    
    # Initialize forecaster
    forecaster = OpenWeatherSolarForecaster(MODEL_PATH, OPENWEATHER_API_KEY)
    
    # Get 48-hour solar forecast
    forecast = forecaster.forecast_solar(CALGARY_LAT, CALGARY_LON, hours=48)
    
    if not forecast.empty:
        print(f"📅 FIRST 12 HOURS OF FORECAST:")
        print(forecast.head(12).to_string())
        
        # Save to CSV
        forecast.to_csv('solar_forecast_48h.csv', index=False)
        print(f"💾 Forecast saved to solar_forecast_48h.csv")
