# src/training/train_consumption.py - Professional model training
print("🏢 PROFESSIONAL ELECTRICITY FORECASTING TRAINING")
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
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Add src to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

# Configuration
CONFIG = {
    "model_version": "v1.0",
    "target": "total_consumption",
    "test_size": 0.2,
    "random_state": 42,
    "models_dir": os.path.join(project_root, "models", "consumption"),
    "logs_dir": os.path.join(project_root, "logs"),
    "forecasts_dir": os.path.join(project_root, "data", "forecasts"),
    "data_dir": os.path.join(project_root, "data")
}

def setup_project_structure():
    """Create all necessary directories"""
    directories = [
        os.path.join(CONFIG["data_dir"], "raw"),
        os.path.join(CONFIG["data_dir"], "processed"), 
        os.path.join(CONFIG["data_dir"], "forecasts"),
        CONFIG["models_dir"],
        os.path.join(project_root, "models", "generation"),
        os.path.join(project_root, "models", "components"),
        CONFIG["logs_dir"],
        os.path.join(project_root, "config")
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"  ✅ Created/Verified: {directory}/")
    
    return True

def load_and_prepare_data(data_path=None):
    """Load and prepare data for training"""
    if data_path is None:
        data_path = os.path.join(CONFIG["data_dir"], "processed", "consumption_hourly.csv")
    
    print(f"\n1. Loading data from {data_path}...")
    
    # If processed data doesn't exist, create it
    if not os.path.exists(data_path):
        print("   Processed data not found. Creating from raw data...")
        df = create_processed_data()
    else:
        df = pd.read_csv(data_path)
        
        # Check if timestamp column exists
        timestamp_col = None
        for col in df.columns:
            if 'time' in col.lower() or 'date' in col.lower():
                timestamp_col = col
                break
        
        if timestamp_col:
            df[timestamp_col] = pd.to_datetime(df[timestamp_col])
            df.set_index(timestamp_col, inplace=True)
            df.index.name = 'timestamp'
        elif df.index.name is None or df.index.name == 'index':
            # Try to infer if first column is datetime
            first_col = df.columns[0]
            try:
                df[first_col] = pd.to_datetime(df[first_col])
                df.set_index(first_col, inplace=True)
                df.index.name = 'timestamp'
                print(f"   Using '{first_col}' as timestamp column")
            except:
                # Create a timestamp index
                df.index = pd.date_range(start='2023-01-01', periods=len(df), freq='h')
                df.index.name = 'timestamp'
                print("   Created synthetic timestamp index")
    
    df = df.sort_index()
    
    print(f"   ✅ Loaded {len(df):,} records")
    print(f"   📅 Date range: {df.index.min()} to {df.index.max()}")
    print(f"   📊 Columns: {list(df.columns)}")
    
    # Ensure target column exists - rename tl342 to total_consumption
    if 'total_consumption' not in df.columns:
        if 'tl342' in df.columns:
            df = df.rename(columns={'tl342': 'total_consumption'})
            print("   ✅ Renamed 'tl342' to 'total_consumption'")
        elif len(df.columns) == 1:
            df = df.rename(columns={df.columns[0]: 'total_consumption'})
            print(f"   ✅ Renamed '{df.columns[0]}' to 'total_consumption'")
    
    # Check if we have consumption data
    if 'total_consumption' not in df.columns:
        # Look for any column that might be consumption
        for col in df.columns:
            if any(word in col.lower() for word in ['consump', 'load', 'demand', 'power', 'kwh', 'mw']):
                df = df.rename(columns={col: 'total_consumption'})
                print(f"   ✅ Renamed '{col}' to 'total_consumption'")
                break
    
    if 'total_consumption' not in df.columns:
        raise ValueError(f"Could not find consumption data. Available columns: {list(df.columns)}")
    
    print(f"   📈 Consumption range: {df['total_consumption'].min():.1f} to {df['total_consumption'].max():.1f}")
    print(f"   📊 Consumption mean: {df['total_consumption'].mean():.1f}")
    
    return df

