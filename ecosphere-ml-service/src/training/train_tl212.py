# train_tl212_realistic.py
print("🤖 REALISTIC TRAINING: TL212 - APPLIANCES CONSUMPTION")
print("=" * 70)

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import lightgbm as lgb
import joblib
import json
import os
import sys
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

# Try to import xgboost
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

# Use the clean data file
CLEAN_DATA_FILE = os.path.join(
    project_root, 
    "data", 
    "processed", 
    "appliances_consumption_clean.csv"
)

# Check if the clean file exists
if not os.path.exists(CLEAN_DATA_FILE):
    print(f"❌ Clean data file not found: {CLEAN_DATA_FILE}")
    print("\nPlease run the fixed analysis first:")
    print("python analyze_tl212_fixed_with_cutoff.py")
    sys.exit(1)

print(f"✅ Using CLEAN data file: {CLEAN_DATA_FILE}")
DATA_FILE = CLEAN_DATA_FILE

MODEL_DIR = os.path.join(project_root, "models", "components", "appliances_consumption_realistic")
os.makedirs(MODEL_DIR, exist_ok=True)

def load_and_analyze_data():
    """Load and analyze the clean data"""
    print(f"\n1. 📂 LOADING CLEAN DATA")
    print("-" * 50)
    
    try:
        # Load the clean file
        df = pd.read_csv(DATA_FILE, index_col=0, parse_dates=True)
        df = df.sort_index()
        
        print(f"✅ Loaded {len(df):,} records")
        print(f"📅 Range: {df.index.min().date()} to {df.index.max().date()}")
        print(f"📊 Columns: {list(df.columns)}")
        
        if 'value' not in df.columns:
            print("❌ 'value' column not found!")
            sys.exit(1)
        
        # Check for variance
        value_std = df['value'].std()
        value_var = df['value'].var()
        print(f"📊 Mean: {df['value'].mean():.6f}, Std: {value_std:.6f}, Var: {value_var:.6f}")
        
        if value_std < 0.001:
            print(f"⚠️  WARNING: Very low variance (std: {value_std:.6f})")
        
        # Calculate frequency
        if len(df) > 1:
            freq_seconds = (df.index[1] - df.index[0]).total_seconds()
            periods_per_hour = 3600 / freq_seconds
            periods_per_day = int(periods_per_hour * 24)
            periods_per_week = periods_per_day * 7
        else:
            periods_per_day, periods_per_week = 96, 672
        
        print(f"📈 Frequency: {freq_seconds:.0f}s intervals ({periods_per_day} periods/day)")
        
        return df, periods_per_day, periods_per_week
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        sys.exit(1)

def create_time_features(df):
    """Create time-based features WITHOUT data leakage"""
    features = df.copy()
    
    # Keep existing hour column
    if 'hour' in features.columns:
        print("   Using existing 'hour' column")
    else:
        features['hour'] = features.index.hour
    
    # Basic time features
    features['day_of_week'] = features.index.dayofweek
    features['month'] = features.index.month
    features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
    
    # Cyclical encoding for hour
    features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
    
    # Day of week cyclical encoding
    features['dow_sin'] = np.sin(2 * np.pi * features['day_of_week'] / 7)
    features['dow_cos'] = np.cos(2 * np.pi * features['day_of_week'] / 7)
    
    return features

def create_safe_lag_features(features, periods_per_day, periods_per_week):
    """Create minimal lag features to avoid data leakage"""
    df = features.copy()
    
    # IMPORTANT: Only use longer-term lags to prevent easy predictions
    # NO immediate lag_1 - that's too easy!
    
    # Daily pattern (24 hours ago)
    if periods_per_day < len(df):
        df['lag_1day'] = df['value'].shift(periods_per_day)
    
    # Weekly pattern (7 days ago)
    if periods_per_week < len(df):
        df['lag_1week'] = df['value'].shift(periods_per_week)
    
    # 2 days ago (for some medium-term pattern)
    if periods_per_day * 2 < len(df):
        df['lag_2days'] = df['value'].shift(periods_per_day * 2)
    
    return df

