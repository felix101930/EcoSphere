# src/training/train_components.py
print("COMPONENT-BASED FORECASTING - FINAL VERSION")
print("=" * 70)

import os
import sys
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import lightgbm as lgb
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

class ComponentForecaster:
    def __init__(self):
        self.data_dir = os.path.join(project_root, "data", "processed", "normalized")
        self.models_dir = os.path.join(project_root, "models", "components")
        self.normalized_file = os.path.join(self.data_dir, "components_normalized.csv")
        
        # Define components to forecast (with safe names)
        self.consumption_components = [
            ('lighting_kWh', 'lighting_consumption', 'Lighting Consumption'),
            ('appliances_kWh', 'appliances_consumption', 'Appliances Consumption'),
            ('equipment_rd_kWh', 'equipment_rd_consumption', 'Equipment R&D Consumption'),
            ('space_hvac_kWh', 'space_hvac_consumption', 'Space HVAC Consumption'),
            # ('ventilation_kWh', 'ventilation_consumption', 'Ventilation Consumption')  # Constant, skip
        ]
        
        self.generation_components = [
            ('solar_carport_kWh', 'solar_carport_generation', 'Carport Solar Generation'),
            ('solar_rooftop_kWh', 'solar_rooftop_generation', 'Rooftop Solar Generation')
        ]
        
        # Create directories
        os.makedirs(os.path.join(self.models_dir, "consumption"), exist_ok=True)
        os.makedirs(os.path.join(self.models_dir, "generation"), exist_ok=True)
    
    def load_and_prepare_data(self):
        """Load normalized data and prepare for training"""
        print(f"\n📂 Loading normalized data...")
        
        if not os.path.exists(self.normalized_file):
            print(f"Normalized data not found: {self.normalized_file}")
            return None
        
        df = pd.read_csv(self.normalized_file, parse_dates=['timestamp'])
        df.set_index('timestamp', inplace=True)
        df = df.sort_index()
        
        print(f"Loaded {len(df):,} records")
        print(f"Range: {df.index.min()} to {df.index.max()}")
        
        return df
    
    def create_features(self, df, component_type):
        """Create features for a specific component type"""
        features = df.copy()
        
        # Time features
        features['hour'] = features.index.hour
        features['day_of_week'] = features.index.dayofweek
        features['month'] = features.index.month
        features['day_of_year'] = features.index.dayofyear
        features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
        
        # Cyclical encoding
        features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
        features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
        features['day_sin'] = np.sin(2 * np.pi * features['day_of_week'] / 7)
        features['day_cos'] = np.cos(2 * np.pi * features['day_of_week'] / 7)
        features['month_sin'] = np.sin(2 * np.pi * features['month'] / 12)
        features['month_cos'] = np.cos(2 * np.pi * features['month'] / 12)
        
        # Component-specific features
        if 'consumption' in component_type:
            # Consumption patterns
            features['is_business_hours'] = ((features['hour'] >= 9) & (features['hour'] <= 17) & (features['is_weekend'] == 0)).astype(int)
            features['is_night'] = ((features['hour'] >= 22) | (features['hour'] <= 6)).astype(int)
        elif 'generation' in component_type:
            # Solar generation patterns
            features['is_daytime'] = ((features['hour'] >= 6) & (features['hour'] <= 20)).astype(int)
            features['is_peak_sun'] = ((features['hour'] >= 10) & (features['hour'] <= 16)).astype(int)
            # Seasonal for solar
            features['is_summer'] = features['month'].isin([5, 6, 7, 8]).astype(int)
            features['is_winter'] = features['month'].isin([11, 12, 1, 2]).astype(int)
        
        return features
    
    def train_component(self, df, target_col, safe_name, display_name):
        """Train model for a single component"""
        print(f"\nTraining {display_name} ({target_col})...")
        
        # Check if we have enough data
        if target_col not in df.columns:
            print(f" Column not found: {target_col}")
            return None
        
        component_data = df[[target_col]].dropna()
        if len(component_data) < 100:
            print(f" Insufficient data: {len(component_data):,} records")
            return None
        
        print(f"   Mean: {component_data[target_col].mean():.2f} kWh")
        print(f"   Records: {len(component_data):,}")
        
        # Create features
        component_type = 'consumption' if 'consumption' in safe_name else 'generation'
        features_df = self.create_features(component_data, component_type)
        
        # Prepare X and y
        X = features_df.drop(target_col, axis=1)
        y = features_df[target_col]
        
        print(f"  Features: {len(X.columns)}")
        
        # Time-series cross-validation
        n_samples = len(X)
        n_splits = min(3, max(2, n_samples // 500))
        tscv = TimeSeriesSplit(n_splits=n_splits)
        
        models = {
            'random_forest': {
                'model': RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
                'scores': []
            },
            'lightgbm': {
                'model': lgb.LGBMRegressor(n_estimators=150, learning_rate=0.05, random_state=42, verbose=-1),
                'scores': []
            }
        }
        
        print(f" {n_splits}-fold time-series CV")
        
        for fold, (train_idx, test_idx) in enumerate(tscv.split(X), 1):
            X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
            y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]
            
            # Add lag features
            if 'consumption' in safe_name:
                lags = [24, 48, 168]  # Daily, 2-day, weekly for consumption
            else:
                lags = [24, 168]  # Daily and weekly for solar
            
            for lag in lags:
                X_train[f'lag_{lag}'] = y_train.shift(lag)
                X_test[f'lag_{lag}'] = y_test.shift(lag)
            
            # Remove NaN
            X_train = X_train.dropna()
            y_train = y_train.loc[X_train.index]
            X_test = X_test.dropna()
            y_test = y_test.loc[X_test.index]
            
            if len(X_train) < 50 or len(X_test) < 20:
                continue
            
            for model_name, model_info in models.items():
                model = model_info['model']
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                mae = mean_absolute_error(y_test, y_pred)
                model_info['scores'].append(mae)
        
        # Select best model
        best_model = None
        best_model_name = None
        best_score = float('inf')
        
        for model_name, model_info in models.items():
            if model_info['scores']:
                avg_score = np.mean(model_info['scores'])
                if avg_score < best_score:
                    best_score = avg_score
                    best_model = model_info['model']
                    best_model_name = model_name
        
        if best_model is None:
            print(f" Could not train model")
            return None
        
        print(f" Best: {best_model_name} (MAE: {best_score:.2f} kWh)")
        
        # Train final model on all data
        X_final = X.copy()
        y_final = y.copy()
        
        # Add lag features
        lags = [24, 48, 168] if 'consumption' in safe_name else [24, 168]
        for lag in lags:
            X_final[f'lag_{lag}'] = y_final.shift(lag)
        
        X_final = X_final.dropna()
        y_final = y_final.loc[X_final.index]
        
        if len(X_final) < 100:
            print(f" Insufficient data for final training")
            return None
        
        best_model.fit(X_final, y_final)
        
        return {
            'model': best_model,
            'model_name': best_model_name,
            'X_train': X_final,
            'y_train': y_final,
            'test_mae': best_score,
            'features': list(X_final.columns),
            'display_name': display_name,
            'safe_name': safe_name,
            'target_col': target_col
        }
    
    def save_model(self, model_result, model_type='consumption'):
        """Save trained model"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        safe_name = model_result['safe_name']
        
        # Create model directory
        model_type_dir = os.path.join(self.models_dir, model_type)
        os.makedirs(model_type_dir, exist_ok=True)
        
        # Save model
        model_file = os.path.join(model_type_dir, f"{safe_name}_{timestamp}.pkl")
        joblib.dump(model_result['model'], model_file)
        
        # Save simple version
        simple_file = os.path.join(model_type_dir, f"{safe_name}.pkl")
        joblib.dump(model_result['model'], simple_file)
        
        # Calculate MAPE
        try:
            mape = (model_result['test_mae'] / model_result['y_train'].mean()) * 100
        except:
            mape = 0.0
        
        # Save metadata
        metadata = {
            'component': model_result['display_name'],
            'safe_name': safe_name,
            'target_column': model_result['target_col'],
            'model_type': model_type,
            'model_name': model_result['model_name'],
            'training_date': timestamp,
            'n_samples': len(model_result['X_train']),
            'n_features': len(model_result['features']),
            'test_mae': float(model_result['test_mae']),
            'test_mape': float(mape),
            'features': model_result['features'],
            'date_range': {
                'start': model_result['X_train'].index.min().isoformat(),
                'end': model_result['X_train'].index.max().isoformat()
            },
            'statistics': {
                'mean': float(model_result['y_train'].mean()),
                'std': float(model_result['y_train'].std()),
                'min': float(model_result['y_train'].min()),
                'max': float(model_result['y_train'].max())
            }
        }
        
        metadata_file = os.path.join(model_type_dir, f"{safe_name}_metadata.json")
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f" Model saved: {simple_file}")
        print(f" MAPE: {metadata['test_mape']:.1f}%")
        
        return metadata
    
    def run(self):
        """Main training pipeline"""
        print("Starting component-based forecasting...")
        
        # Load data
        df = self.load_and_prepare_data()
        if df is None:
            return
        
        trained_models = []
        
        # Train consumption components
        print(f"\n{'='*70}")
        print("TRAINING CONSUMPTION COMPONENTS")
        print("=" * 70)
        
        for target_col, safe_name, display_name in self.consumption_components:
            if target_col in df.columns:
                model_result = self.train_component(df, target_col, safe_name, display_name)
                if model_result:
                    metadata = self.save_model(model_result, 'consumption')
                    trained_models.append(metadata)
        
        # Train generation components
        print(f"\n{'='*70}")
        print("TRAINING GENERATION COMPONENTS")
        print("=" * 70)
        
        for target_col, safe_name, display_name in self.generation_components:
            if target_col in df.columns:
                model_result = self.train_component(df, target_col, safe_name, display_name)
                if model_result:
                    metadata = self.save_model(model_result, 'generation')
                    trained_models.append(metadata)
        
        # Create summary
        if trained_models:
            print(f"\n{'='*70}")
            print("TRAINING SUMMARY")
            print("=" * 70)
            
            summary_data = []
            total_consumption_mae = 0
            total_generation_mae = 0
            
            for metadata in trained_models:
                summary_data.append({
                    'Component': metadata['component'],
                    'Type': metadata['model_type'],
                    'Model': metadata['model_name'],
                    'Samples': metadata['n_samples'],
                    'MAE (kWh)': f"{metadata['test_mae']:.2f}",
                    'MAPE (%)': f"{metadata['test_mape']:.1f}",
                    'Mean (kWh)': f"{metadata['statistics']['mean']:.2f}"
                })
                
                # Accumulate MAEs for totals
                if metadata['model_type'] == 'consumption':
                    total_consumption_mae += metadata['test_mae']
                elif metadata['model_type'] == 'generation':
                    total_generation_mae += metadata['test_mae']
            
            summary_df = pd.DataFrame(summary_data)
            print(f"\n{summary_df.to_string(index=False)}")
            
            # Save summary
            summary_file = os.path.join(self.models_dir, "training_summary.csv")
            summary_df.to_csv(summary_file, index=False)
            
            print(f"\nSummary saved: {summary_file}")
            print(f"\nSuccessfully trained {len(trained_models)} components!")
            
            # Calculate expected total accuracy
            if total_consumption_mae > 0:
                print(f"\nEXPECTED TOTAL ACCURACY:")
                print(f"   Total Consumption MAE: {total_consumption_mae:.2f} kWh")
                print(f"   Total Generation MAE: {total_generation_mae:.2f} kWh")
                print(f"   Net Energy MAE: {total_consumption_mae + total_generation_mae:.2f} kWh")
                
                # Compare with your original model (1072.3 kWh MAE)
                original_mae = 1072.3
                improvement = ((original_mae - (total_consumption_mae + total_generation_mae)) / original_mae) * 100
                print(f"\nIMPROVEMENT OVER SINGLE MODEL:")
                print(f"   Original model MAE: {original_mae:.1f} kWh")
                print(f"   Component model MAE: {total_consumption_mae + total_generation_mae:.1f} kWh")
                print(f"   Improvement: {improvement:.1f}% better!")
        else:
            print(f"\nNo models were successfully trained")
        
        print(f"\n{'='*70}")
        print("NEXT STEPS:")
        print("=" * 70)
        print("1. Models saved in: models/components/")
        print("2. Use forecast_components.py to make predictions")
        print("3. Aggregate predictions for total consumption")
        print("4. Compare with site_total for validation")

if __name__ == "__main__":
    forecaster = ComponentForecaster()
    forecaster.run()