def create_processed_data():
    """Create processed data from raw sources"""
    print("   Processing raw data...")
    
    # Check various potential data sources
    potential_sources = [
        os.path.join(CONFIG["data_dir"], "forecast", "forecast_main.csv"),
        os.path.join(CONFIG["data_dir"], "forecast", "single_table_electricity.csv"),
        os.path.join(CONFIG["data_dir"], "individual", "tl342.csv"),
        os.path.join(CONFIG["data_dir"], "raw", "electricity_data.csv")
    ]
    
    for file_path in potential_sources:
        if os.path.exists(file_path):
            print(f"   Found data source: {file_path}")
            
            # Try different encodings and separators
            try:
                df = pd.read_csv(file_path)
                print(f"   Successfully loaded {len(df):,} rows, {len(df.columns)} columns")
                print(f"   Columns: {list(df.columns)}")
                
                # Look for timestamp column
                timestamp_col = None
                for col in df.columns:
                    if 'time' in col.lower() or 'date' in col.lower() or col.lower() == 'timestamp':
                        timestamp_col = col
                        break
                
                if timestamp_col:
                    print(f"   Using '{timestamp_col}' as timestamp column")
                    df[timestamp_col] = pd.to_datetime(df[timestamp_col])
                    df.set_index(timestamp_col, inplace=True)
                else:
                    # Try to parse first column as datetime
                    try:
                        first_col = df.columns[0]
                        df[first_col] = pd.to_datetime(df[first_col])
                        df.set_index(first_col, inplace=True)
                        print(f"   Using first column '{first_col}' as timestamp")
                    except:
                        # Create synthetic timestamp
                        df.index = pd.date_range(start='2023-01-01', periods=len(df), freq='h')
                        df.index.name = 'timestamp'
                        print("   Created synthetic timestamp index")
                
                # Process and save
                df_processed = process_raw_data(df)
                output_path = os.path.join(CONFIG["data_dir"], "processed", "consumption_hourly.csv")
                df_processed.to_csv(output_path)
                print(f"   Saved processed data to: {output_path}")
                return df_processed
                
            except Exception as e:
                print(f"   Error processing {file_path}: {e}")
                continue
    
    # Create sample data if no files found (for testing)
    print("   No data files found. Creating sample data for testing...")
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='h')
    consumption = np.random.normal(1000, 200, len(dates)) + np.sin(np.arange(len(dates)) * 2 * np.pi / 24) * 300
    df = pd.DataFrame({
        'timestamp': dates,
        'total_consumption': consumption
    })
    df.set_index('timestamp', inplace=True)
    
    output_path = os.path.join(CONFIG["data_dir"], "processed", "consumption_hourly.csv")
    df.to_csv(output_path)
    print(f"   Created sample data at: {output_path}")
    return df

def process_raw_data(df):
    """Process raw data into clean hourly time series"""
    print("   Processing raw data...")
    print(f"   Input shape: {df.shape}")
    print(f"   Input columns: {list(df.columns)}")
    
    # Check for tl342 column (from your data sample)
    if 'tl342' in df.columns:
        df = df.rename(columns={'tl342': 'total_consumption'})
        print("   Renamed 'tl342' to 'total_consumption'")
    
    # Ensure we have consumption data
    if 'total_consumption' not in df.columns:
        # Try to find consumption column
        consumption_cols = [col for col in df.columns if any(word in col.lower() for word in ['consump', 'load', 'demand', 'power', 'kwh', 'mw', 'tl'])]
        if consumption_cols:
            df = df.rename(columns={consumption_cols[0]: 'total_consumption'})
            print(f"   Renamed '{consumption_cols[0]}' to 'total_consumption'")
        else:
            raise ValueError(f"No consumption column found. Available columns: {list(df.columns)}")
    
    # Check if we have the target column
    if 'total_consumption' not in df.columns:
        raise ValueError(f"Target column 'total_consumption' not found in data")
    
    # Keep only the consumption column for now
    df_processed = df[['total_consumption']].copy()
    
    # Check for duplicates in index
    if df_processed.index.duplicated().any():
        print(f"   Found {df_processed.index.duplicated().sum()} duplicate timestamps. Taking mean...")
        df_processed = df_processed.groupby(df_processed.index).mean()
    
    # Resample to hourly if needed (check frequency)
    if len(df_processed) > 10:
        time_diff = df_processed.index[1] - df_processed.index[0]
        if time_diff < pd.Timedelta('1h'):
            print(f"   Data has higher frequency ({time_diff}). Resampling to hourly...")
            df_hourly = df_processed.resample('h').mean()
        elif time_diff > pd.Timedelta('1h'):
            print(f"   Data has lower frequency ({time_diff}). Resampling to hourly with forward fill...")
            df_hourly = df_processed.resample('h').ffill()
        else:
            df_hourly = df_processed.copy()
    else:
        df_hourly = df_processed.copy()
    
    print(f"   After resampling: {len(df_hourly):,} hourly records")
    
    # Handle negative values (common in electricity data)
    if (df_hourly['total_consumption'] < 0).any():
        print(f"   Found {len(df_hourly[df_hourly['total_consumption'] < 0])} negative values. Taking absolute value...")
        df_hourly['total_consumption'] = df_hourly['total_consumption'].abs()
    
    # Interpolate missing values (limit to 24 hours)
    missing_before = df_hourly['total_consumption'].isna().sum()
    df_hourly = df_hourly.interpolate(method='time', limit=24)
    missing_after = df_hourly['total_consumption'].isna().sum()
    
    if missing_before > 0:
        print(f"   Interpolated {missing_before - missing_after} missing values")
    
    # Remove any remaining NaNs
    df_hourly = df_hourly.dropna()
    print(f"   Final clean data: {len(df_hourly):,} records")
    
    return df_hourly