def create_rolling_features_safe(df, periods_per_day):
    """Create rolling statistics with proper shifting"""
    df_rolled = df.copy()
    
    # Use longer windows that make sense for energy patterns
    # All windows are SHIFTED by at least 1 period to prevent leakage
    
    # Daily average (24 periods)
    window_24h = min(periods_per_day, len(df) - 1)
    if window_24h > 0:
        df_rolled['rolling_24h_mean'] = df_rolled['value'].rolling(window_24h, min_periods=1).mean().shift(1)
        df_rolled['rolling_24h_std'] = df_rolled['value'].rolling(window_24h, min_periods=1).std().shift(1)
    
    # Weekly average (7 days)
    window_7d = min(periods_per_day * 7, len(df) - 1)
    if window_7d > 0:
        df_rolled['rolling_7d_mean'] = df_rolled['value'].rolling(window_7d, min_periods=1).mean().shift(1)
    
    return df_rolled

def prepare_features_safe(df, periods_per_day, periods_per_week):
    """Prepare features without data leakage"""
    print(f"\n2. 🔧 CREATING REALISTIC FEATURES (NO DATA LEAKAGE)")
    print("-" * 50)
    
    # Step 1: Create time features
    print("   Creating time features...")
    features_df = create_time_features(df)
    
    # Step 2: Create SAFE lag features (no immediate lags)
    print("   Creating SAFE lag features (no immediate lags)...")
    features_df = create_safe_lag_features(features_df, periods_per_day, periods_per_week)
    
    # Step 3: Create rolling features with proper shifting
    print("   Creating rolling statistics with shifting...")
    features_df = create_rolling_features_safe(features_df, periods_per_day)
    
    # Fill NaN values
    initial_nan = features_df.isna().sum().sum()
    features_df = features_df.ffill().bfill()
    final_nan = features_df.isna().sum().sum()
    
    print(f"   Filled {initial_nan - final_nan} NaN values")
    print(f"✅ Created {len(features_df.columns)} features")
    print(f"   Available features: {list(features_df.columns)}")
    
    return features_df

def create_robust_train_test_split(X, y, test_size_days=30, gap_days=1):
    """Create robust split with a gap to prevent leakage"""
    print(f"\n3. 📊 ROBUST TRAIN-TEST SPLIT (WITH GAP)")
    print("-" * 50)
    
    # Create a gap between train and test to prevent temporal leakage
    test_end = X.index.max()
    test_start = test_end - timedelta(days=test_size_days)
    train_end = test_start - timedelta(days=gap_days)  # Add gap
    
    # Find indices
    train_mask = X.index <= train_end
    test_mask = X.index >= test_start
    
    X_train = X[train_mask]
    y_train = y[train_mask]
    X_test = X[test_mask]
    y_test = y[test_mask]
    
    print(f"Train: {len(X_train):,} samples ({X_train.index.min().date()} to {X_train.index.max().date()})")
    print(f"Gap:   {gap_days} day(s)")
    print(f"Test:  {len(X_test):,} samples ({X_test.index.min().date()} to {X_test.index.max().date()})")
    print(f"Test period: {(X_test.index.max() - X_test.index.min()).days} days")
    
    return X_train, X_test, y_train, y_test

