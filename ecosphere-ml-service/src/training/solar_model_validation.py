"""
VALIDATION TEST: Check if model responds correctly to weather changes
"""
import numpy as np
import joblib

def validate_model_response():
    """Test if model responds correctly to weather variables"""
    
    print("MODEL RESPONSE VALIDATION TEST")
    print("="*60)
    
    # Load model
    model_data = joblib.load("solar_forecast_openweather.pkl")
    model = model_data['model']
    feature_names = model_data['feature_names']
    scaler = model_data['scaler']
    
    # Test scenarios
    test_cases = [
        {
            'name': 'IDEAL SUMMER DAY',
            'uv_index': 8.5,      # High UV
            'temperature_c': 25,  # Optimal temperature
            'clouds_pct': 10,     # Clear sky
            'hour': 12,           # Solar noon
            'month': 6,           # June
            'is_daylight': 1
        },
        {
            'name': 'WINTER CLOUDY DAY (Your Test)',
            'uv_index': 0.2,      # Low UV
            'temperature_c': -17, # Very cold
            'clouds_pct': 100,    # Overcast
            'hour': 15,           # 3 PM
            'month': 12,          # December
            'is_daylight': 1
        },
        {
            'name': 'PARTLY CLOUDY SPRING',
            'uv_index': 4.5,
            'temperature_c': 15,
            'clouds_pct': 40,
            'hour': 11,
            'month': 4,
            'is_daylight': 1
        }
    ]
    
    print(f"Testing {len(test_cases)} weather scenarios...\n")
    
    for i, scenario in enumerate(test_cases, 1):
        # Create feature vector
        features = create_test_features(scenario)
        
        # Ensure all features exist
        features_df = pd.DataFrame([features])
        for feat in feature_names:
            if feat not in features_df.columns:
                features_df[feat] = 0
        
        # Scale and predict
        features_scaled = scaler.transform(features_df[feature_names])
        prediction_log1p = model.predict(features_scaled)[0]
        prediction_kw = np.expm1(prediction_log1p)
        
        print(f"SCENARIO {i}: {scenario['name']}")
        print(f"   UV Index: {scenario['uv_index']:.1f}")
        print(f"   Cloud Cover: {scenario['clouds_pct']}%")
        print(f"   Temperature: {scenario['temperature_c']}°C")
        print(f"   Time: {scenario['hour']}:00 in month {scenario['month']}")
        print(f"   → Predicted Solar: {prediction_kw:.2f} kW")
        
        # Physics check
        if scenario['uv_index'] > 5 and scenario['clouds_pct'] < 30:
            if prediction_kw < 5:
                print(f"   SUSPICIOUS: High UV + Clear sky but low prediction")
            else:
                print(f"   REASONABLE: Good conditions → good prediction")
        elif scenario['uv_index'] < 1 and scenario['clouds_pct'] > 80:
            if prediction_kw > 5:
                print(f"   SUSPICIOUS: Poor conditions but high prediction")
            else:
                print(f"   REASONABLE: Poor conditions → low prediction")
        print()

def create_test_features(scenario):
    """Create feature dictionary for test scenario"""
    features = {}
    
    # Weather features
    features['uv_index'] = scenario['uv_index']
    features['temperature_c'] = scenario['temperature_c']
    features['clouds_pct'] = scenario['clouds_pct']
    features['humidity_pct'] = 50  # Default
    features['pressure_kpa'] = 101.3  # Default
    features['wind_speed_ms'] = 3.0  # Default
    features['precipitation_mmh'] = 0  # Default
    
    # Time features
    hour = scenario['hour']
    month = scenario['month']
    
    features['hour_sin'] = np.sin(2 * np.pi * hour / 24)
    features['hour_cos'] = np.cos(2 * np.pi * hour / 24)
    features['month_sin'] = np.sin(2 * np.pi * month / 12)
    features['month_cos'] = np.cos(2 * np.pi * month / 12)
    features['is_daylight'] = scenario['is_daylight']
    
    # Season
    if month in [12, 1, 2]:
        features['season'] = 0
    elif month in [3, 4, 5]:
        features['season'] = 1
    elif month in [6, 7, 8]:
        features['season'] = 2
    else:
        features['season'] = 3
    
    return features

if __name__ == "__main__":
    import pandas as pd
    validate_model_response()