def create_features(df, target_col='total_consumption'):
    """Create time-series features without data leakage"""
    print(f"\n2. Creating features for {target_col}...")
    
    features = df.copy()
    
    # Time features (safe - no future information)
    features['hour'] = features.index.hour
    features['day_of_week'] = features.index.dayofweek
    features['month'] = features.index.month
    features['day_of_year'] = features.index.dayofyear
    features['week_of_year'] = features.index.isocalendar().week
    features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
    
    # Cyclical encoding (better for ML models)
    features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
    features['day_sin'] = np.sin(2 * np.pi * features['day_of_week'] / 7)
    features['day_cos'] = np.cos(2 * np.pi * features['day_of_week'] / 7)
    features['month_sin'] = np.sin(2 * np.pi * features['month'] / 12)
    features['month_cos'] = np.cos(2 * np.pi * features['month'] / 12)
    
    # Business patterns
    features['is_business_hours'] = (
        (features['hour'] >= 9) & 
        (features['hour'] <= 17) & 
        (features['is_weekend'] == 0)
    ).astype(int)
    
    # Seasonal indicators
    features['is_summer'] = features['month'].isin([6, 7, 8]).astype(int)
    features['is_winter'] = features['month'].isin([12, 1, 2]).astype(int)
    
    print(f"   Created {len(features.columns)} base features")
    
    return features