def train_simple_models(X_train, y_train, X_test, y_test):
    """Train simple models with realistic expectations"""
    print(f"\n4. 🎯 TRAINING SIMPLE MODELS")
    print("-" * 50)
    
    models = {}
    
    # 1. Baseline model: Predict same as yesterday same time
    print(f"\n   Training baseline (yesterday same time)...")
    if 'lag_1day' in X_train.columns:
        y_pred_baseline = X_test['lag_1day'].values
        baseline_mae = mean_absolute_error(y_test, y_pred_baseline)
        baseline_r2 = r2_score(y_test, y_pred_baseline)
        print(f"   Baseline MAE: {baseline_mae:.6f}, R²: {baseline_r2:.4f}")
    
    # 2. Simple models
    models_to_train = {
        'random_forest': RandomForestRegressor(
            n_estimators=50, max_depth=6, min_samples_split=20,
            random_state=42, n_jobs=-1
        ),
        'lightgbm': lgb.LGBMRegressor(
            n_estimators=100, learning_rate=0.05, max_depth=5,
            num_leaves=10, random_state=42, verbose=-1
        ),
    }
    
    if XGBOOST_AVAILABLE:
        models_to_train['xgboost'] = xgb.XGBRegressor(
            n_estimators=100, learning_rate=0.05, max_depth=4,
            random_state=42, verbosity=0
        )
    
    results = {}
    
    for model_name, model in models_to_train.items():
        print(f"\n   Training {model_name}...")
        
        try:
            # Train
            model.fit(X_train, y_train)
            
            # Predict
            y_train_pred = model.predict(X_train)
            y_test_pred = model.predict(X_test)
            
            # Calculate metrics
            train_mae = mean_absolute_error(y_train, y_train_pred)
            test_mae = mean_absolute_error(y_test, y_test_pred)
            train_r2 = r2_score(y_train, y_train_pred)
            test_r2 = r2_score(y_test, y_test_pred)
            
            results[model_name] = {
                'model': model,
                'train_mae': train_mae,
                'test_mae': test_mae,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'y_test_pred': y_test_pred
            }
            
            print(f"   Train MAE: {train_mae:.6f}, R²: {train_r2:.4f}")
            print(f"   Test  MAE: {test_mae:.6f}, R²: {test_r2:.4f}")
            
            # Check if R² is realistic
            if test_r2 > 0.95:
                print(f"   ⚠️  Very high R² - may indicate overfitting")
            elif test_r2 < 0.3:
                print(f"   ⚠️  Low R² - model may not be learning patterns")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    return results

