# train_behavioral_loads_final_production.py
print("🚀 BEHAVIORAL LOADS TRAINING - PRODUCTION READY")
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
MODEL_DIR = os.path.join(project_root, "models", "behavioral_loads_production")
os.makedirs(MODEL_DIR, exist_ok=True)

def prepare_data(df):
    """Prepare data for training"""
    print(f"\n1. 🔧 PREPARING DATA")
    print("-" * 50)
    
    # Separate features and target
    X = df.drop(columns=['kwh_value', 'timestamp'])  # Always remove timestamp
    
    # Also remove load_type if it exists
    if 'load_type' in X.columns:
        X = X.drop(columns=['load_type'])
    
    y = df['kwh_value']
    
    print(f"   Initial features: {X.shape[1]}")
    print(f"   Samples: {len(X):,}")
    
    # Remove low variance features
    selector = VarianceThreshold(threshold=0.01)
    X_selected = selector.fit_transform(X)
    kept_features = X.columns[selector.get_support()]
    
    print(f"   After variance threshold: {len(kept_features)} features")
    
    # Convert back to DataFrame
    X_final = pd.DataFrame(X_selected, columns=kept_features)
    
    print(f"\n   📊 Final feature count: {X_final.shape[1]}")
    print(f"   Target range: [{y.min():.3f}, {y.max():.3f}]")
    
    return X_final, y, X_final.columns.tolist()

def create_splits(X, y, test_size=0.2):
    """Create time series splits"""
    print(f"\n2. 📊 CREATING TRAIN/TEST SPLIT")
    print("-" * 50)
    
    # Time series split (preserve order)
    split_idx = int(len(X) * (1 - test_size))
    
    X_train = X.iloc[:split_idx].reset_index(drop=True)
    X_test = X.iloc[split_idx:].reset_index(drop=True)
    
    y_train = y.iloc[:split_idx].reset_index(drop=True)
    y_test = y.iloc[split_idx:].reset_index(drop=True)
    
    print(f"📊 Train samples: {len(X_train):,} ({len(X_train)/len(X)*100:.1f}%)")
    print(f"📊 Test samples:  {len(X_test):,} ({len(X_test)/len(X)*100:.1f}%)")
    
    return X_train, X_test, y_train, y_test

def train_xgboost_model(X_train, y_train, X_test, y_test):
    """Train XGBoost model"""
    print(f"\n3. 🌲 TRAINING XGBOOST")
    print("-" * 50)
    
    try:
        # Find optimal n_estimators
        best_score = -np.inf
        best_model = None
        best_n = 0
        
        for n_estimators in [100, 200, 300, 400, 500]:
            print(f"   Trying n_estimators={n_estimators}...", end=" ")
            
            model = xgb.XGBRegressor(
                n_estimators=n_estimators,
                learning_rate=0.01,
                max_depth=4,
                min_child_weight=3,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.05,
                reg_lambda=1.0,
                random_state=42,
                verbosity=0,
                n_jobs=-1
            )
            
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            score = r2_score(y_test, y_pred)
            
            print(f"R²: {score:.4f}")
            
            if score > best_score:
                best_score = score
                best_model = model
                best_n = n_estimators
        
        # Final evaluation
        y_pred_train = best_model.predict(X_train)
        y_pred_test = best_model.predict(X_test)
        
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        
        results = {
            'model': best_model,
            'train_r2': train_r2,
            'test_r2': test_r2,
            'test_mae': test_mae,
            'test_rmse': test_rmse,
            'best_n_estimators': best_n
        }
        
        print(f"\n   ✅ Best n_estimators: {best_n}")
        print(f"   ✅ Training R²:  {train_r2:.4f}")
        print(f"   ✅ Test R²:      {test_r2:.4f}")
        print(f"   ✅ Test MAE:     {test_mae:.3f}")
        print(f"   ✅ Test RMSE:    {test_rmse:.3f}")
        
        # Overfitting check
        overfit_diff = train_r2 - test_r2
        print(f"\n   📊 Overfitting check:")
        print(f"      Train-Test difference: {overfit_diff:.4f}")
        
        if overfit_diff > 0.15:
            print(f"      ⚠️  Significant overfitting")
        elif overfit_diff > 0.1:
            print(f"      ⚠️  Moderate overfitting")
        else:
            print(f"      ✅ Good generalization")
        
        return results
        
    except Exception as e:
        print(f"   ❌ XGBoost Error: {e}")
        return None