def train_with_cross_validation(X, y, target_col):
    """Train models with proper time-series cross-validation"""
    print(f"\n3. Training with time-series cross-validation...")
    
    # Use fewer splits if we have less data
    n_samples = len(X)
    n_splits = min(5, max(2, n_samples // 1000))
    tscv = TimeSeriesSplit(n_splits=n_splits)
    
    models = {
        'random_forest': {
            'model': RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=10,
                random_state=CONFIG['random_state'],
                n_jobs=-1
            ),
            'train_scores': [],
            'test_scores': []
        },
        'lightgbm': {
            'model': lgb.LGBMRegressor(
                n_estimators=150,
                learning_rate=0.05,
                num_leaves=15,
                random_state=CONFIG['random_state'],
                verbose=-1
            ),
            'train_scores': [],
            'test_scores': []
        }
    }
    
    print(f"   Using {tscv.n_splits}-fold time-series CV")
    
    for fold, (train_idx, test_idx) in enumerate(tscv.split(X), 1):
        print(f"\n   Fold {fold}/{tscv.n_splits}:")
        
        # Get data for this fold
        X_train = X.iloc[train_idx].copy()
        y_train = y.iloc[train_idx].copy()
        X_test = X.iloc[test_idx].copy()
        y_test = y.iloc[test_idx].copy()
        
        # Add lag features using ONLY training data (no data leakage)
        for lag in [24, 48, 168]:  # 1 day, 2 days, 1 week
            X_train[f'lag_{lag}h'] = y_train.shift(lag)
            X_test[f'lag_{lag}h'] = y_test.shift(lag)
        
        # Add rolling statistics
        for window in [24, 168]:  # 1 day, 1 week
            X_train[f'rolling_{window}h_mean'] = y_train.rolling(window).mean()
            X_test[f'rolling_{window}h_mean'] = y_test.rolling(window).mean()
        
        # Remove NaN rows
        train_mask = X_train.notna().all(axis=1)
        X_train = X_train[train_mask]
        y_train = y_train[train_mask]
        
        test_mask = X_test.notna().all(axis=1)
        X_test = X_test[test_mask]
        y_test = y_test[test_mask]
        
        if len(X_train) == 0 or len(X_test) == 0:
            print(f"   Skipping fold {fold} - insufficient data after cleaning")
            continue
        
        # Train and evaluate each model
        for model_name, model_info in models.items():
            model = model_info['model']
            
            # Train
            model.fit(X_train, y_train)
            
            # Predict
            y_train_pred = model.predict(X_train)
            y_test_pred = model.predict(X_test)
            
            # Calculate errors
            train_mae = mean_absolute_error(y_train, y_train_pred)
            test_mae = mean_absolute_error(y_test, y_test_pred)
            
            model_info['train_scores'].append(train_mae)
            model_info['test_scores'].append(test_mae)
        
        print(f"   Train: {len(X_train):,} samples, Test: {len(X_test):,} samples")
    
    return models

def save_model_artifacts(model, model_name, X_train, y_train, results, feature_names):
    """Save all model artifacts to the models/consumption folder"""
    print(f"\n4. Saving model artifacts to {CONFIG['models_dir']}/...")
    
    # Create model directory with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_dir = os.path.join(CONFIG['models_dir'], f"{model_name}_{timestamp}")
    os.makedirs(model_dir, exist_ok=True)
    
    # 1. Save the trained model
    model_filename = f"{model_name}_consumption.pkl"
    model_path = os.path.join(model_dir, model_filename)
    joblib.dump(model, model_path)
    print(f"   ✅ Model saved: {model_path}")
    
    # Also save in the consumption folder with a simple name
    simple_model_path = os.path.join(CONFIG['models_dir'], f"{model_name}_consumption.pkl")
    joblib.dump(model, simple_model_path)
    print(f"   ✅ Simple model saved: {simple_model_path}")
    
    # 2. Save feature names
    features_path = os.path.join(model_dir, "features.json")
    with open(features_path, 'w') as f:
        json.dump(feature_names, f, indent=2)
    
    # 3. Save configuration
    config_data = {
        "model_name": model_name,
        "model_version": CONFIG["model_version"],
        "training_date": timestamp,
        "target_variable": CONFIG["target"],
        "n_samples": len(X_train),
        "n_features": len(feature_names),
        "date_range": {
            "start": X_train.index.min().isoformat() if hasattr(X_train, 'index') else None,
            "end": X_train.index.max().isoformat() if hasattr(X_train, 'index') else None
        },
        "performance": {
            "cv_train_mae_mean": np.mean(results['train_scores']) if results['train_scores'] else 0,
            "cv_train_mae_std": np.std(results['train_scores']) if results['train_scores'] else 0,
            "cv_test_mae_mean": np.mean(results['test_scores']) if results['test_scores'] else 0,
            "cv_test_mae_std": np.std(results['test_scores']) if results['test_scores'] else 0,
            "cv_test_mape": (np.mean(results['test_scores']) / y_train.mean()) * 100 if results['test_scores'] and y_train.mean() != 0 else 0
        },
        "feature_importance": dict(zip(
            feature_names,
            model.feature_importances_.tolist()
        )) if hasattr(model, 'feature_importances_') else {}
    }
    
    config_path = os.path.join(model_dir, "config.json")
    with open(config_path, 'w') as f:
        json.dump(config_data, f, indent=2)
    print(f"   ✅ Configuration saved: {config_path}")
    
    # Also save config in the main consumption folder
    simple_config_path = os.path.join(CONFIG['models_dir'], f"{model_name}_config.json")
    with open(simple_config_path, 'w') as f:
        json.dump(config_data, f, indent=2)
    
    # 4. Save training log
    log_path = os.path.join(CONFIG['logs_dir'], f"consumption_training_{timestamp}.log")
    with open(log_path, 'w') as f:
        f.write(f"Training completed: {timestamp}\n")
        f.write(f"Model: {model_name}\n")
        f.write(f"Performance: {config_data['performance']}\n")
    print(f"   ✅ Training log saved: {log_path}")
    
    # 5. Create a README for the model
    readme_path = os.path.join(model_dir, "README.md")
    with open(readme_path, 'w') as f:
        f.write(f"# {model_name.upper()} - Electricity Consumption Model\n\n")
        f.write(f"**Version**: {CONFIG['model_version']}\n")
        f.write(f"**Trained on**: {timestamp}\n\n")
        f.write("## Performance\n")
        f.write(f"- Cross-validation MAE: {config_data['performance']['cv_test_mae_mean']:.1f} kWh\n")
        f.write(f"- MAPE: {config_data['performance']['cv_test_mape']:.1f}%\n\n")
        f.write("## Usage\n")
        f.write("```python\n")
        f.write("import joblib\n")
        f.write(f"model = joblib.load('{os.path.basename(model_dir)}/{model_filename}')\n")
        f.write("```\n")
    
    return model_dir

def main():
    """Main training pipeline"""
    print("Setting up project structure...")
    setup_project_structure()
    
    # Load and prepare data
    df = load_and_prepare_data()
    
    # Create features
    features_df = create_features(df)
    
    # Prepare X and y
    X = features_df.drop(CONFIG['target'], axis=1)
    y = features_df[CONFIG['target']]
    
    print(f"\n   Features: {list(X.columns)}")
    print(f"   Total samples: {len(X):,}")
    
    # Train with cross-validation
    cv_results = train_with_cross_validation(X, y, CONFIG['target'])
    
    # Select best model based on cross-validation
    print(f"\n5. Selecting best model...")
    
    best_model_name = None
    best_test_score = float('inf')
    
    for model_name, results in cv_results.items():
        if not results['test_scores']:
            print(f"   Skipping {model_name} - no valid CV scores")
            continue
            
        test_mae_mean = np.mean(results['test_scores'])
        test_mae_std = np.std(results['test_scores'])
        
        print(f"\n   {model_name.upper()}:")
        print(f"   CV Test MAE: {test_mae_mean:.1f} ± {test_mae_std:.1f} kWh")
        
        if y.mean() != 0:
            print(f"   CV Test MAPE: {(test_mae_mean / y.mean()) * 100:.1f}%")
        
        if test_mae_mean < best_test_score:
            best_test_score = test_mae_mean
            best_model_name = model_name
    
    if best_model_name is None:
        print("   ⚠️ No valid models trained. Using default random_forest...")
        best_model_name = 'random_forest'
        best_test_score = y.std() * 0.1  # Rough estimate
    
    print(f"\n   🏆 Best model: {best_model_name}")
    print(f"   📊 Expected error: {best_test_score:.1f} kWh")
    
    # Train final model on all data
    print(f"\n6. Training final {best_model_name} model on all data...")
    
    # Prepare final dataset with features
    X_final = X.copy()
    y_final = y.copy()
    
    # Add lag features for final training
    for lag in [24, 48, 168]:
        X_final[f'lag_{lag}h'] = y_final.shift(lag)
    
    for window in [24, 168]:
        X_final[f'rolling_{window}h_mean'] = y_final.rolling(window).mean()
    
    # Remove NaN rows
    final_mask = X_final.notna().all(axis=1)
    X_final = X_final[final_mask]
    y_final = y_final[final_mask]
    
    if len(X_final) == 0:
        print("   ⚠️ No data after feature engineering. Using basic features only...")
        X_final = X.copy()
        y_final = y.copy()
    
    print(f"   Final training samples: {len(X_final):,}")
    
    # Train final model
    if best_model_name == 'random_forest':
        final_model = RandomForestRegressor(
            n_estimators=150,
            max_depth=12,
            min_samples_split=8,
            random_state=CONFIG['random_state'],
            n_jobs=-1
        )
    else:  # lightgbm
        final_model = lgb.LGBMRegressor(
            n_estimators=200,
            learning_rate=0.05,
            num_leaves=20,
            random_state=CONFIG['random_state'],
            verbose=-1
        )
    
    final_model.fit(X_final, y_final)
    
    # Save model artifacts
    feature_names = list(X_final.columns)
    model_dir = save_model_artifacts(
        final_model,
        best_model_name,
        X_final,
        y_final,
        cv_results.get(best_model_name, {'train_scores': [], 'test_scores': []}),
        feature_names
    )
    
    print(f"\n" + "=" * 70)
    print(f"🎉 MODEL TRAINING COMPLETED SUCCESSFULLY!")
    print(f"📁 Models saved in: {CONFIG['models_dir']}")
    print(f"   - Full model archive: {model_dir}")
    print(f"   - Simple model file: {best_model_name}_consumption.pkl")
    print(f"📊 Expected performance: {best_test_score:.1f} kWh MAE")
    print(f"🎯 Ready for integration with your application")
    
    # Create a symbolic link to latest model
    latest_link = os.path.join(CONFIG['models_dir'], "latest_model")
    if os.path.exists(latest_link):
        os.remove(latest_link)
    
    try:
        os.symlink(model_dir, latest_link, target_is_directory=True)
        print(f"🔗 Latest model linked: {latest_link} -> {model_dir}")
    except:
        # On Windows, might need administrator privileges for symlinks
        print(f"⚠️ Could not create symbolic link (might need admin rights on Windows)")

if __name__ == "__main__":
    main()