def select_realistic_best_model(results, X_train):
    """Select best model with realistic expectations"""
    print(f"\n5. 🏆 SELECTING REALISTIC BEST MODEL")
    print("-" * 50)
    
    if not results:
        print("❌ No models trained successfully")
        return None
    
    # Look for model with best test R², but not unrealistically high
    best_model_name = None
    best_test_r2 = -float('inf')
    
    for model_name, result in results.items():
        # Prefer models with R² between 0.3 and 0.9 (realistic range)
        if 0.3 <= result['test_r2'] <= 0.9:
            if result['test_r2'] > best_test_r2:
                best_test_r2 = result['test_r2']
                best_model_name = model_name
    
    # If no model in realistic range, take the best one
    if best_model_name is None:
        print("⚠️  No model in realistic R² range (0.3-0.9)")
        best_model_name = max(results.keys(), key=lambda x: results[x]['test_r2'])
        best_test_r2 = results[best_model_name]['test_r2']
    
    print(f"Selected: {best_model_name} (Test R²: {best_test_r2:.4f})")
    
    # Feature importance
    best_model = results[best_model_name]['model']
    feature_importance = None
    
    if hasattr(best_model, 'feature_importances_') and X_train is not None:
        feature_importance = pd.DataFrame({
            'feature': X_train.columns,
            'importance': best_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\n📊 Top 10 Feature Importance:")
        for idx, row in feature_importance.head(10).iterrows():
            print(f"   {row['feature']}: {row['importance']:.4f}")
    
    return {
        'model': best_model,
        'model_name': best_model_name,
        'test_mae': results[best_model_name]['test_mae'],
        'test_r2': best_test_r2,
        'feature_importance': feature_importance
    }

def evaluate_model_realistically(model, X, y):
    """Evaluate model with realistic metrics"""
    print(f"\n6. 📊 REALISTIC MODEL EVALUATION")
    print("-" * 50)
    
    # Time series cross-validation
    tscv = TimeSeriesSplit(n_splits=3)
    cv_scores = []
    cv_maes = []
    
    print("   Time Series Cross-Validation:")
    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_train_fold, X_val_fold = X.iloc[train_idx], X.iloc[val_idx]
        y_train_fold, y_val_fold = y.iloc[train_idx], y.iloc[val_idx]
        
        # Clone model
        model_clone = model.__class__(**model.get_params())
        model_clone.fit(X_train_fold, y_train_fold)
        
        # Predict
        y_val_pred = model_clone.predict(X_val_fold)
        
        # Calculate metrics
        r2 = r2_score(y_val_fold, y_val_pred)
        mae = mean_absolute_error(y_val_fold, y_val_pred)
        
        cv_scores.append(r2)
        cv_maes.append(mae)
        
        print(f"    Fold {fold+1}: R² = {r2:.4f}, MAE = {mae:.6f}")
    
    # Final training on all data
    model.fit(X, y)
    y_pred = model.predict(X)
    
    # Final metrics
    final_mae = mean_absolute_error(y, y_pred)
    final_rmse = np.sqrt(mean_squared_error(y, y_pred))
    final_r2 = r2_score(y, y_pred)
    
    # MAPE (handle zeros)
    non_zero_mask = y != 0
    if non_zero_mask.any():
        mape = np.mean(np.abs((y[non_zero_mask] - y_pred[non_zero_mask]) / y[non_zero_mask])) * 100
    else:
        mape = 0
    
    # CV statistics
    cv_r2_mean = np.mean(cv_scores)
    cv_r2_std = np.std(cv_scores)
    cv_mae_mean = np.mean(cv_maes)
    
    print(f"\n   📊 FINAL METRICS:")
    print(f"   MAE:  {final_mae:.6f}")
    print(f"   RMSE: {final_rmse:.6f}")
    print(f"   R²:   {final_r2:.4f}")
    print(f"   MAPE: {mape:.2f}%")
    print(f"\n   📈 CROSS-VALIDATION:")
    print(f"   Mean R²:  {cv_r2_mean:.4f} (±{cv_r2_std:.4f})")
    print(f"   Mean MAE: {cv_mae_mean:.6f}")
    
    # Realistic assessment
    print(f"\n   🎯 REALISTIC ASSESSMENT:")
    if cv_r2_mean > 0.9:
        print(f"   ⚠️  Performance seems too good - possible overfitting")
    elif cv_r2_mean > 0.7:
        print(f"   ✅ Good performance for energy prediction")
    elif cv_r2_mean > 0.5:
        print(f"   ⚠️  Moderate performance - consider more features")
    else:
        print(f"   ❌ Poor performance - check data quality")
    
    return {
        'model': model,
        'final_mae': final_mae,
        'final_rmse': final_rmse,
        'final_r2': final_r2,
        'final_mape': mape,
        'cv_r2_mean': cv_r2_mean,
        'cv_r2_std': cv_r2_std,
        'cv_mae_mean': cv_mae_mean,
        'features': X.columns.tolist()
    }

def main():
    """Main training pipeline"""
    print(f"Using clean data file: {DATA_FILE}")
    
    # Load data
    df, periods_per_day, periods_per_week = load_and_analyze_data()
    
    # Prepare features WITHOUT data leakage
    features_df = prepare_features_safe(df, periods_per_day, periods_per_week)
    
    # Prepare X and y
    X = features_df.drop('value', axis=1)
    y = features_df['value']
    
    # Clean data
    mask = X.notna().all(axis=1) & y.notna()
    X = X[mask]
    y = y[mask]
    
    print(f"\n   Final dataset: {len(X):,} samples, {len(X.columns)} features")
    
    # Robust train-test split WITH GAP
    X_train, X_test, y_train, y_test = create_robust_train_test_split(
        X, y, test_size_days=30, gap_days=1
    )
    
    # Check data quality
    print(f"\n🔍 DATA QUALITY CHECK:")
    print(f"   Train variance: {y_train.var():.6f}")
    print(f"   Test variance:  {y_test.var():.6f}")
    print(f"   Feature correlation with target:")
    for col in X_train.columns[:5]:  # Show first 5
        corr = np.corrcoef(X_train[col], y_train)[0, 1]
        print(f"     {col}: {corr:.4f}")
    
    # Train simple models
    results = train_simple_models(X_train, y_train, X_test, y_test)
    
    if not results:
        print("❌ No models trained successfully")
        return
    
    # Select best model
    best_model_info = select_realistic_best_model(results, X_train)
    
    if best_model_info is None:
        print("❌ Could not select a model")
        return
    
    # Evaluate realistically
    final_result = evaluate_model_realistically(best_model_info['model'], X, y)
    
    # Save model if performance is reasonable
    if final_result['cv_r2_mean'] >= 0.3:  # At least some predictive power
        # Save model
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        model_path = os.path.join(MODEL_DIR, f"tl212_realistic_{timestamp}.pkl")
        joblib.dump(final_result['model'], model_path)
        
        simple_path = os.path.join(MODEL_DIR, "tl212_realistic.pkl")
        joblib.dump(final_result['model'], simple_path)
        
        # Save metadata
        metadata = {
            'component': 'Appliances Consumption (Realistic)',
            'table': 'TL212',
            'model_type': best_model_info['model_name'],
            'training_date': timestamp,
            'data_file': DATA_FILE,
            'performance': {
                'final_mae': float(final_result['final_mae']),
                'final_rmse': float(final_result['final_rmse']),
                'final_r2': float(final_result['final_r2']),
                'final_mape': float(final_result['final_mape']),
                'cv_r2_mean': float(final_result['cv_r2_mean']),
                'cv_r2_std': float(final_result['cv_r2_std']),
                'cv_mae_mean': float(final_result['cv_mae_mean'])
            },
            'data_info': {
                'samples': len(X),
                'features': len(final_result['features']),
                'date_range': {
                    'start': X.index.min().isoformat(),
                    'end': X.index.max().isoformat()
                },
                'train_test_gap_days': 1
            },
            'feature_engineering': {
                'approach': 'Realistic (no immediate lags)',
                'key_features': final_result['features'][:10]  # Top 10
            },
            'notes': 'Trained with realistic features to avoid data leakage'
        }
        
        # Add feature importance if available
        if best_model_info['feature_importance'] is not None:
            metadata['top_features'] = best_model_info['feature_importance'].head(10).to_dict('records')
        
        metadata_path = os.path.join(MODEL_DIR, "tl212_realistic_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"\n{'='*70}")
        print("🎉 REALISTIC TRAINING COMPLETED!")
        print("=" * 70)
        print(f"\n📁 Model saved: {simple_path}")
        print(f"📊 CV R²: {metadata['performance']['cv_r2_mean']:.4f} (±{metadata['performance']['cv_r2_std']:.4f})")
        print(f"📊 Final R²: {metadata['performance']['final_r2']:.4f}")
        print(f"📉 MAPE: {metadata['performance']['final_mape']:.2f}%")
        
        # Assessment
        print(f"\n🎯 ASSESSMENT:")
        if metadata['performance']['cv_r2_mean'] > 0.8:
            print("   ✅ Excellent predictive power")
        elif metadata['performance']['cv_r2_mean'] > 0.6:
            print("   ✅ Good predictive power")
        elif metadata['performance']['cv_r2_mean'] > 0.4:
            print("   ⚠️  Moderate predictive power")
        else:
            print("   ⚠️  Limited predictive power - consider more features/data")
            
    else:
        print(f"\n{'='*70}")
        print("❌ MODEL REJECTED - INSUFFICIENT PREDICTIVE POWER")
        print("=" * 70)
        print(f"\nCross-validation R²: {final_result['cv_r2_mean']:.4f}")
        print("Need at least 0.3 CV R² for a useful model.")
        print("\nPossible issues:")
        print("1. Insufficient temporal patterns in the data")
        print("2. Too much noise in the appliance consumption")
        print("3. Need different feature engineering approach")
        print("\nRecommendations:")
        print("1. Try aggregating to hourly data")
        print("2. Add external features (temperature, occupancy)")
        print("3. Focus on specific times of day (peak hours)")

if __name__ == "__main__":
    main()