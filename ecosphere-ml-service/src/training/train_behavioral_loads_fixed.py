# train_behavioral_loads_fixed.py
print("🚀 BEHAVIORAL LOADS TRAINING - FIXED VERSION")
print("=" * 70)

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.feature_selection import VarianceThreshold
import lightgbm as lgb
import xgboost as xgb
import joblib
import json
import os
import sys
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Import the WeightedEnsemble class
try:
    from behavioral_ensemble import WeightedEnsemble
except ImportError:
    print("⚠️  behavioral_ensemble.py not found. Creating WeightedEnsemble class locally...")
    
    class WeightedEnsemble:
        """Pickleable weighted ensemble model"""
        def __init__(self, models=None, weights=None):
            self.models = models if models else []
            self.weights = weights if weights else []
        
        def fit(self, X, y):
            for model in self.models:
                model.fit(X, y)
            return self
        
        def predict(self, X):
            predictions = []
            for model, weight in zip(self.models, self.weights):
                predictions.append(model.predict(X) * weight)
            return np.sum(predictions, axis=0)
        
        def get_params(self, deep=True):
            return {'models': self.models, 'weights': self.weights}
        
        def set_params(self, **params):
            for key, value in params.items():
                setattr(self, key, value)
            return self

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

# Use the FINAL optimized dataset
FINAL_DATASET_FILE = os.path.join(
    project_root, 
    "data",
    "processed",
    "behavioral_loads_long_final.csv"
)

print(f"🎯 Training on: {FINAL_DATASET_FILE}")
MODEL_DIR = os.path.join(project_root, "models", "behavioral_loads_production_fixed")
os.makedirs(MODEL_DIR, exist_ok=True)

