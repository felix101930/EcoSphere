import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
import time
from pathlib import Path

# Import weather service - ensure it's in the same directory
try:
    from weather_service import weather_service
    print(f"Weather service imported successfully", file=sys.stderr)
except ImportError as e:
    print(f"Failed to import weather_service: {e}", file=sys.stderr)
    # Create a dummy weather service
    class DummyWeatherService:
        def get_weather_forecast(self, *args, **kwargs):
            print(f"Using dummy weather service (no real data)", file=sys.stderr)
            return None
        def get_api_stats(self):
            return {'calls_today': 0, 'max_calls_per_day': 950, 'remaining_calls': 950}
    
    weather_service = DummyWeatherService()

class SolarForecastService:
    def __init__(self, model_path='solar_forecast_openweather.pkl'):
        """Load trained model"""
        print(f"Loading ML model from {model_path}", file=sys.stderr)
        
        try:
            # Resolve relative path to absolute path based on script location
            if not os.path.isabs(model_path):
                model_path = os.path.join(os.path.dirname(__file__), model_path)
            
            # Load the model package
            self.model_data = joblib.load(model_path)
            self.model = self.model_data['model']
            self.feature_names = self.model_data['feature_names']
            self.scaler = self.model_data['scaler']
            self.metrics = self.model_data.get('metrics', {})
            
            print(f"Model loaded: {type(self.model).__name__}", file=sys.stderr)
            print(f"R² score: {self.metrics.get('r2', 0):.3f}", file=sys.stderr)
            print(f"Features: {len(self.feature_names)}", file=sys.stderr)
            
            # Default coordinates (Calgary)
            self.lat = 51.0447
            self.lon = -114.0719
            
            # Result cache
            self.result_cache_dir = Path(__file__).parent / 'result_cache'
            self.result_cache_dir.mkdir(exist_ok=True)
            
            # Print first 10 features for debugging
            print(f"First 10 features:", file=sys.stderr)
            for i, feat in enumerate(self.feature_names[:10]):
                print(f"   {i+1}. {feat}", file=sys.stderr)
            
        except Exception as e:
            print(f"Failed to load model: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            raise
    
    def _get_result_cache_key(self, start_date, end_date, lat, lon, use_weather):
        """Generate cache key for results"""
        import hashlib
        cache_str = f"{start_date}_{end_date}_{lat}_{lon}_{use_weather}"
        return hashlib.md5(cache_str.encode()).hexdigest()
    
    def _get_cached_result(self, cache_key, max_age_minutes=10):
        """Get cached result if available and fresh"""
        cache_path = self.result_cache_dir / f"{cache_key}.json"
        
        if cache_path.exists():
            file_age = time.time() - cache_path.stat().st_mtime
            if file_age <= (max_age_minutes * 60):
                print(f"📦 Using cached forecast result", file=sys.stderr)
                with open(cache_path, 'r') as f:
                    return json.load(f)
        
        return None
    
    def _cache_result(self, cache_key, result):
        """Cache forecast result"""
        cache_path = self.result_cache_dir / f"{cache_key}.json"
        
        result['_cached'] = {
            'cached_at': datetime.now().isoformat(),
            'cache_key': cache_key
        }
        
        with open(cache_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Cached forecast result", file=sys.stderr)
    
    def create_features_from_datetime(self, dt, weather_data=None):
        """Create features from datetime object with optional weather data"""
        features = {}
        
        # Time features
        hour = dt.hour
        month = dt.month
        day_of_year = dt.timetuple().tm_yday
        
        # Add weather data if provided
        if weather_data:
            # Ensure all expected weather features are present
            weather_map = {
                'uv_index': weather_data.get('uv_index', 1.0),
                'temperature_c': weather_data.get('temperature_c', 15.0),
                'humidity_pct': weather_data.get('humidity_pct', 50.0),
                'pressure_kpa': weather_data.get('pressure_kpa', 101.3),
                'dew_point_c': weather_data.get('dew_point_c', 10.0),
                'wind_speed_ms': weather_data.get('wind_speed_ms', 3.0),
                'wind_direction_deg': weather_data.get('wind_direction_deg', 180.0),
                'clouds_pct': weather_data.get('clouds_pct', 50.0),
                'visibility_m': weather_data.get('visibility_m', 10000.0),
                'precipitation_mmh': weather_data.get('precipitation_mmh', 0.0)
            }
            features.update(weather_map)
        else:
            # Default values if no weather data
            features.update({
                'uv_index': 1.0,
                'temperature_c': 15.0,
                'humidity_pct': 50.0,
                'pressure_kpa': 101.3,
                'dew_point_c': 10.0,
                'wind_speed_ms': 3.0,
                'wind_direction_deg': 180.0,
                'clouds_pct': 50.0,
                'visibility_m': 10000.0,
                'precipitation_mmh': 0.0
            })
        
        # Circular time features (CRITICAL for ML)
        features['hour_sin'] = np.sin(2 * np.pi * hour / 24)
        features['hour_cos'] = np.cos(2 * np.pi * hour / 24)
        features['month_sin'] = np.sin(2 * np.pi * month / 12)
        features['month_cos'] = np.cos(2 * np.pi * month / 12)
        features['day_of_year_sin'] = np.sin(2 * np.pi * day_of_year / 365)
        features['day_of_year_cos'] = np.cos(2 * np.pi * day_of_year / 365)
        
        # Additional features
        features['is_daylight'] = 1 if 6 <= hour <= 21 else 0
        
        # Season (0=winter, 1=spring, 2=summer, 3=fall)
        if month in [12, 1, 2]:
            features['season'] = 0
        elif month in [3, 4, 5]:
            features['season'] = 1
        elif month in [6, 7, 8]:
            features['season'] = 2
        else:
            features['season'] = 3
        
        # Day length (Calgary-specific)
        day_lengths = {
            1: 8.5, 2: 10.0, 3: 11.8, 4: 13.7, 5: 15.3,
            6: 16.3, 7: 16.0, 8: 14.5, 9: 12.7, 10: 10.8,
            11: 9.1, 12: 8.2
        }
        features['day_length_hours'] = day_lengths.get(month, 12.0)
        
        # Additional derived features
        features['hour'] = hour
        features['month'] = month
        features['day_of_week'] = dt.weekday()
        features['day_of_year'] = day_of_year
        
        return features
    
    def predict_for_datetime(self, dt, weather_data=None):
        """Predict solar generation for a specific datetime"""
        # Create features
        features = self.create_features_from_datetime(dt, weather_data)
        
        # Create DataFrame
        features_df = pd.DataFrame([features])
        
        # Ensure all required features exist
        missing_features = []
        for req_feature in self.feature_names:
            if req_feature not in features_df.columns:
                missing_features.append(req_feature)
                # Add sensible default based on feature name
                if 'uv' in req_feature:
                    features_df[req_feature] = 1.0
                elif 'temp' in req_feature:
                    features_df[req_feature] = 15.0
                elif 'cloud' in req_feature:
                    features_df[req_feature] = 50.0
                elif any(x in req_feature for x in ['sin', 'cos']):
                    features_df[req_feature] = 0.0
                else:
                    features_df[req_feature] = 0.0
        
        if missing_features:
            print(f"Missing {len(missing_features)} features (filled with defaults)", file=sys.stderr)
        
        # Reorder to match training features
        features_df = features_df[self.feature_names]
        
        # Scale features
        features_scaled = self.scaler.transform(features_df)
        
        # Predict (model was trained on log1p transformed data)
        prediction_log1p = self.model.predict(features_scaled)[0]
        
        # Convert back to kW (expm1 is inverse of log1p)
        prediction_kw = np.expm1(prediction_log1p)
        
        # Ensure non-negative
        return max(0, float(prediction_kw)), missing_features
    
    def predict_range(self, start_date_str, end_date_str, lat=None, lon=None, use_weather=True, force_fresh=False):
        """
        Predict for a date range with constraints:
        - Maximum 48 hours from current time
        - Uses caching for 10 minutes
        - Respects API rate limits
        """
        try:
            # Set coordinates
            current_lat = lat or self.lat
            current_lon = lon or self.lon
            
            # Calculate date range constraints
            current_time = datetime.now()
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
            
            print(f"Current time: {current_time}", file=sys.stderr)
            print(f"Requested: {start_date_str} to {end_date_str}", file=sys.stderr)
            
            # Check result cache first
            cache_key = self._get_result_cache_key(start_date_str, end_date_str, current_lat, current_lon, use_weather)
            if not force_fresh:
                cached_result = self._get_cached_result(cache_key)
                if cached_result:
                    return cached_result
            
            # Get weather data if requested
            weather_forecast = None
            if use_weather:
                print(f"Fetching weather data...", file=sys.stderr)
                weather_forecast = weather_service.get_weather_forecast(
                    current_lat, current_lon, 
                    start_date_str, end_date_str,
                    force_fresh=force_fresh
                )
                
                if weather_forecast:
                    print(f"Weather data received", file=sys.stderr)
                    for date_key, hours in weather_forecast.items():
                        if hours:
                            print(f"   {date_key}: {len(hours)} hours available", file=sys.stderr)
                else:
                    print(f"Could not fetch weather data, using default values", file=sys.stderr)
            
            # Get API stats
            api_stats = weather_service.get_api_stats()
            
            # Start from next whole hour
            next_hour = current_time.replace(minute=0, second=0, microsecond=0)
            if current_time.minute > 0 or current_time.second > 0:
                next_hour += timedelta(hours=1)
            
            predictions = []
            missing_features_total = []
            
            print(f"Starting predictions from {next_hour.strftime('%H:%M')}...", file=sys.stderr)
            
            # Predict for next 48 hours, but only daylight hours
            for hour_offset in range(48):
                prediction_time = next_hour + timedelta(hours=hour_offset)
                
                # Stop if past end date
                if prediction_time.date() > end_date.date():
                    break
                
                hour = prediction_time.hour
                
                # Only predict for daylight hours (6 AM to 9 PM)
                if 6 <= hour <= 21:
                    try:
                        date_str = prediction_time.strftime("%Y-%m-%d")
                        
                        # Get weather data for this exact hour
                        hour_weather = None
                        if weather_forecast and date_str in weather_forecast:
                            # Find exact hour match
                            for weather_hour in weather_forecast[date_str]:
                                if weather_hour['hour'] == hour:
                                    hour_weather = weather_hour
                                    break
                        
                        # Make prediction
                        predicted_kw, missing = self.predict_for_datetime(prediction_time, hour_weather)
                        missing_features_total.extend(missing)
                        
                        # Prepare prediction data
                        prediction_data = {
                            'timestamp': prediction_time.replace(minute=0, second=0, microsecond=0).isoformat(),
                            'predicted_kw': round(predicted_kw, 2),
                            'hour': hour,
                            'date': date_str,
                            'is_daylight': 1,
                            'is_forecast': 1 if prediction_time > current_time else 0
                        }
                        
                        # Add weather info if available
                        if hour_weather:
                            prediction_data['weather'] = {
                                'uv_index': hour_weather.get('uv_index', 0),
                                'temperature_c': hour_weather.get('temperature_c', 0),
                                'clouds_pct': hour_weather.get('clouds_pct', 0),
                                'precipitation_mmh': hour_weather.get('precipitation_mmh', 0),
                                'weather_main': hour_weather.get('weather_main', 'Clear'),
                                'weather_description': hour_weather.get('weather_description', 'clear sky')
                            }
                            print(f"   {prediction_time.strftime('%H:%M')}: {predicted_kw:.2f} kW | "
                                  f"UV: {hour_weather.get('uv_index', 0):.1f} | "
                                  f"Clouds: {hour_weather.get('clouds_pct', 0)}%", file=sys.stderr)
                        else:
                            print(f"   {prediction_time.strftime('%H:%M')}: {predicted_kw:.2f} kW (no weather)", file=sys.stderr)
                        
                        predictions.append(prediction_data)
                        
                    except Exception as e:
                        print(f"Prediction failed for {prediction_time}: {e}", file=sys.stderr)
                        predictions.append({
                            'timestamp': prediction_time.isoformat(),
                            'predicted_kw': 0,
                            'hour': hour,
                            'date': prediction_time.strftime("%Y-%m-%d"),
                            'is_daylight': 1,
                            'error': str(e)
                        })
                else:
                    # Skip nighttime hours
                    if hour_offset == 0:  # Only print once
                        print(f"   Skipping nighttime hours (only 6 AM to 9 PM)", file=sys.stderr)
            
            print(f"Generated {len(predictions)} predictions", file=sys.stderr)
            
            # If no predictions, create at least one
            if len(predictions) == 0:
                print(f"No predictions - creating default prediction", file=sys.stderr)
                predicted_kw, _ = self.predict_for_datetime(current_time)
                predictions.append({
                    'timestamp': current_time.isoformat(),
                    'predicted_kw': round(predicted_kw, 2),
                    'hour': current_time.hour,
                    'date': current_time.strftime("%Y-%m-%d"),
                    'is_daylight': 1 if 6 <= current_time.hour <= 21 else 0,
                    'is_forecast': 0,
                    'is_fallback': True
                })
            
            # Calculate summary
            valid_predictions = [p for p in predictions if 'error' not in p]
            total_kwh = sum(p['predicted_kw'] for p in valid_predictions)
            peak_kw = max(p['predicted_kw'] for p in valid_predictions) if valid_predictions else 0
            
            # Weather quality metrics
            weather_data_available = any('weather' in p for p in predictions)
            
            # Prepare result
            result = {
                'success': True,
                'data': predictions,
                'summary': {
                    'total_kwh': round(total_kwh, 2),
                    'peak_kw': round(peak_kw, 2),
                    'prediction_count': len(predictions),
                    'valid_predictions': len(valid_predictions),
                    'date_range': {
                        'start': predictions[0]['date'] if predictions else start_date_str,
                        'end': predictions[-1]['date'] if predictions else end_date_str,
                        'actual_start': predictions[0]['timestamp'] if predictions else start_date_str,
                        'actual_end': predictions[-1]['timestamp'] if predictions else end_date_str,
                        'hours_predicted': len(predictions)
                    },
                    'avg_kw_per_day': round(total_kwh / max(1, len(set(p['date'] for p in predictions))), 2),
                    'weather_quality': {
                        'weather_data_available': weather_data_available,
                        'api_calls_remaining': api_stats['remaining_calls']
                    }
                },
                'model_info': {
                    'name': type(self.model).__name__,
                    'r2_score': self.metrics.get('r2', 0),
                    'features_used': len(self.feature_names),
                    'missing_features': len(set(missing_features_total)),
                    'weather_integrated': use_weather
                },
                'api_stats': api_stats,
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'coordinates': {
                        'lat': current_lat,
                        'lon': current_lon
                    },
                    'time_constraints': {
                        'max_hours_ahead': 48,
                        'current_time': current_time.isoformat(),
                        'hours_predicted': len(predictions)
                    },
                    'cache_info': {
                        'weather_cache_minutes': 10,
                        'result_cache_minutes': 10,
                        'used_cached_data': False  # This is fresh
                    }
                }
            }
            
            # Add warning if using fallback weather
            if not weather_data_available and use_weather:
                result['warning'] = "Using default weather values (API unavailable or rate limited)"
            
            # Cache the result
            self._cache_result(cache_key, result)
            
            return result
            
        except Exception as e:
            print(f"Forecast generation failed: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            
            # Return fallback result
            return {
                'success': False,
                'error': str(e),
                'data': [],
                'summary': {
                    'total_kwh': 0,
                    'peak_kw': 0,
                    'prediction_count': 0
                },
                'model_info': {
                    'name': 'Error',
                    'weather_integrated': False
                },
                'api_stats': weather_service.get_api_stats() if 'weather_service' in locals() else {},
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'is_fallback': True
                }
            }

def main():
    """Command-line interface for Node.js"""
    import sys
    
    if len(sys.argv) < 3:
        error_result = {
            'success': False,
            'error': 'Missing arguments',
            'usage': 'python node_service.py <start_date> <end_date> [lat] [lon] [use_weather] [force_fresh]'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
    
    start_date = sys.argv[1]
    end_date = sys.argv[2]
    
    # Optional parameters
    lat = float(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] != 'null' else None
    lon = float(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] != 'null' else None
    use_weather = sys.argv[5].lower() != 'false' if len(sys.argv) > 5 else True
    force_fresh = sys.argv[6].lower() == 'true' if len(sys.argv) > 6 else False
    
    try:
        # Initialize service
        service = SolarForecastService('solar_forecast_openweather.pkl')
        
        # Get predictions
        result = service.predict_range(start_date, end_date, lat, lon, use_weather, force_fresh)
        
        # Output JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()