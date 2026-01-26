# predict_behavioral_loads_working.py
print("BEHAVIORAL LOADS PREDICTION - WORKING VERSION")
print("=" * 70)

import pandas as pd
import numpy as np
import joblib
import json
import os
import sys
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

MODEL_DIR = os.path.join(project_root, "models", "behavioral_loads_production_fixed")

def load_simple_model():
    """Load a simple model that works"""
    print(f"\n📂 LOADING MODEL FROM: {MODEL_DIR}")
    print("-" * 50)
    
    # Look for model files
    model_files = []
    for file in os.listdir(MODEL_DIR):
        if file.endswith('.pkl') and ('xgboost' in file or 'lightgbm' in file):
            model_files.append(file)
    
    if not model_files:
        print(f"No model files found in {MODEL_DIR}")
        # Try the production_fixed directory
        alt_dir = os.path.join(project_root, "models", "behavioral_loads_production")
        if os.path.exists(alt_dir):
            for file in os.listdir(alt_dir):
                if file.endswith('.pkl') and ('xgboost' in file or 'lightgbm' in file):
                    model_files.append(os.path.join(alt_dir, file))
    
    if not model_files:
        print(f"No model files found")
        return None
    
    # Use the first model
    model_path = os.path.join(MODEL_DIR, model_files[0])
    print(f"📁 Loading: {model_files[0]}")
    
    try:
        model_data = joblib.load(model_path)
        
        # Check what type of data we have
        if isinstance(model_data, dict) and 'model' in model_data:
            # It's our packaged model
            model = model_data['model']
            feature_names = model_data.get('feature_names', [])
            metrics = model_data.get('metrics', {})
            model_type = model_data.get('training_info', {}).get('model_type', 'unknown')
        else:
            # It might be a raw model
            model = model_data
            feature_names = []
            metrics = {}
            model_type = type(model).__name__
        
        print(f"Model type: {model_type}")
        print(f"   Features: {len(feature_names) if feature_names else 'unknown'}")
        
        if metrics.get('test_r2'):
            print(f"   Test R²:  {metrics['test_r2']:.3f}")
        if metrics.get('test_mae'):
            print(f"   Test MAE: {metrics['test_mae']:.3f}")
        
        return {
            'model': model,
            'feature_names': feature_names,
            'model_type': model_type,
            'metrics': metrics
        }
        
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def create_features_for_prediction(feature_names=None, load_type='appliances'):
    """Create features for prediction"""
    now = datetime.now()
    hour = now.hour
    dow = now.weekday()
    
    # Create basic features
    features = {
        'hour': hour,
        'day_of_week': dow,
        'month': now.month,
        'day_of_month': now.day,
        'is_weekend': 1 if dow >= 5 else 0,
        'is_work_hour': 1 if 8 <= hour <= 17 else 0,
        'is_night': 1 if hour >= 22 or hour <= 5 else 0,
        'hour_sin': np.sin(2 * np.pi * hour / 24),
        'hour_cos': np.cos(2 * np.pi * hour / 24),
        'dow_sin': np.sin(2 * np.pi * dow / 7),
        'dow_cos': np.cos(2 * np.pi * dow / 7),
    }
    
    # Load type indicators
    features['is_load_appliances'] = 1 if load_type == 'appliances' else 0
    features['is_load_equipment'] = 1 if load_type == 'equipment' else 0
    features['is_load_lighting'] = 1 if load_type == 'lighting' else 0
    
    # Add common consumption features
    features['total_kwh'] = 7.5  # Typical total
    
    # Load-specific ratios and values
    if load_type == 'appliances':
        features['appliances_kwh_ratio'] = 0.33
        features['appliances_kwh'] = 2.5
        features['appliances_kwh_lag_24h'] = 2.4
        features['appliances_kwh_rolling_24h_mean'] = 2.5
    elif load_type == 'equipment':
        features['equipment_kwh_ratio'] = 0.33
        features['equipment_kwh'] = 3.0
        features['equipment_kwh_lag_24h'] = 2.9
        features['equipment_kwh_rolling_24h_mean'] = 3.0
    else:  # lighting
        features['lighting_kwh_ratio'] = 0.33
        features['lighting_kwh'] = 2.5
        features['lighting_kwh_lag_24h'] = 2.4
        features['lighting_kwh_rolling_24h_mean'] = 2.5
    
    # Fill in other common features
    common_prefixes = ['appliances_kwh_', 'equipment_kwh_', 'lighting_kwh_']
    
    for prefix in common_prefixes:
        for suffix in ['ratio', 'lag_24h', 'lag_168h', 'rolling_24h_mean', 'rolling_168h_mean']:
            feature_name = f"{prefix}{suffix}"
            if feature_name not in features:
                # Set default values
                if 'ratio' in suffix:
                    features[feature_name] = 0.33
                elif 'lag' in suffix or 'rolling' in suffix:
                    features[feature_name] = 2.5 if 'appliances' in prefix else 3.0 if 'equipment' in prefix else 2.5
    
    # If we have specific feature names, ensure they're all present
    if feature_names:
        for feat in feature_names:
            if feat not in features:
                # Set reasonable defaults
                if 'total' in feat:
                    features[feat] = 7.5
                elif 'ratio' in feat:
                    features[feat] = 0.33
                elif 'lag' in feat or 'rolling' in feat:
                    features[feat] = 2.5
                elif 'zscore' in feat or 'deviation' in feat:
                    features[feat] = 0.0
                else:
                    features[feat] = 0.0
    
    return features

