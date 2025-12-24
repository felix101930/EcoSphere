"""
SINGLE API CALL TEST: Next Hour Solar Forecast
Converts OpenWeather data to NASA dataset format and makes one prediction
"""
import requests
import pandas as pd
import numpy as np
from datetime import datetime
import joblib

# ============================================
# CONFIGURATION
# ============================================
API_KEY = ""  # Replace with your OpenWeather API key
MODEL_PATH = "solar_forecast_openweather.pkl"
CALGARY_LAT = 51.0447
CALGARY_LON = -114.0719

def make_single_api_call():
    """Make ONE API call to OpenWeather and process the response"""
    print("🔧 MAKING SINGLE API CALL TO OPENWEATHER")
    print("=" * 60)
    
    # 1. Make the API call
    url = "https://api.openweathermap.org/data/3.0/onecall"
    params = {
        'lat': CALGARY_LAT,
        'lon': CALGARY_LON,
        'appid': API_KEY,
        'units': 'metric',  # Get Celsius, not Kelvin
        'exclude': 'minutely,daily,alerts'  # We only need current and hourly
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        weather_data = response.json()
        print("✅ API call successful")
    except Exception as e:
        print(f"❌ API Error: {e}")
        return None
    
    return weather_data

def extract_next_hour_data(weather_data):
    """Extract data for the next hour (hourly[1])"""
    if 'hourly' not in weather_data or len(weather_data['hourly']) < 2:
        print("❌ Not enough hourly data available")
        return None
    
    # Current hour is hourly[0], next hour is hourly[1]
    next_hour = weather_data['hourly'][1]
    
    print(f"\n📅 Next hour timestamp: {datetime.fromtimestamp(next_hour['dt'])}")
    
    return next_hour

def convert_to_nasa_features(next_hour_data):
    """
    CRITICAL: Convert OpenWeather API data to NASA dataset format
    
    Your NASA dataset has these columns (from your sample):
    timestamp,carport_kw,rooftop_kw,total_solar_kw,uv_index,temperature_c,humidity_pct,
    pressure_kpa,dew_point_c,wind_speed_ms,wind_direction_deg,precipitation_mmh,
    hour,hour_sin,hour_cos,month_sin,month_cos,day_of_week,month,day_of_year,
    is_daylight,season
    """
    
    # Create a dictionary to hold all features
    features = {}
    
    # ============================================
    # 1. DIRECT MAPPINGS (OpenWeather → NASA)
    # ============================================
    
    # UV Index - MOST IMPORTANT!
    features['uv_index'] = next_hour_data.get('uvi', 0)
    
    # Temperature
    features['temperature_c'] = next_hour_data.get('temp', 15)
    
    # Humidity
    features['humidity_pct'] = next_hour_data.get('humidity', 50)
    
    # Pressure: OpenWeather in hPa, NASA expects kPa (divide by 10)
    features['pressure_kpa'] = next_hour_data.get('pressure', 1013) / 10.0
    
    # Dew point
    features['dew_point_c'] = next_hour_data.get('dew_point', 10)
    
    # Wind
    features['wind_speed_ms'] = next_hour_data.get('wind_speed', 3)
    features['wind_direction_deg'] = next_hour_data.get('wind_deg', 0)
    
    # Cloud cover
    features['clouds_pct'] = next_hour_data.get('clouds', 50)
    
    # Visibility
    features['visibility_m'] = next_hour_data.get('visibility', 10000)
    
    # Precipitation: combine rain and snow if available
    rain_mm = next_hour_data.get('rain', {}).get('1h', 0)
    snow_mm = next_hour_data.get('snow', {}).get('1h', 0)
    features['precipitation_mmh'] = rain_mm + snow_mm
    
    # ============================================
    # 2. TIME FEATURES (from timestamp)
    # ============================================
    dt = datetime.fromtimestamp(next_hour_data['dt'])
    
    # Basic time features
    features['hour'] = dt.hour
    features['month'] = dt.month
    features['day_of_week'] = dt.weekday()  # Monday=0, Sunday=6
    features['day_of_year'] = dt.timetuple().tm_yday
    
    # Circular encoding (CRITICAL for time series!)
    features['hour_sin'] = np.sin(2 * np.pi * dt.hour / 24)
    features['hour_cos'] = np.cos(2 * np.pi * dt.hour / 24)
    features['month_sin'] = np.sin(2 * np.pi * dt.month / 12)
    features['month_cos'] = np.cos(2 * np.pi * dt.month / 12)
    
    # Day of year circular encoding
    features['day_of_year_sin'] = np.sin(2 * np.pi * dt.timetuple().tm_yday / 365)
    features['day_of_year_cos'] = np.cos(2 * np.pi * dt.timetuple().tm_yday / 365)
    
    # Daylight flag (Calgary: ~6 AM to 9 PM)
    features['is_daylight'] = 1 if 6 <= dt.hour <= 21 else 0
    
    # Season (based on month)
    month = dt.month
    if month in [12, 1, 2]:
        features['season'] = 0  # Winter
    elif month in [3, 4, 5]:
        features['season'] = 1  # Spring
    elif month in [6, 7, 8]:
        features['season'] = 2  # Summer
    else:
        features['season'] = 3  # Fall
    
    # Day length estimate (Calgary-specific - adjust for your location)
    day_lengths = {
        1: 8.5, 2: 10.0, 3: 11.8, 4: 13.7, 5: 15.3,
        6: 16.3, 7: 16.0, 8: 14.5, 9: 12.7, 10: 10.8,
        11: 9.1, 12: 8.2
    }
    features['day_length_hours'] = day_lengths.get(month, 12.0)
    
    return features

def load_and_predict(features_dict):
    """Load model and make prediction"""
    print("\n🤖 LOADING MODEL AND MAKING PREDICTION")
    print("-" * 50)
    
    # Load model
    try:
        model_data = joblib.load(MODEL_PATH)
        model = model_data['model']
        feature_names = model_data['feature_names']
        scaler = model_data['scaler']
        metrics = model_data.get('metrics', {})
        model_name = model_data.get('model_name', 'Unknown')
        
        print(f"✅ Loaded {model_name} model")
        print(f"   Training R²: {metrics.get('r2', 0):.3f}")
        print(f"   Features expected: {len(feature_names)}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None
    
    # ============================================
    # CRITICAL: Create DataFrame with correct feature order
    # ============================================
    features_df = pd.DataFrame([features_dict])
    
    # Check if we have all required features
    missing_features = []
    for req_feature in feature_names:
        if req_feature not in features_df.columns:
            missing_features.append(req_feature)
            features_df[req_feature] = 0  # Fill missing with 0
    
    if missing_features:
        print(f"⚠️  Missing {len(missing_features)} features (filled with 0):")
        for feat in missing_features[:5]:
            print(f"   - {feat}")
        if len(missing_features) > 5:
            print(f"   ... and {len(missing_features) - 5} more")
    
    # Ensure correct feature order
    features_df = features_df[feature_names]
    
    # Scale features (MUST use the same scaler as training)
    features_scaled = scaler.transform(features_df)
    
    # Make prediction (model expects log1p transformed target)
    prediction_log1p = model.predict(features_scaled)[0]
    
    # Convert back to kW (expm1 is inverse of log1p)
    prediction_kw = np.expm1(prediction_log1p)
    
    return {
        'prediction_kw': prediction_kw,
        'model_name': model_name,
        'r2_score': metrics.get('r2', 0),
        'features_used': len(feature_names),
        'missing_features': len(missing_features)
    }

def display_results(weather_data, features, prediction):
    """Display formatted results"""
    dt = datetime.fromtimestamp(weather_data['hourly'][1]['dt'])
    
    print("\n" + "="*60)
    print("🎯 TEST RESULTS: SINGLE API CALL COMPLETE")
    print("="*60)
    
    # Display weather conditions
    print(f"\n🌤️  NEXT HOUR WEATHER CONDITIONS:")
    print(f"   Time:           {dt.strftime('%Y-%m-%d %H:%M')}")
    print(f"   UV Index:       {features.get('uv_index', 0):.1f}")
    print(f"   Temperature:    {features.get('temperature_c', 0):.1f}°C")
    print(f"   Cloud Cover:    {features.get('clouds_pct', 0)}%")
    print(f"   Humidity:       {features.get('humidity_pct', 0)}%")
    print(f"   Wind Speed:     {features.get('wind_speed_ms', 0):.1f} m/s")
    print(f"   Pressure:       {features.get('pressure_kpa', 0):.1f} kPa")
    print(f"   Precipitation:  {features.get('precipitation_mmh', 0):.1f} mm/h")
    print(f"   Daylight:       {'Yes' if features.get('is_daylight', 0) == 1 else 'No'}")
    
    # Display prediction
    print(f"\n🔮 SOLAR GENERATION PREDICTION:")
    print(f"   Predicted Output: {prediction['prediction_kw']:.2f} kW")
    
    # Confidence indicator
    kw = prediction['prediction_kw']
    if kw > 10:
        confidence = "HIGH"
        emoji = "☀️"
        explanation = "Good solar conditions expected"
    elif kw > 5:
        confidence = "MEDIUM"
        emoji = "⛅"
        explanation = "Moderate solar generation"
    elif kw > 1:
        confidence = "LOW"
        emoji = "🌥️"
        explanation = "Limited solar potential"
    else:
        confidence = "VERY LOW"
        emoji = "☁️"
        explanation = "Poor solar conditions"
    
    print(f"\n{emoji} CONFIDENCE LEVEL: {confidence}")
    print(f"   {explanation}")
    
    # Model info
    print(f"\n📊 MODEL INFORMATION:")
    print(f"   Model: {prediction['model_name']}")
    print(f"   Training R²: {prediction['r2_score']:.3f}")
    print(f"   Features used: {prediction['features_used']}")
    
    if prediction['missing_features'] > 0:
        print(f"   ⚠️  Missing features: {prediction['missing_features']} (filled with 0)")
    
    print(f"\n✅ API CALLS MADE: 1")
    print("✅ PREDICTIONS MADE: 1")
    
    # Save for reference
    save_test_result(dt, features, prediction)

def save_test_result(timestamp, features, prediction):
    """Save test result to JSON file"""
    import json
    
    result = {
        'test_timestamp': datetime.now().isoformat(),
        'prediction_timestamp': timestamp.isoformat(),
        'predicted_kw': float(prediction['prediction_kw']),
        'model_info': {
            'name': prediction['model_name'],
            'r2_score': prediction['r2_score'],
            'features_used': prediction['features_used']
        },
        'weather_conditions': {
            'uv_index': features.get('uv_index', 0),
            'temperature_c': features.get('temperature_c', 0),
            'clouds_pct': features.get('clouds_pct', 0),
            'humidity_pct': features.get('humidity_pct', 0),
            'wind_speed_ms': features.get('wind_speed_ms', 0),
            'pressure_kpa': features.get('pressure_kpa', 0),
            'precipitation_mmh': features.get('precipitation_mmh', 0)
        }
    }
    
    filename = f"single_api_test_{timestamp.strftime('%Y%m%d_%H%M')}.json"
    with open(filename, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n💾 Test result saved to: {filename}")

def main():
    """Main test function"""
    print("\n" + "="*60)
    print("🚀 SINGLE API CALL SOLAR FORECAST TEST")
    print("   Tests NASA-trained model with OpenWeather data")
    print("="*60)
    
    # 1. Make ONE API call
    weather_data = make_single_api_call()
    if not weather_data:
        return
    
    # 2. Extract next hour data
    next_hour_data = extract_next_hour_data(weather_data)
    if not next_hour_data:
        return
    
    # 3. Convert OpenWeather data to NASA features
    nasa_features = convert_to_nasa_features(next_hour_data)
    
    print(f"✅ Converted {len(nasa_features)} features to NASA format")
    
    # 4. Load model and make prediction
    prediction = load_and_predict(nasa_features)
    if not prediction:
        return
    
    # 5. Display results
    display_results(weather_data, nasa_features, prediction)
    
    print(f"\n" + "="*60)
    print("✅ TEST COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    main()