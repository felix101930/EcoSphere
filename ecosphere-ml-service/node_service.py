"""
Simple ML Service for Node.js Integration
Uses existing trained model
"""
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

# Add the virtual environment site-packages
venv_path = os.path.join(os.path.dirname(__file__), 'venv')
if os.path.exists(venv_path):
    site_packages = os.path.join(venv_path, 'Lib', 'site-packages')
    if os.path.exists(site_packages):
        sys.path.insert(0, site_packages)

class SolarForecastService:
    def __init__(self, model_path='solar_forecast_openweather.pkl'):
        """Load trained model"""
        print(f"Loading ML model from {model_path}", file=sys.stderr)
        
        try:
            # Load the model package
            self.model_data = joblib.load(model_path)
            self.model = self.model_data['model']
            self.feature_names = self.model_data['feature_names']
            self.scaler = self.model_data['scaler']
            self.metrics = self.model_data.get('metrics', {})
            
            print(f"Model loaded: {type(self.model).__name__}", file=sys.stderr)
            print(f"R² score: {self.metrics.get('r2', 0):.3f}", file=sys.stderr)
            print(f"Features: {len(self.feature_names)}", file=sys.stderr)
            
        except Exception as e:
            print(f"Failed to load model: {e}", file=sys.stderr)
            raise
    
    def create_features_from_datetime(self, dt):
        """Create features from datetime object"""
        features = {}
        
        # Time features
        hour = dt.hour
        month = dt.month
        day_of_year = dt.timetuple().tm_yday
        
        # Required features from your metadata
        features['uv_index'] = 1.0  # Default, will be updated with real weather
        features['temperature_c'] = 15.0
        features['humidity_pct'] = 50.0
        features['pressure_kpa'] = 101.3
        features['dew_point_c'] = 10.0
        features['wind_speed_ms'] = 3.0
        features['wind_direction_deg'] = 180.0
        features['precipitation_mmh'] = 0.0
        
        # Circular time features
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
        
        # Day length (Calgary)
        day_lengths = {
            1: 8.5, 2: 10.0, 3: 11.8, 4: 13.7, 5: 15.3,
            6: 16.3, 7: 16.0, 8: 14.5, 9: 12.7, 10: 10.8,
            11: 9.1, 12: 8.2
        }
        features['day_length_hours'] = day_lengths.get(month, 12.0)
        
        return features
    
    def predict_for_datetime(self, dt, weather_data=None):
        """Predict solar generation for a specific datetime"""
        # Create base features
        features = self.create_features_from_datetime(dt)
        
        # Update with weather data if provided
        if weather_data:
            features.update(weather_data)
        
        # Create DataFrame
        features_df = pd.DataFrame([features])
        
        # Ensure all required features exist
        for req_feature in self.feature_names:
            if req_feature not in features_df.columns:
                print(f"Missing feature: {req_feature}, using 0", file=sys.stderr)
                features_df[req_feature] = 0
        
        # Reorder to match training features
        features_df = features_df[self.feature_names]
        
        # Scale features
        features_scaled = self.scaler.transform(features_df)
        
        # Predict (model was trained on log1p transformed data)
        prediction_log1p = self.model.predict(features_scaled)[0]
        
        # Convert back to kW (expm1 is inverse of log1p)
        prediction_kw = np.expm1(prediction_log1p)
        
        return max(0, float(prediction_kw))
    
    def predict_range(self, start_date_str, end_date_str, interval_hours=1):
        """Predict for a date range"""
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        
        predictions = []
        current_date = start_date
        
        while current_date <= end_date:
            # Predict for each hour of the day
            for hour in range(0, 24, interval_hours):
                if hour % interval_hours != 0:
                    continue
                    
                prediction_time = current_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                
                # Only predict during daylight hours (6 AM to 9 PM for solar)
                if 6 <= hour <= 21:
                    try:
                        predicted_kw = self.predict_for_datetime(prediction_time)
                        
                        predictions.append({
                            'timestamp': prediction_time.isoformat(),
                            'predicted_kw': round(predicted_kw, 2),
                            'hour': hour,
                            'date': prediction_time.strftime("%Y-%m-%d"),
                            'is_daylight': 1
                        })
                    except Exception as e:
                        print(f"Prediction failed for {prediction_time}: {e}", file=sys.stderr)
                        predictions.append({
                            'timestamp': prediction_time.isoformat(),
                            'predicted_kw': 0,
                            'hour': hour,
                            'date': prediction_time.strftime("%Y-%m-%d"),
                            'is_daylight': 1 if 6 <= hour <= 21 else 0,
                            'error': str(e)
                        })
            
            current_date += timedelta(days=1)
        
        return predictions

def main():
    """Command-line interface for Node.js"""
    if len(sys.argv) < 3:
        error_result = {
            'success': False,
            'error': 'Missing arguments',
            'usage': 'python simple_service.py <start_date> <end_date>'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
    
    start_date = sys.argv[1]
    end_date = sys.argv[2]
    
    try:
        # Initialize service
        service = SolarForecastService('solar_forecast_openweather.pkl')
        
        # Get predictions
        predictions = service.predict_range(start_date, end_date)
        
        # Calculate summary
        total_kwh = sum(p['predicted_kw'] for p in predictions)
        peak_kw = max(p['predicted_kw'] for p in predictions) if predictions else 0
        
        # Prepare response
        result = {
            'success': True,
            'data': predictions,
            'summary': {
                'total_kwh': round(total_kwh, 2),
                'peak_kw': round(peak_kw, 2),
                'prediction_count': len(predictions),
                'date_range': {
                    'start': start_date,
                    'end': end_date
                },
                'avg_kw_per_day': round(total_kwh / len(set(p['date'] for p in predictions)), 2) if predictions else 0
            },
            'model_info': {
                'name': type(service.model).__name__,
                'r2_score': service.metrics.get('r2', 0),
                'features_used': len(service.feature_names),
                'training_r2': 0.693  # From your metadata
            },
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'interval_hours': 1
            }
        }
        
        # Output JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'data': [],
            'summary': {
                'total_kwh': 0,
                'peak_kw': 0,
                'prediction_count': 0
            }
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()