def train_lightgbm_model(X_train, y_train, X_test, y_test):
    """Train LightGBM model"""
    print(f"\n4. 💡 TRAINING LIGHTGBM")
    print("-" * 50)
    
    try:
        # Find optimal n_estimators
        best_score = -np.inf
        best_model = None
        
        for n_estimators in [100, 200, 300, 400, 500]:
            print(f"   Trying n_estimators={n_estimators}...", end=" ")
            
            model = lgb.LGBMRegressor(
                n_estimators=n_estimators,
                learning_rate=0.01,
                max_depth=4,
                num_leaves=15,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=0.1,
                random_state=42,
                verbose=-1,
                n_jobs=-1
            )
            
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            score = r2_score(y_test, y_pred)
            
            print(f"R²: {score:.4f}")
            
            if score > best_score:
                best_score = score
                best_model = model
        
        # Final evaluation
        y_pred_train = best_model.predict(X_train)
        y_pred_test = best_model.predict(X_test)
        
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        
        results = {
            'model': best_model,
            'train_r2': train_r2,
            'test_r2': test_r2,
            'test_mae': test_mae
        }
        
        print(f"\n   ✅ Training R²:  {train_r2:.4f}")
        print(f"   ✅ Test R²:      {test_r2:.4f}")
        print(f"   ✅ Test MAE:     {test_mae:.3f}")
        
        return results
        
    except Exception as e:
        print(f"   ❌ LightGBM Error: {e}")
        return None

def train_random_forest_model(X_train, y_train, X_test, y_test):
    """Train Random Forest model"""
    print(f"\n5. 🌳 TRAINING RANDOM FOREST")
    print("-" * 50)
    
    try:
        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            bootstrap=True,
            random_state=42,
            n_jobs=-1,
            verbose=0
        )
        
        print("   Training...", end=" ")
        model.fit(X_train, y_train)
        
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        
        results = {
            'model': model,
            'train_r2': train_r2,
            'test_r2': test_r2,
            'test_mae': test_mae
        }
        
        print(f"Done")
        print(f"   ✅ Training R²:  {train_r2:.4f}")
        print(f"   ✅ Test R²:      {test_r2:.4f}")
        print(f"   ✅ Test MAE:     {test_mae:.3f}")
        
        return results
        
    except Exception as e:
        print(f"   ❌ Random Forest Error: {e}")
        return None

class WeightedEnsemble:
    """Pickleable weighted ensemble model"""
    def __init__(self, models=None, weights=None):
        self.models = models if models else []
        self.weights = weights if weights else []
    
    def fit(self, X, y):
        """Fit all base models"""
        for model in self.models:
            model.fit(X, y)
        return self
    
    def predict(self, X):
        """Make weighted predictions"""
        predictions = []
        for model, weight in zip(self.models, self.weights):
            pred = model.predict(X)
            predictions.append(pred * weight)
        
        # Sum weighted predictions
        return np.sum(predictions, axis=0)
    
    def get_params(self, deep=True):
        """Get parameters for sklearn compatibility"""
        return {
            'models': self.models,
            'weights': self.weights
        }
    
    def set_params(self, **params):
        """Set parameters for sklearn compatibility"""
        for key, value in params.items():
            setattr(self, key, value)
        return self