def save_model_safely(model, feature_names, metrics, model_name, model_type):
    """Save model in a way that can be loaded later"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # For ensemble models, we need to save base models separately
    if model_type == 'ensemble':
        # Create a model package that can be reconstructed
        model_package = {
            'model_type': 'WeightedEnsemble',
            'feature_names': feature_names,
            'metrics': metrics,
            'training_info': {
                'timestamp': timestamp,
                'model_name': model_name,
                'dataset': 'behavioral_loads_long_final.csv'
            },
            # For ensemble, we need to store how to recreate it
            'ensemble_config': {
                'model_types': [type(m).__name__ for m in model.models],
                'weights': model.weights
            }
        }
        
        # Save base models individually
        base_models = {}
        for i, (base_model, weight) in enumerate(zip(model.models, model.weights)):
            base_name = f"{model_name}_base_{i}"
            base_path = os.path.join(MODEL_DIR, f"{base_name}_{timestamp}.pkl")
            joblib.dump(base_model, base_path)
            base_models[f"base_{i}"] = {
                'path': base_path,
                'type': type(base_model).__name__,
                'weight': weight
            }
        
        model_package['base_models'] = base_models
        
    else:
        # For regular models
        model_package = {
            'model': model,
            'feature_names': feature_names,
            'metrics': metrics,
            'training_info': {
                'timestamp': timestamp,
                'model_name': model_name,
                'model_type': model_type,
                'dataset': 'behavioral_loads_long_final.csv'
            }
        }
    
    # Save the main model package
    model_path = os.path.join(MODEL_DIR, f"{model_name}_{timestamp}.pkl")
    joblib.dump(model_package, model_path)
    
    return model_path

def create_ensemble_model(X_train, y_train):
    """Create and train an ensemble model"""
    print("   Training base models for ensemble...")
    
    # Train XGBoost
    xgb_model = xgb.XGBRegressor(
        n_estimators=300,
        learning_rate=0.01,
        max_depth=4,
        random_state=42,
        verbosity=0,
        n_jobs=-1
    )
    xgb_model.fit(X_train, y_train)
    
    # Train LightGBM
    lgb_model = lgb.LGBMRegressor(
        n_estimators=300,
        learning_rate=0.01,
        max_depth=4,
        random_state=42,
        verbose=-1,
        n_jobs=-1
    )
    lgb_model.fit(X_train, y_train)
    
    # Train Random Forest
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    
    # Create weighted ensemble
    ensemble = WeightedEnsemble(
        models=[xgb_model, lgb_model, rf_model],
        weights=[0.4, 0.4, 0.2]
    )
    
    return ensemble, {
        'xgboost': xgb_model,
        'lightgbm': lgb_model,
        'random_forest': rf_model
    }

def main():
    """Main training pipeline - Simplified version"""
    print(f"\n📂 LOADING DATASET")
    print("-" * 50)
    
    if not os.path.exists(FINAL_DATASET_FILE):
        print(f"❌ Dataset not found: {FINAL_DATASET_FILE}")
        return
    
    df = pd.read_csv(FINAL_DATASET_FILE)
    print(f"✅ Loaded {len(df):,} samples")
    
    # Prepare data
    print(f"\n1. 🔧 PREPARING DATA")
    print("-" * 50)
    
    # Separate features and target
    X = df.drop(columns=['kwh_value', 'timestamp'])
    if 'load_type' in X.columns:
        X = X.drop(columns=['load_type'])
    
    y = df['kwh_value']
    
    # Remove low variance features
    selector = VarianceThreshold(threshold=0.01)
    X_selected = selector.fit_transform(X)
    kept_features = X.columns[selector.get_support()]
    X_final = pd.DataFrame(X_selected, columns=kept_features)
    
    print(f"   Features: {X_final.shape[1]}")
    print(f"   Samples: {len(X_final):,}")
    
    # Create splits
    print(f"\n2. 📊 CREATING TRAIN/TEST SPLIT")
    print("-" * 50)
    
    split_idx = int(len(X_final) * 0.8)
    X_train = X_final.iloc[:split_idx].reset_index(drop=True)
    X_test = X_final.iloc[split_idx:].reset_index(drop=True)
    y_train = y.iloc[:split_idx].reset_index(drop=True)
    y_test = y.iloc[split_idx:].reset_index(drop=True)
    
    print(f"   Train: {len(X_train):,} samples")
    print(f"   Test:  {len(X_test):,} samples")
    
    # Train models
    all_results = {}
    
    print(f"\n3. 🌲 TRAINING XGBOOST")
    print("-" * 50)
    
    xgb_model = xgb.XGBRegressor(
        n_estimators=300,
        learning_rate=0.01,
        max_depth=4,
        random_state=42,
        verbosity=0,
        n_jobs=-1
    )
    xgb_model.fit(X_train, y_train)
    
    y_pred_train = xgb_model.predict(X_train)
    y_pred_test = xgb_model.predict(X_test)
    
    xgb_results = {
        'train_r2': r2_score(y_train, y_pred_train),
        'test_r2': r2_score(y_test, y_pred_test),
        'test_mae': mean_absolute_error(y_test, y_pred_test)
    }
    
    print(f"   ✅ Test R²:  {xgb_results['test_r2']:.4f}")
    print(f"   ✅ Test MAE: {xgb_results['test_mae']:.3f}")
    
    # Save XGBoost
    xgb_path = save_model_safely(
        xgb_model, kept_features.tolist(), xgb_results, 
        'xgboost', 'xgboost'
    )
    
    print(f"\n4. 💡 TRAINING LIGHTGBM")
    print("-" * 50)
    
    lgb_model = lgb.LGBMRegressor(
        n_estimators=300,
        learning_rate=0.01,
        max_depth=4,
        random_state=42,
        verbose=-1,
        n_jobs=-1
    )
    lgb_model.fit(X_train, y_train)
    
    y_pred_train = lgb_model.predict(X_train)
    y_pred_test = lgb_model.predict(X_test)
    
    lgb_results = {
        'train_r2': r2_score(y_train, y_pred_train),
        'test_r2': r2_score(y_test, y_pred_test),
        'test_mae': mean_absolute_error(y_test, y_pred_test)
    }
    
    print(f"   ✅ Test R²:  {lgb_results['test_r2']:.4f}")
    print(f"   ✅ Test MAE: {lgb_results['test_mae']:.3f}")
    
    # Save LightGBM
    lgb_path = save_model_safely(
        lgb_model, kept_features.tolist(), lgb_results,
        'lightgbm', 'lightgbm'
    )
    
    print(f"\n5. 🤝 TRAINING ENSEMBLE")
    print("-" * 50)
    
    ensemble, base_models = create_ensemble_model(X_train, y_train)
    
    y_pred_train = ensemble.predict(X_train)
    y_pred_test = ensemble.predict(X_test)
    
    ensemble_results = {
        'train_r2': r2_score(y_train, y_pred_train),
        'test_r2': r2_score(y_test, y_pred_test),
        'test_mae': mean_absolute_error(y_test, y_pred_test)
    }
    
    print(f"   ✅ Test R²:  {ensemble_results['test_r2']:.4f}")
    print(f"   ✅ Test MAE: {ensemble_results['test_mae']:.3f}")
    
    # Save ensemble
    ensemble_path = save_model_safely(
        ensemble, kept_features.tolist(), ensemble_results,
        'ensemble', 'ensemble'
    )
    
    # Determine best model
    all_results = {
        'xgboost': xgb_results['test_r2'],
        'lightgbm': lgb_results['test_r2'],
        'ensemble': ensemble_results['test_r2']
    }
    
    best_model_name = max(all_results, key=all_results.get)
    best_score = all_results[best_model_name]
    
    print(f"\n{'='*70}")
    print(f"🏆 BEST MODEL: {best_model_name.upper()}")
    print(f"📊 Test R²:    {best_score:.4f}")
    
    # Save best model info
    best_model_info = {
        'best_model': best_model_name,
        'best_score': best_score,
        'all_scores': all_results,
        'training_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'dataset': 'behavioral_loads_long_final.csv',
        'features_count': len(kept_features),
        'samples_count': len(df)
    }
    
    info_path = os.path.join(MODEL_DIR, "best_model_info.json")
    with open(info_path, 'w') as f:
        json.dump(best_model_info, f, indent=2)
    
    print(f"\n✅ Models saved to: {MODEL_DIR}")
    print(f"✅ Best model info: {info_path}")
    
    # Performance comparison
    baseline_r2 = 0.497
    improvement = best_score - baseline_r2
    improvement_pct = (improvement / baseline_r2) * 100
    
    print(f"\n📈 PERFORMANCE IMPROVEMENT:")
    print(f"   Baseline R²: {baseline_r2:.3f}")
    print(f"   Best R²:     {best_score:.3f}")
    print(f"   Improvement: +{improvement:.3f} ({improvement_pct:.1f}%)")
    
    if improvement_pct > 70:
        print(f"   🎉 OUTSTANDING IMPROVEMENT ACHIEVED!")

if __name__ == "__main__":
    main()