def make_prediction(model_data, load_type='appliances'):
    """Make a prediction"""
    model = model_data['model']
    feature_names = model_data['feature_names']
    
    # Create features
    features = create_features_for_prediction(feature_names, load_type)
    
    # Create DataFrame
    X_pred = pd.DataFrame([features])
    
    # Ensure all features are present
    if feature_names:
        missing = set(feature_names) - set(X_pred.columns)
        for m in missing:
            X_pred[m] = 0.0
        
        # Reorder to match training
        X_pred = X_pred[feature_names]
    
    # Make prediction
    try:
        prediction = model.predict(X_pred)[0]
        return prediction
    except Exception as e:
        print(f"Prediction error: {e}")
        # Try without feature ordering
        try:
            prediction = model.predict(X_pred)[0]
            return prediction
        except:
            return None

def main():
    """Main prediction function"""
    # Load model
    model_data = load_simple_model()
    if not model_data:
        print(f"\nTrying alternative approach...")
        
        # Try to load from the production directory
        prod_dir = os.path.join(project_root, "models", "behavioral_loads_production")
        if os.path.exists(prod_dir):
            for file in os.listdir(prod_dir):
                if file == "best_model.pkl":
                    model_path = os.path.join(prod_dir, file)
                    print(f"📁 Loading best model: {model_path}")
                    try:
                        model_data_raw = joblib.load(model_path)
                        if isinstance(model_data_raw, dict) and 'model' in model_data_raw:
                            model_data = {
                                'model': model_data_raw['model'],
                                'feature_names': model_data_raw.get('feature_names', []),
                                'model_type': model_data_raw.get('training_info', {}).get('model_type', 'best'),
                                'metrics': model_data_raw.get('metrics', {})
                            }
                            print(f"✅ Loaded best model")
                    except Exception as e:
                        print(f"Error: {e}")
        
        if not model_data:
            print(f"Could not load any model")
            return
    
    # Make predictions for all load types
    print(f"\nMAKING PREDICTIONS")
    print("-" * 50)
    
    now = datetime.now()
    print(f"Time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\n{'Load Type':<15} {'Predicted kWh':<15} {'Confidence':<15}")
    print(f"{'-'*15} {'-'*15} {'-'*15}")
    
    predictions = []
    
    for load_type in ['appliances', 'equipment', 'lighting']:
        prediction = make_prediction(model_data, load_type)
        
        if prediction is not None:
            # Calculate confidence based on model metrics
            test_r2 = model_data['metrics'].get('test_r2', 0.8)
            confidence = min(95, test_r2 * 100)
            
            print(f"{load_type.title():<15} {prediction:<15.2f} {confidence:<15.1f}%")
            
            predictions.append({
                'load_type': load_type,
                'predicted_kwh': prediction,
                'confidence_percent': confidence,
                'timestamp': now.strftime("%Y-%m-%d %H:%M:%S"),
                'hour_of_day': now.hour
            })
        else:
            print(f"{load_type.title():<15} {'Failed':<15} {'N/A':<15}")
    
    if predictions:
        # Calculate total
        total = sum(p['predicted_kwh'] for p in predictions)
        
        print(f"\nTOTAL PREDICTED CONSUMPTION: {total:.2f} kWh")
        
        # Find highest and lowest
        if len(predictions) > 1:
            max_load = max(predictions, key=lambda x: x['predicted_kwh'])
            min_load = min(predictions, key=lambda x: x['predicted_kwh'])
            
            print(f"\nHIGHEST: {max_load['load_type']} ({max_load['predicted_kwh']:.2f} kWh)")
            print(f"LOWEST:  {min_load['load_type']} ({min_load['predicted_kwh']:.2f} kWh)")
        
        # Time-based recommendations
        hour = now.hour
        print(f"\nRECOMMENDATIONS:")
        
        if 17 <= hour <= 21:
            print("   • Evening peak hours - reduce non-essential loads")
        elif hour >= 22 or hour <= 6:
            print("   • Night hours - good for scheduled tasks")
        
        if total > 8:
            print("   • High total consumption - consider energy saving")
        
        # Save predictions
        predictions_df = pd.DataFrame(predictions)
        timestamp_str = now.strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(MODEL_DIR, f"predictions_{timestamp_str}.csv")
        
        # Also save in project root for easy access
        root_output = os.path.join(project_root, f"behavioral_predictions_{timestamp_str}.csv")
        
        predictions_df.to_csv(output_path, index=False)
        predictions_df.to_csv(root_output, index=False)
        
        print(f"\nPredictions saved to:")
        print(f"   {output_path}")
        print(f"   {root_output}")
    
    print(f"\nPrediction completed!")

if __name__ == "__main__":
    main()