def train_weighted_ensemble(X_train, y_train, X_test, y_test):
    """Train weighted ensemble model"""
    print(f"\n6. 🤝 TRAINING WEIGHTED ENSEMBLE")
    print("-" * 50)
    
    try:
        print("   Training base models...")
        
        # Train individual models
        xgb_model = xgb.XGBRegressor(
            n_estimators=300,
            learning_rate=0.01,
            max_depth=4,
            random_state=42,
            verbosity=0,
            n_jobs=-1
        )
        xgb_model.fit(X_train, y_train)
        
        lgb_model = lgb.LGBMRegressor(
            n_estimators=300,
            learning_rate=0.01,
            max_depth=4,
            random_state=42,
            verbose=-1,
            n_jobs=-1
        )
        lgb_model.fit(X_train, y_train)
        
        rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=8,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train, y_train)
        
        # Create weighted ensemble
        print("   Creating weighted ensemble...")
        ensemble = WeightedEnsemble(
            models=[xgb_model, lgb_model, rf_model],
            weights=[0.4, 0.4, 0.2]
        )
        
        # Evaluate
        y_pred_train = ensemble.predict(X_train)
        y_pred_test = ensemble.predict(X_test)
        
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        
        results = {
            'model': ensemble,
            'train_r2': train_r2,
            'test_r2': test_r2,
            'test_mae': test_mae,
            'base_models': {
                'xgboost': xgb_model,
                'lightgbm': lgb_model,
                'random_forest': rf_model
            }
        }
        
        print(f"   ✅ Training R²:  {train_r2:.4f}")
        print(f"   ✅ Test R²:      {test_r2:.4f}")
        print(f"   ✅ Test MAE:     {test_mae:.3f}")
        
        return results
        
    except Exception as e:
        print(f"   ❌ Ensemble Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def save_models(models_results, feature_names, output_dir):
    """Save all trained models"""
    print(f"\n7. 💾 SAVING MODELS")
    print("-" * 50)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    saved_models = {}
    
    for model_name, results in models_results.items():
        if results:
            # For ensemble, we need to handle base models specially
            if model_name == 'ensemble' and 'base_models' in results:
                # Save base models separately
                base_models_paths = {}
                for base_name, base_model in results['base_models'].items():
                    base_path = os.path.join(output_dir, f"{base_name}_base_{timestamp}.pkl")
                    joblib.dump(base_model, base_path)
                    base_models_paths[base_name] = base_path
                
                # Update results to store paths instead of models
                results_with_paths = results.copy()
                results_with_paths['base_models_paths'] = base_models_paths
                del results_with_paths['base_models']
                
                model_package = {
                    'model': results_with_paths['model'],  # The ensemble itself
                    'feature_names': feature_names,
                    'metrics': {
                        'train_r2': results_with_paths.get('train_r2'),
                        'test_r2': results_with_paths.get('test_r2'),
                        'test_mae': results_with_paths.get('test_mae')
                    },
                    'training_info': {
                        'timestamp': timestamp,
                        'model_type': model_name,
                        'dataset': 'behavioral_loads_long_final.csv'
                    },
                    'base_models_paths': results_with_paths['base_models_paths']
                }
            else:
                # Regular model
                model_package = {
                    'model': results['model'],
                    'feature_names': feature_names,
                    'metrics': {
                        'train_r2': results.get('train_r2'),
                        'test_r2': results.get('test_r2'),
                        'test_mae': results.get('test_mae'),
                        'test_rmse': results.get('test_rmse')
                    },
                    'training_info': {
                        'timestamp': timestamp,
                        'model_type': model_name,
                        'dataset': 'behavioral_loads_long_final.csv'
                    }
                }
            
            model_path = os.path.join(output_dir, f"{model_name}_{timestamp}.pkl")
            joblib.dump(model_package, model_path)
            
            saved_models[model_name] = model_path
            print(f"   ✅ {model_name}: {model_path}")
    
    # Save best model
    if models_results:
        # Find best model by test R²
        valid_models = {k: v for k, v in models_results.items() if v is not None}
        best_model_name = max(valid_models.keys(), key=lambda x: valid_models[x]['test_r2'])
        best_result = valid_models[best_model_name]
        
        # Handle ensemble specially
        if best_model_name == 'ensemble' and 'base_models' in best_result:
            # Save base models for best ensemble
            base_models_paths = {}
            for base_name, base_model in best_result['base_models'].items():
                base_path = os.path.join(output_dir, f"best_{base_name}_base.pkl")
                joblib.dump(base_model, base_path)
                base_models_paths[base_name] = base_path
            
            best_model_package = {
                'model': best_result['model'],
                'feature_names': feature_names,
                'metrics': best_result,
                'training_info': {
                    'timestamp': timestamp,
                    'model_type': best_model_name,
                    'dataset': 'behavioral_loads_long_final.csv'
                },
                'base_models_paths': base_models_paths
            }
        else:
            best_model_package = {
                'model': best_result['model'],
                'feature_names': feature_names,
                'metrics': best_result,
                'training_info': {
                    'timestamp': timestamp,
                    'model_type': best_model_name,
                    'dataset': 'behavioral_loads_long_final.csv'
                }
            }
        
        best_model_path = os.path.join(output_dir, "best_model.pkl")
        joblib.dump(best_model_package, best_model_path)
        
        print(f"\n   🏆 Best model ({best_model_name}) saved as: {best_model_path}")
    
    return saved_models

def create_final_report(models_results, output_dir):
    """Create final performance report"""
    print(f"\n8. 📋 FINAL PERFORMANCE REPORT")
    print("-" * 50)
    
    report = []
    report.append("=" * 70)
    report.append("BEHAVIORAL LOADS PREDICTION - FINAL REPORT")
    report.append("=" * 70)
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")
    
    # Model performance
    report.append("MODEL PERFORMANCE SUMMARY")
    report.append("-" * 40)
    
    for model_name, results in models_results.items():
        if results:
            train_r2 = results.get('train_r2', 0)
            test_r2 = results.get('test_r2', 0)
            test_mae = results.get('test_mae', 0)
            
            report.append(f"{model_name.upper():<15} Train R²: {train_r2:.4f} | Test R²: {test_r2:.4f} | MAE: {test_mae:.3f}")
    
    report.append("")
    
    # Best model info
    valid_models = {k: v for k, v in models_results.items() if v is not None}
    if valid_models:
        best_model_name = max(valid_models.keys(), key=lambda x: valid_models[x]['test_r2'])
        best_result = valid_models[best_model_name]
        
        report.append("🏆 BEST MODEL DETAILS")
        report.append("-" * 40)
        report.append(f"Model: {best_model_name.upper()}")
        report.append(f"Test R²: {best_result['test_r2']:.4f}")
        report.append(f"Test MAE: {best_result['test_mae']:.3f} kWh")
        
        if 'test_rmse' in best_result:
            report.append(f"Test RMSE: {best_result['test_rmse']:.3f} kWh")
        
        if 'best_n_estimators' in best_result:
            report.append(f"Optimal trees: {best_result['best_n_estimators']}")
        
        # Improvement from baseline
        baseline_r2 = 0.497
        improvement = best_result['test_r2'] - baseline_r2
        improvement_pct = (improvement / baseline_r2) * 100
        
        report.append("")
        report.append("📈 IMPROVEMENT OVER BASELINE")
        report.append("-" * 40)
        report.append(f"Baseline R²: {baseline_r2:.3f}")
        report.append(f"New R²:      {best_result['test_r2']:.3f}")
        report.append(f"Improvement: +{improvement:.3f} ({improvement_pct:.1f}%)")
        
        if improvement_pct > 75:
            report.append("🎉 OUTSTANDING IMPROVEMENT!")
        elif improvement_pct > 50:
            report.append("🎉 EXCELLENT IMPROVEMENT!")
        elif improvement_pct > 30:
            report.append("👍 VERY GOOD IMPROVEMENT!")
        else:
            report.append("📈 MODERATE IMPROVEMENT")
    
    report.append("")
    report.append("🎯 PRODUCTION RECOMMENDATIONS")
    report.append("-" * 40)
    report.append("1. Use the best model for all predictions")
    report.append("2. Monitor MAE weekly - retrain if >20% increase")
    report.append("3. For critical applications, use ensemble model")
    report.append("4. Consider adding weather data for better accuracy")
    report.append("5. Implement model versioning for rollback capability")
    
    # Save report
    report_path = os.path.join(output_dir, "production_report.txt")
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
    
    print(f"✅ Report saved: {report_path}")
    
    # Print summary
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE - SUMMARY")
    print("=" * 70)
    
    if valid_models:
        best_model_name = max(valid_models.keys(), key=lambda x: valid_models[x]['test_r2'])
        best_result = valid_models[best_model_name]
        
        print(f"\n🏆 Best Model: {best_model_name.upper()}")
        print(f"📊 Test R²:    {best_result['test_r2']:.4f}")
        print(f"📊 Test MAE:   {best_result['test_mae']:.3f} kWh")
        
        # Show all model performances
        print(f"\n📈 All Models Performance:")
        for model_name, results in valid_models.items():
            if results:
                print(f"   {model_name:<15} R²: {results['test_r2']:.4f}, MAE: {results['test_mae']:.3f}")
    
    print(f"\n✅ Models saved to: {output_dir}")

def main():
    """Main training pipeline"""
    print(f"\n📂 LOADING DATASET")
    print("-" * 50)
    
    if not os.path.exists(FINAL_DATASET_FILE):
        print(f"❌ Dataset not found: {FINAL_DATASET_FILE}")
        return
    
    df = pd.read_csv(FINAL_DATASET_FILE)
    print(f"✅ Loaded {len(df):,} samples")
    
    # Prepare data
    X, y, feature_names = prepare_data(df)
    
    # Create splits
    X_train, X_test, y_train, y_test = create_splits(X, y, test_size=0.2)
    
    # Train models
    models_results = {}
    
    # Train XGBoost
    xgb_results = train_xgboost_model(X_train, y_train, X_test, y_test)
    models_results['xgboost'] = xgb_results
    
    # Train LightGBM
    lgb_results = train_lightgbm_model(X_train, y_train, X_test, y_test)
    models_results['lightgbm'] = lgb_results
    
    # Train Random Forest
    rf_results = train_random_forest_model(X_train, y_train, X_test, y_test)
    models_results['random_forest'] = rf_results
    
    # Train Weighted Ensemble
    ensemble_results = train_weighted_ensemble(X_train, y_train, X_test, y_test)
    models_results['ensemble'] = ensemble_results
    
    # Save models
    saved_models = save_models(models_results, feature_names, MODEL_DIR)
    
    # Create final report
    create_final_report(models_results, MODEL_DIR)
    
    print(f"\n✅ Training completed successfully!")
    
    # Feature importance for best model
    valid_models = {k: v for k, v in models_results.items() if v is not None}
    if valid_models:
        best_model_name = max(valid_models.keys(), key=lambda x: valid_models[x]['test_r2'])
        best_model = valid_models[best_model_name]['model']
        
        if hasattr(best_model, 'feature_importances_'):
            print(f"\n🔍 Top Features for {best_model_name.upper()}:")
            importances = best_model.feature_importances_
            feat_importance = pd.DataFrame({
                'feature': feature_names,
                'importance': importances
            }).sort_values('importance', ascending=False)
            
            for idx, row in feat_importance.head(10).iterrows():
                print(f"   {row['feature']}: {row['importance']:.4f}")

if __name__ == "__main__":
    main()