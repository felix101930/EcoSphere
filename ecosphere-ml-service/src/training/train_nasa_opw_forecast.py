"""
SOLAR FORECASTING MODEL TRAINER
Trains and compares 3 models, saves best one for OpenWeather API v3.0
"""
import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ML Libraries
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import lightgbm as lgb
import joblib
import json

class SolarForecastTrainer:
    """Train and compare solar forecasting models for OpenWeather API v3.0"""
    
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.best_model = None
        self.best_model_name = None
        self.feature_names = []
        self.metrics = {}
        self.all_models_results = {}
        self.scaler = StandardScaler()
        
    def load_and_prepare_data(self):
        """Load and prepare the dataset"""
        print("📂 LOADING TRAINING DATASET")
        print("-" * 50)
        
        # Load the dataset
        self.df = pd.read_csv(self.data_path, parse_dates=['timestamp'])
        print(f" Loaded {len(self.df):,} samples")
        print(f" Date range: {self.df['timestamp'].min()} to {self.df['timestamp'].max()}")
        
        # CRITICAL: Check if we have actual solar generation data
        if 'total_solar_kw' not in self.df.columns:
            print(" ERROR: 'total_solar_kw' column not found!")
            print("Available columns:", self.df.columns.tolist())
            return None
        
        # CRITICAL: Remove rows with 0 solar generation (they're confusing the model)
        before_zeros = len(self.df)
        self.df = self.df[self.df['total_solar_kw'] > 0.1].copy()  # Keep only meaningful generation
        after_zeros = len(self.df)
        print(f" Removed {before_zeros - after_zeros:,} zero/low-generation samples")
        
        # Check for UV index column
        uv_col = None
        for col in ['uv_index', 'uvi', 'ALLSKY_SFC_UV_INDEX']:
            if col in self.df.columns:
                uv_col = col
                self.df['uv_index'] = self.df[col]
                break
        
        if uv_col:
            print(f" Using UV index from column: {uv_col}")
        else:
            print("  WARNING: No UV index column found!")
            # Create synthetic UV index based on hour and month
            self.df['hour'] = self.df['timestamp'].dt.hour
            self.df['month'] = self.df['timestamp'].dt.month
            # Simple UV estimation: higher at noon, higher in summer
            self.df['uv_index'] = np.sin((self.df['hour'] - 6) * np.pi / 12).clip(0, 1) * \
                                 (1 + 0.5 * np.sin((self.df['month'] - 6) * np.pi / 6))
        
        # Use log1p transformation for target
        self.df['log1p_solar'] = np.log1p(self.df['total_solar_kw'])
        
        print(f"\n DATASET STATISTICS:")
        print(f"   Shape: {self.df.shape[0]:,} rows × {self.df.shape[1]} columns")
        print(f"   Solar Generation:")
        print(f"     Mean: {self.df['total_solar_kw'].mean():.2f} kW")
        print(f"     Max:  {self.df['total_solar_kw'].max():.2f} kW")
        print(f"     Min:  {self.df['total_solar_kw'].min():.2f} kW")
        print(f"     Std:  {self.df['total_solar_kw'].std():.2f} kW")
        
        # Check distribution
        print(f"\n DATA DISTRIBUTION:")
        print(f"   UV Index: Mean={self.df['uv_index'].mean():.2f}, Max={self.df['uv_index'].max():.2f}")
        
        return self.df
    
    def select_features_for_openweather(self):
        """Select features available from OpenWeather API v3.0"""
        print(f"\n SELECTING OPENWEATHER API v3.0 COMPATIBLE FEATURES")
        print("-" * 50)
        
        # Features available in OpenWeather One Call API 3.0
        openweather_features = [
            # Direct mappings from API response
            'uv_index',            # hourly.uvi - MOST IMPORTANT!
            'temperature_c',       # hourly.temp (convert K to C)
            'humidity_pct',        # hourly.humidity
            'pressure_kpa',        # hourly.pressure (hPa to kPa)
            'dew_point_c',         # hourly.dew_point (K to C)
            'wind_speed_ms',       # hourly.wind_speed
            'wind_direction_deg',  # hourly.wind_deg
            'clouds_pct',          # hourly.clouds
            'visibility_m',        # hourly.visibility
            
            # Precipitation (OpenWeather provides these separately)
            'precipitation_mmh',   # hourly.rain.1h + hourly.snow.1h
            
            # Time-based features (calculated from timestamp)
            'hour_sin', 'hour_cos',
            'month_sin', 'month_cos',
            'day_of_year_sin', 'day_of_year_cos',
            
            # Derived features
            'is_daylight',         # 1 if 6 <= hour <= 21
            'season',              # 0=winter, 1=spring, 2=summer, 3=fall
            'day_length_hours'     # Estimated from month
        ]
        
        # Only keep features that exist or can be created
        self.feature_names = []
        for feature in openweather_features:
            if feature in self.df.columns:
                self.feature_names.append(feature)
            elif feature in ['hour_sin', 'hour_cos', 'month_sin', 'month_cos', 
                           'day_of_year_sin', 'day_of_year_cos', 'is_daylight',
                           'season', 'day_length_hours']:
                # These will be created
                continue
        
        # Create time-based features
        self._create_time_features()
        
        # Ensure all features exist
        for feature in ['uv_index', 'temperature_c', 'humidity_pct']:
            if feature not in self.feature_names and feature in self.df.columns:
                self.feature_names.append(feature)
        
        print(f" Selected {len(self.feature_names)} OpenWeather-compatible features:")
        for i, feature in enumerate(self.feature_names[:15], 1):  # Show first 15
            print(f"   {i:2}. {feature}")
        if len(self.feature_names) > 15:
            print(f"   ... and {len(self.feature_names) - 15} more")
        
        return self.feature_names
    
    def _create_time_features(self):
        """Create time-based features from timestamp"""
        if 'timestamp' not in self.df.columns:
            return
        
        # Hour of day (circular)
        hour = self.df['timestamp'].dt.hour
        self.df['hour_sin'] = np.sin(2 * np.pi * hour / 24)
        self.df['hour_cos'] = np.cos(2 * np.pi * hour / 24)
        
        # Month of year (circular)
        month = self.df['timestamp'].dt.month
        self.df['month_sin'] = np.sin(2 * np.pi * month / 12)
        self.df['month_cos'] = np.cos(2 * np.pi * month / 12)
        
        # Day of year (circular)
        day_of_year = self.df['timestamp'].dt.dayofyear
        self.df['day_of_year_sin'] = np.sin(2 * np.pi * day_of_year / 365)
        self.df['day_of_year_cos'] = np.cos(2 * np.pi * day_of_year / 365)
        
        # Daylight hours
        self.df['is_daylight'] = ((hour >= 6) & (hour <= 21)).astype(int)
        
        # Season
        self.df['season'] = self.df['timestamp'].dt.month.apply(
            lambda m: 0 if m in [12, 1, 2] else 
                     (1 if m in [3, 4, 5] else 
                     (2 if m in [6, 7, 8] else 3))
        )
        
        # Day length estimate (for Calgary)
        day_lengths = {
            1: 8.5, 2: 10.0, 3: 11.8, 4: 13.7, 5: 15.3,
            6: 16.3, 7: 16.0, 8: 14.5, 9: 12.7, 10: 10.8,
            11: 9.1, 12: 8.2
        }
        self.df['day_length_hours'] = self.df['timestamp'].dt.month.map(day_lengths)
        
        # Add these to feature names
        time_features = ['hour_sin', 'hour_cos', 'month_sin', 'month_cos',
                        'day_of_year_sin', 'day_of_year_cos', 'is_daylight',
                        'season', 'day_length_hours']
        
        for feature in time_features:
            if feature not in self.feature_names:
                self.feature_names.append(feature)
    
    def train_and_compare_models(self):
        """Train and compare 3 models"""
        print(f"\n TRAINING AND COMPARING 3 MODELS")
        print("-" * 50)
        
        # Prepare data
        X = self.df[self.feature_names].fillna(0)
        y = self.df['log1p_solar']
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train-test split (time-based)
        split_idx = int(len(X) * 0.8)
        X_train = X_scaled[:split_idx]
        X_test = X_scaled[split_idx:]
        y_train = y.iloc[:split_idx]
        y_test = y.iloc[split_idx:]
        
        print(f" DATA SPLIT:")
        print(f"   Training: {len(X_train):,} samples ({split_idx/len(X)*100:.1f}%)")
        print(f"   Testing:  {len(X_test):,} samples ({(len(X)-split_idx)/len(X)*100:.1f}%)")
        
        # Train 3 models
        models_to_train = {
            'LightGBM': self._train_lightgbm,
            'XGBoost': self._train_xgboost,
            'RandomForest': self._train_randomforest
        }
        
        self.all_models_results = {}
        best_r2 = -float('inf')
        
        for model_name, model_func in models_to_train.items():
            print(f"\n Training {model_name}...")
            
            try:
                model = model_func(X_train, y_train, X_test, y_test)
                
                # Evaluate
                y_pred_log = model.predict(X_test)
                y_pred = np.expm1(y_pred_log)
                y_test_original = np.expm1(y_test)
                
                # Calculate metrics
                r2 = r2_score(y_test_original, y_pred)
                mae = mean_absolute_error(y_test_original, y_pred)
                rmse = np.sqrt(mean_squared_error(y_test_original, y_pred))
                
                # Calculate MAPE safely (avoid division by zero)
                non_zero_mask = y_test_original > 0.1
                if non_zero_mask.sum() > 0:
                    mape = np.mean(np.abs((y_test_original[non_zero_mask] - y_pred[non_zero_mask]) / 
                                         y_test_original[non_zero_mask])) * 100
                else:
                    mape = float('nan')
                
                self.all_models_results[model_name] = {
                    'model': model,
                    'r2': r2,
                    'mae': mae,
                    'rmse': rmse,
                    'mape': mape,
                    'mean_actual': y_test_original.mean(),
                    'mean_predicted': y_pred.mean()
                }
                
                print(f"   Performance:")
                print(f"     R²:  {r2:.4f}")
                print(f"     MAE: {mae:.3f} kW")
                print(f"     RMSE:{rmse:.3f} kW")
                if not np.isnan(mape):
                    print(f"     MAPE:{mape:.2f}%")
                
                # Update best model
                if r2 > best_r2:
                    best_r2 = r2
                    self.best_model = model
                    self.best_model_name = model_name
                    self.metrics = self.all_models_results[model_name].copy()
                    del self.metrics['model']
                    print(f"      New best model!")
                    
            except Exception as e:
                print(f"    Error: {e}")
                self.all_models_results[model_name] = {'error': str(e)}
        
        # Display comparison
        self._display_model_comparison()
        
        print(f"\n BEST MODEL: {self.best_model_name}")
        print(f"   R²:  {self.metrics['r2']:.4f}")
        print(f"   MAE: {self.metrics['mae']:.3f} kW")
        
        return self.best_model
    
    def _display_model_comparison(self):
        """Display comparison table"""
        print(f"\n MODEL COMPARISON")
        print("-" * 60)
        print(f"{'Model':<12} {'R²':>8} {'MAE (kW)':>10} {'RMSE (kW)':>12}")
        print("-" * 60)
        
        for model_name, results in self.all_models_results.items():
            if 'r2' in results:
                print(f"{model_name:<12} {results['r2']:>8.4f} {results['mae']:>10.3f} "
                      f"{results['rmse']:>12.3f}")
        
        print("-" * 60)
    
    def _train_lightgbm(self, X_train, y_train, X_test, y_test):
        """Train LightGBM with optimized parameters"""
        # Create datasets
        train_data = lgb.Dataset(X_train, label=y_train)
        valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
        
        # Optimized parameters
        params = {
            'boosting_type': 'gbdt',
            'objective': 'regression',
            'metric': 'rmse',
            'num_leaves': 63,  # Increased for more complex patterns
            'learning_rate': 0.01,  # Slower learning
            'feature_fraction': 0.8,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'min_data_in_leaf': 50,  # Increased to prevent overfitting
            'min_sum_hessian_in_leaf': 0.001,
            'lambda_l1': 0.1,
            'lambda_l2': 0.1,
            'verbose': -1,
            'random_state': 42,
            'n_jobs': -1
        }
        
        # Train with early stopping
        model = lgb.train(
            params,
            train_data,
            num_boost_round=2000,
            valid_sets=[valid_data],
            callbacks=[
                lgb.early_stopping(100),
                lgb.log_evaluation(100)
            ]
        )
        
        return model
    
    def _train_xgboost(self, X_train, y_train, X_test, y_test):
        """Train XGBoost with optimized parameters"""
        model = xgb.XGBRegressor(
            n_estimators=1000,
            learning_rate=0.01,
            max_depth=8,
            min_child_weight=50,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
            verbosity=0
        )
        
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        return model
    
    def _train_randomforest(self, X_train, y_train, X_test, y_test):
        """Train Random Forest"""
        model = RandomForestRegressor(
            n_estimators=300,
            max_depth=15,
            min_samples_split=20,
            min_samples_leaf=10,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1,
            verbose=0
        )
        
        model.fit(X_train, y_train)
        return model
    
    def analyze_predictions(self):
        """Analyze model predictions"""
        if not self.best_model:
            print(" No model trained yet")
            return
        
        print(f"\n ANALYZING {self.best_model_name} PREDICTIONS")
        print("-" * 50)
        
        # Prepare data
        X = self.df[self.feature_names].fillna(0)
        X_scaled = self.scaler.transform(X)
        y = self.df['log1p_solar']
        
        split_idx = int(len(X) * 0.8)
        X_test = X_scaled[split_idx:]
        y_test = y.iloc[split_idx:]
        
        # Make predictions
        y_pred_log = self.best_model.predict(X_test)
        y_pred = np.expm1(y_pred_log)
        y_actual = np.expm1(y_test)
        
        # Feature importance
        if hasattr(self.best_model, 'feature_importances_'):
            importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.best_model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            print(f" TOP 10 FEATURE IMPORTANCE:")
            for i, (_, row) in enumerate(importance.head(10).iterrows(), 1):
                print(f"   {i:2}. {row['feature']:25} {row['importance']:.4f}")
        
        # Show predictions vs actual
        print(f"\n SAMPLE PREDICTIONS (First 10 test samples):")
        for i in range(min(10, len(y_pred))):
            actual = y_actual.iloc[i]
            pred = y_pred[i]
            error_pct = abs(pred - actual) / actual * 100 if actual > 0.1 else 0
            
            # Get UV index if available
            uv = self.df.iloc[split_idx + i]['uv_index'] if 'uv_index' in self.df.columns else 0
            
            print(f"   Sample {i+1:2}: UV={uv:4.1f} | Actual:{actual:6.2f}kW | "
                  f"Pred:{pred:6.2f}kW | Error:{error_pct:5.1f}%")
    
    def save_best_model(self, output_path="solar_forecast_model.pkl"):
        """Save the best model"""
        print(f"\n SAVING BEST MODEL: {self.best_model_name}")
        print("-" * 50)
        
        if not self.best_model:
            print(" No model to save")
            return None
        
        # Create model package
        model_package = {
            'model': self.best_model,
            'model_name': self.best_model_name,
            'feature_names': self.feature_names,
            'metrics': self.metrics,
            'scaler': self.scaler,
            'all_models_results': {
                name: {k: v for k, v in results.items() if k != 'model'}
                for name, results in self.all_models_results.items()
                if 'model' in results
            },
            'training_info': {
                'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'training_samples': len(self.df),
                'target_transform': 'log1p -> expm1',
                'openweather_api_version': '3.0',
                'model_type': type(self.best_model).__name__
            },
            'openweather_mapping': {
                'hourly.uvi': 'uv_index',
                'hourly.temp': 'temperature_c (K - 273.15)',
                'hourly.humidity': 'humidity_pct',
                'hourly.pressure': 'pressure_kpa (hPa / 10)',
                'hourly.dew_point': 'dew_point_c (K - 273.15)',
                'hourly.wind_speed': 'wind_speed_ms',
                'hourly.wind_deg': 'wind_direction_deg',
                'hourly.clouds': 'clouds_pct',
                'hourly.visibility': 'visibility_m',
                'hourly.rain.1h': 'rain component of precipitation_mmh',
                'hourly.snow.1h': 'snow component of precipitation_mmh',
                'timestamp': 'hourly.dt (Unix timestamp)'
            }
        }
        
        # Save model
        joblib.dump(model_package, output_path)
        print(f" Model saved to: {output_path}")
        
        # Save metadata
        metadata = {
            'model_info': {
                'name': self.best_model_name,
                'type': type(self.best_model).__name__,
                'performance': self.metrics,
                'features': self.feature_names,
                'feature_count': len(self.feature_names)
            },
            'training_data': {
                'samples': len(self.df),
                'date_range': {
                    'start': self.df['timestamp'].min().strftime('%Y-%m-%d'),
                    'end': self.df['timestamp'].max().strftime('%Y-%m-%d')
                },
                'target_mean_kw': self.df['total_solar_kw'].mean(),
                'uv_mean': self.df['uv_index'].mean() if 'uv_index' in self.df.columns else 'N/A'
            },
            'usage': {
                'api_compatibility': 'OpenWeather One Call API 3.0',
                'required_features': self.feature_names,
                'prediction_steps': '1. Get hourly forecast from OpenWeather -> 2. Convert to features -> 3. Predict using model -> 4. Convert log1p to kW'
            }
        }
        
        metadata_path = output_path.replace('.pkl', '_metadata.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print(f"Metadata saved to: {metadata_path}")
        
        return output_path

def main():
    """Main training function"""
    print("\n" + "="*70)
    print(" SOLAR FORECASTING FOR OPENWEATHER API v3.0")
    print("   TRAINS 3 MODELS & SAVES BEST ONE")
    print("="*70)
    
    # Configuration
    DATA_PATH = "../../data/generation_forecast/sait_nasa_readywithopw_for_training.csv"
    OUTPUT_MODEL = "solar_forecast_openweather.pkl"
    
    # 1. Initialize trainer
    trainer = SolarForecastTrainer(DATA_PATH)
    
    # 2. Load and prepare data
    df = trainer.load_and_prepare_data()
    if df is None:
        print(" Failed to load data")
        return
    
    # 3. Select OpenWeather-compatible features
    trainer.select_features_for_openweather()
    
    # 4. Train and compare models
    print(f"\n{'='*70}")
    print(" TRAINING 3 MODELS:")
    print("   1. LightGBM")
    print("   2. XGBoost")
    print("   3. RandomForest")
    print("="*70)
    
    best_model = trainer.train_and_compare_models()
    
    if best_model is None:
        print(" Model training failed")
        return
    
    # 5. Analyze predictions
    trainer.analyze_predictions()
    
    # 6. Save best model
    trainer.save_best_model(OUTPUT_MODEL)
    
    # 7. Create OpenWeather API integration code
    create_openweather_integration_code(OUTPUT_MODEL)
    
    print(f"\n{'='*70}")
    print("TRAINING COMPLETE!")
    print("="*70)
    
    # Final recommendations
    print(f"\n PRODUCTION DEPLOYMENT:")
    print(f"   1. Model file: {OUTPUT_MODEL}")
    print(f"   2. OpenWeather API integration: openweather_integration.py")
    print(f"   3. Example usage: example_forecast.py")
    
    print(f"\n MODEL PERFORMANCE INTERPRETATION:")
    r2 = trainer.metrics.get('r2', 0)
    if r2 > 0.8:
        print(f"    Excellent model (R²={r2:.3f})")
    elif r2 > 0.6:
        print(f"     Good model (R²={r2:.3f}) - consider feature engineering")
    elif r2 > 0.3:
        print(f"     Fair model (R²={r2:.3f}) - needs improvement")
    else:
        print(f"    Poor model (R²={r2:.3f}) - check data quality")

def create_openweather_integration_code(model_path="solar_forecast_openweather.pkl"):
    """Create OpenWeather API integration code"""
    print(f"\nCREATING OPENWEATHER API INTEGRATION")
    print("-" * 50)
    
    integration_code = '''"""
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
        
        print(f" Loaded {self.model_name} model")
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
            print(f" API Error: {e}")
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
        print(f" Getting weather forecast for lat={lat}, lon={lon}...")
        
        # Get weather forecast
        weather_data = self.get_weather_forecast(lat, lon, units='metric')
        
        if not weather_data or 'hourly' not in weather_data:
            print(" No hourly forecast data available")
            return pd.DataFrame()
        
        # Get hourly data (limit to requested hours)
        hourly_data = weather_data['hourly'][:hours]
        
        print(f" Got {len(hourly_data)} hours of forecast data")
        
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
            
            print(f"\n SOLAR FORECAST SUMMARY:")
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
        print(f"\n FIRST 12 HOURS OF FORECAST:")
        print(forecast.head(12).to_string())
        
        # Save to CSV
        forecast.to_csv('solar_forecast_48h.csv', index=False)
        print(f"\nForecast saved to solar_forecast_48h.csv")
'''
    
    # Save integration code
    integration_path = "openweather_integration.py"
    with open(integration_path, 'w', encoding='utf-8') as f:
        f.write(integration_code)
    
    print(f" OpenWeather integration code saved to: {integration_path}")
    
    # Create simple example
    example_code = '''"""
EXAMPLE: Get solar forecast for Calgary
"""
from openweather_integration import OpenWeatherSolarForecaster

# Your OpenWeather API key (get from https://openweathermap.org/api)
API_KEY = "your_api_key_here"

# Initialize forecaster
forecaster = OpenWeatherSolarForecaster(
    model_path="solar_forecast_openweather.pkl",
    api_key=API_KEY
)

# Calgary coordinates
CALGARY_LAT = 51.0447
CALGARY_LON = -114.0719

# Get 24-hour forecast
print("Getting 24-hour solar forecast for Calgary...")
forecast = forecaster.forecast_solar(CALGARY_LAT, CALGARY_LON, hours=24)

if not forecast.empty:
    print("\nFirst 6 hours:")
    for idx, row in forecast.head(6).iterrows():
        print(f"{row['timestamp'].strftime('%Y-%m-%d %H:%M')}: "
              f"{row['predicted_kw']:.2f} kW | "
              f"UV: {row['uv_index']:.1f} | "
              f"Temp: {row['temperature_c']:.1f}°C")
    
    # Calculate daily total
    daily_total = forecast['predicted_kw'].sum()
    print(f"\nEstimated daily generation: {daily_total:.1f} kWh")
'''
    
    example_path = "example_forecast.py"
    with open(example_path, 'w', encoding='utf-8') as f:
        f.write(example_code)
    
    print(f"Example usage saved to: {example_path}")
    
    print(f"\nNEXT STEPS:")
    print(f"   1. Get OpenWeather API key from: https://openweathermap.org/api")
    print(f"   2. Update API_KEY in example_forecast.py")
    print(f"   3. Run: python example_forecast.py")
    print(f"   4. Use openweather_integration.py in your application")

if __name__ == "__main__":
    main()