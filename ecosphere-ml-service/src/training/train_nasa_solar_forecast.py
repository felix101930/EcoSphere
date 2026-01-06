# train_solar_forecasting_comparison.py
print("☀️ SOLAR FORECASTING MODEL COMPARISON")
print("=" * 70)
print("Training: LightGBM vs Prophet vs XGBoost")
print("=" * 70)

import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
from sklearn.preprocessing import StandardScaler
import lightgbm as lgb
import xgboost as xgb
from prophet import Prophet
import joblib
import json
import os
import warnings
warnings.filterwarnings('ignore')
from datetime import datetime
import holidays

class SolarModelComparison:
    """Compare LightGBM, Prophet, and XGBoost for solar forecasting"""
    
    def __init__(self, data_path, model_dir="solar_models_comparison"):
        self.data_path = data_path
        self.model_dir = model_dir
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.X_train_ts = None
        self.X_test_ts = None
        self.y_train_ts = None
        self.y_test_ts = None
        self.feature_names = None
        self.scaler = None
        self.results = {}
        self.models = {}
        
        os.makedirs(model_dir, exist_ok=True)
    
    def load_and_prepare_data(self, test_size=0.2):
        """Load and prepare data for training"""
        print(f"\n📂 LOADING DATASET")
        print("-" * 50)
        
        self.df = pd.read_csv(self.data_path, parse_dates=['timestamp'])
        print(f"✅ Loaded {len(self.df):,} samples")
        print(f"📅 Date range: {self.df['timestamp'].min()} to {self.df['timestamp'].max()}")
        
        # Sort by timestamp
        self.df = self.df.sort_values('timestamp').reset_index(drop=True)
        
        # Display basic info
        print(f"\n📊 DATASET INFO:")
        print(f"   Shape: {self.df.shape[0]:,} rows × {self.df.shape[1]} columns")
        print(f"   Target (total_solar_kw):")
        print(f"     Mean: {self.df['total_solar_kw'].mean():.2f} kW")
        print(f"     Max:  {self.df['total_solar_kw'].max():.2f} kW")
        print(f"     Min:  {self.df['total_solar_kw'].min():.2f} kW")
        
        # Check for missing values
        missing = self.df.isnull().sum().sum()
        if missing > 0:
            print(f"⚠️  Found {missing} missing values. Filling with forward fill...")
            self.df = self.df.fillna(method='ffill')
        
        return self.df
    
    def prepare_features_for_tree_models(self):
        """Prepare features for tree-based models (LightGBM, XGBoost)"""
        print(f"\n🔧 PREPARING FEATURES FOR TREE MODELS")
        print("-" * 50)
        
        # Features to exclude
        exclude_cols = ['timestamp', 'carport_kw', 'rooftop_kw']  # Keep total_solar_kw as target
        
        # Get feature columns
        feature_cols = [col for col in self.df.columns if col not in exclude_cols and col != 'total_solar_kw']
        self.feature_names = feature_cols
        
        print(f"📋 Selected {len(feature_cols)} features:")
        # Categorize features
        weather_features = [f for f in feature_cols if any(x in f for x in ['irradiance', 'temperature', 'cloud', 'humidity', 'wind', 'pressure'])]
        time_features = [f for f in feature_cols if any(x in f for x in ['hour', 'day', 'month', 'season', 'weekend', 'daylight'])]
        lag_features = [f for f in feature_cols if 'lag' in f or 'rolling' in f]
        
        print(f"   Weather: {len(weather_features)} features")
        print(f"   Time:    {len(time_features)} features")
        print(f"   Lag:     {len(lag_features)} features")
        
        # Prepare X and y
        X = self.df[feature_cols].copy()
        y = self.df['total_solar_kw'].copy()
        
        # Handle any remaining NaN
        X = X.fillna(0)
        
        # Split data (time-series aware)
        split_idx = int(len(X) * 0.8)
        self.X_train = X.iloc[:split_idx].reset_index(drop=True)
        self.X_test = X.iloc[split_idx:].reset_index(drop=True)
        self.y_train = y.iloc[:split_idx].reset_index(drop=True)
        self.y_test = y.iloc[split_idx:].reset_index(drop=True)
        
        print(f"\n📊 DATA SPLIT:")
        print(f"   Training: {len(self.X_train):,} samples ({split_idx/len(X)*100:.1f}%)")
        print(f"   Testing:  {len(self.X_test):,} samples ({(len(X)-split_idx)/len(X)*100:.1f}%)")
        
        return self.X_train, self.X_test, self.y_train, self.y_test
    
    def prepare_features_for_prophet(self):
        """Prepare features for Prophet model"""
        print(f"\n🔧 PREPARING FEATURES FOR PROPHET")
        print("-" * 50)
        
        # Prophet requires specific format: ds (timestamp), y (target), plus regressors
        prophet_df = self.df[['timestamp', 'total_solar_kw']].copy()
        prophet_df.columns = ['ds', 'y']
        
        # Add important weather regressors
        important_regressors = [
            'solar_irradiance_whm2',
            'temperature_c',
            'cloud_cover_pct',
            'humidity_pct',
            'wind_speed_ms'
        ]
        
        # Add available regressors
        for reg in important_regressors:
            if reg in self.df.columns:
                prophet_df[reg] = self.df[reg]
        
        print(f"✅ Prophet dataset prepared with {len(prophet_df.columns)-2} regressors")
        
        # Split for Prophet (maintains time order)
        split_idx = int(len(prophet_df) * 0.8)
        self.X_train_ts = prophet_df.iloc[:split_idx].reset_index(drop=True)
        self.X_test_ts = prophet_df.iloc[split_idx:].reset_index(drop=True)
        self.y_train_ts = prophet_df['y'].iloc[:split_idx].reset_index(drop=True)
        self.y_test_ts = prophet_df['y'].iloc[split_idx:].reset_index(drop=True)
        
        return self.X_train_ts, self.X_test_ts, self.y_train_ts, self.y_test_ts
    
    def train_lightgbm(self):
        """Train LightGBM model"""
        print(f"\n💡 TRAINING LIGHTGBM MODEL")
        print("-" * 50)
        
        # LightGBM parameters optimized for solar forecasting
        params = {
            'boosting_type': 'gbdt',
            'objective': 'regression',
            'metric': ['mae', 'rmse'],
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'n_jobs': -1,
            'random_state': 42
        }
        
        # Create dataset
        train_data = lgb.Dataset(self.X_train, label=self.y_train)
        
        print("   Training LightGBM...")
        model = lgb.train(
            params,
            train_data,
            num_boost_round=1000,
            valid_sets=[train_data],
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
        )
        
        # Make predictions
        y_pred_train = model.predict(self.X_train, num_iteration=model.best_iteration)
        y_pred_test = model.predict(self.X_test, num_iteration=model.best_iteration)
        
        # Calculate metrics
        metrics = self.calculate_metrics(self.y_train, self.y_test, y_pred_train, y_pred_test)
        
        # Feature importance
        importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': model.feature_importance(importance_type='gain')
        }).sort_values('importance', ascending=False)
        
        print(f"   ✅ Test R²:  {metrics['test_r2']:.4f}")
        print(f"   ✅ Test MAE: {metrics['test_mae']:.3f} kW")
        print(f"   ✅ Test RMSE: {metrics['test_rmse']:.3f} kW")
        
        self.models['lightgbm'] = model
        self.results['lightgbm'] = {
            'metrics': metrics,
            'feature_importance': importance.to_dict('records'),
            'top_features': importance.head(10)['feature'].tolist()
        }
        
        return model, metrics
    
    def train_xgboost(self):
        """Train XGBoost model - FIXED VERSION"""
        print(f"\n🌲 TRAINING XGBOOST MODEL")
        print("-" * 50)
        
        # XGBoost parameters optimized for solar forecasting
        params = {
            'n_estimators': 1000,
            'learning_rate': 0.05,
            'max_depth': 6,
            'min_child_weight': 1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 1,
            'random_state': 42,
            'n_jobs': -1,
            'verbosity': 0
        }
        
        print("   Training XGBoost...")
        model = xgb.XGBRegressor(**params)
        
        # For XGBoost, we need to use eval_set differently
        model.fit(
            self.X_train, 
            self.y_train,
            eval_set=[(self.X_train, self.y_train), (self.X_test, self.y_test)],
            verbose=False
        )
        
        # Make predictions
        y_pred_train = model.predict(self.X_train)
        y_pred_test = model.predict(self.X_test)
        
        # Calculate metrics
        metrics = self.calculate_metrics(self.y_train, self.y_test, y_pred_train, y_pred_test)
        
        # Feature importance
        importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"   ✅ Test R²:  {metrics['test_r2']:.4f}")
        print(f"   ✅ Test MAE: {metrics['test_mae']:.3f} kW")
        print(f"   ✅ Test RMSE: {metrics['test_rmse']:.3f} kW")
        
        self.models['xgboost'] = model
        self.results['xgboost'] = {
            'metrics': metrics,
            'feature_importance': importance.to_dict('records'),
            'top_features': importance.head(10)['feature'].tolist()
        }
        
        return model, metrics
    
    def train_prophet(self):
        """Train Prophet model"""
        print(f"\n📅 TRAINING PROPHET MODEL")
        print("-" * 50)
        
        # Prepare Prophet data
        train_df = self.X_train_ts.copy()
        test_df = self.X_test_ts.copy()
        
        # Initialize Prophet with seasonality settings for solar data
        model = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,
            holidays_prior_scale=10.0,
            n_changepoints=25
        )
        
        # Add regressors
        regressors = [col for col in train_df.columns if col not in ['ds', 'y']]
        for reg in regressors:
            model.add_regressor(reg)
        
        print("   Training Prophet...")
        model.fit(train_df)
        
        # Make predictions
        train_forecast = model.predict(train_df[['ds'] + regressors])
        test_forecast = model.predict(test_df[['ds'] + regressors])
        
        # Extract predictions
        y_pred_train = train_forecast['yhat'].values
        y_pred_test = test_forecast['yhat'].values
        
        # Calculate metrics
        metrics = self.calculate_metrics(self.y_train_ts, self.y_test_ts, y_pred_train, y_pred_test)
        
        print(f"   ✅ Test R²:  {metrics['test_r2']:.4f}")
        print(f"   ✅ Test MAE: {metrics['test_mae']:.3f} kW")
        print(f"   ✅ Test RMSE: {metrics['test_rmse']:.3f} kW")
        
        self.models['prophet'] = model
        self.results['prophet'] = {
            'metrics': metrics,
            'regressors': regressors,
            'seasonalities': ['daily', 'weekly', 'yearly']
        }
        
        return model, metrics
    
    def calculate_metrics(self, y_train, y_test, y_pred_train, y_pred_test):
        """Calculate all evaluation metrics"""
        metrics = {
            'train_r2': r2_score(y_train, y_pred_train),
            'test_r2': r2_score(y_test, y_pred_test),
            'train_mae': mean_absolute_error(y_train, y_pred_train),
            'test_mae': mean_absolute_error(y_test, y_pred_test),
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_pred_train)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred_test)),
            'train_mape': mean_absolute_percentage_error(y_train, y_pred_train) * 100,
            'test_mape': mean_absolute_percentage_error(y_test, y_pred_test) * 100,
            'train_pred_mean': np.mean(y_pred_train),
            'test_pred_mean': np.mean(y_pred_test),
            'train_actual_mean': np.mean(y_train),
            'test_actual_mean': np.mean(y_test)
        }
        return metrics
    
    def compare_models(self):
        """Compare all trained models"""
        print(f"\n🏆 MODEL COMPARISON")
        print("=" * 50)
        
        comparison_df = pd.DataFrame({
            'Model': ['LightGBM', 'XGBoost', 'Prophet'],
            'Test R²': [
                self.results['lightgbm']['metrics']['test_r2'],
                self.results['xgboost']['metrics']['test_r2'],
                self.results['prophet']['metrics']['test_r2']
            ],
            'Test MAE (kW)': [
                self.results['lightgbm']['metrics']['test_mae'],
                self.results['xgboost']['metrics']['test_mae'],
                self.results['prophet']['metrics']['test_mae']
            ],
            'Test RMSE (kW)': [
                self.results['lightgbm']['metrics']['test_rmse'],
                self.results['xgboost']['metrics']['test_rmse'],
                self.results['prophet']['metrics']['test_rmse']
            ],
            'Test MAPE (%)': [
                self.results['lightgbm']['metrics']['test_mape'],
                self.results['xgboost']['metrics']['test_mape'],
                self.results['prophet']['metrics']['test_mape']
            ]
        })
        
        # Format for display
        display_df = comparison_df.copy()
        display_df['Test R²'] = display_df['Test R²'].apply(lambda x: f"{x:.4f}")
        display_df['Test MAE (kW)'] = display_df['Test MAE (kW)'].apply(lambda x: f"{x:.3f}")
        display_df['Test RMSE (kW)'] = display_df['Test RMSE (kW)'].apply(lambda x: f"{x:.3f}")
        display_df['Test MAPE (%)'] = display_df['Test MAPE (%)'].apply(lambda x: f"{x:.2f}")
        
        print(display_df.to_string(index=False))
        
        # Determine best model
        best_idx = comparison_df['Test R²'].idxmax()
        best_model = comparison_df.loc[best_idx, 'Model']
        best_r2 = comparison_df.loc[best_idx, 'Test R²']
        
        print(f"\n🎯 BEST MODEL: {best_model}")
        print(f"📊 Test R²: {best_r2:.4f}")
        print(f"📈 Test MAE: {comparison_df.loc[best_idx, 'Test MAE (kW)']:.3f} kW")
        print(f"📉 Test RMSE: {comparison_df.loc[best_idx, 'Test RMSE (kW)']:.3f} kW")
        
        # Save comparison results
        self.comparison_results = comparison_df
        self.best_model_name = best_model.lower()
        self.best_model = self.models[self.best_model_name]
        
        return comparison_df, best_model
    
    def save_models(self):
        """Save all trained models and results"""
        print(f"\n💾 SAVING MODELS AND RESULTS")
        print("-" * 50)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save each model
        for model_name, model in self.models.items():
            model_path = os.path.join(self.model_dir, f"{model_name}_model_{timestamp}.pkl")
            
            # Create model package
            if model_name in ['lightgbm', 'xgboost']:
                model_package = {
                    'model': model,
                    'feature_names': self.feature_names,
                    'scaler': self.scaler,
                    'metrics': self.results[model_name]['metrics'],
                    'top_features': self.results[model_name]['top_features'],
                    'training_info': {
                        'timestamp': timestamp,
                        'model_name': model_name,
                        'dataset': os.path.basename(self.data_path),
                        'training_samples': len(self.X_train)
                    }
                }
            else:  # prophet
                model_package = {
                    'model': model,
                    'metrics': self.results[model_name]['metrics'],
                    'regressors': self.results[model_name]['regressors'],
                    'training_info': {
                        'timestamp': timestamp,
                        'model_name': model_name,
                        'dataset': os.path.basename(self.data_path),
                        'training_samples': len(self.X_train_ts)
                    }
                }
            
            joblib.dump(model_package, model_path)
            print(f"✅ Saved {model_name}: {model_path}")
        
        # Save comparison results
        results_path = os.path.join(self.model_dir, f"comparison_results_{timestamp}.json")
        results_data = {
            'comparison': self.comparison_results.to_dict('records'),
            'best_model': self.best_model_name,
            'best_metrics': self.results[self.best_model_name]['metrics'],
            'dataset_info': {
                'total_samples': len(self.df),
                'training_samples': len(self.X_train) if self.X_train is not None else len(self.X_train_ts),
                'testing_samples': len(self.X_test) if self.X_test is not None else len(self.X_test_ts),
                'date_range': {
                    'start': self.df['timestamp'].min().isoformat(),
                    'end': self.df['timestamp'].max().isoformat()
                }
            },
            'training_timestamp': timestamp
        }
        
        with open(results_path, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        print(f"✅ Saved comparison results: {results_path}")
        
        # Create summary report
        summary_path = os.path.join(self.model_dir, f"training_summary_{timestamp}.txt")
        with open(summary_path, 'w') as f:
            f.write("=" * 60 + "\n")
            f.write("SOLAR FORECASTING MODEL TRAINING SUMMARY\n")
            f.write("=" * 60 + "\n\n")
            
            f.write(f"Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Dataset: {os.path.basename(self.data_path)}\n")
            f.write(f"Total Samples: {len(self.df):,}\n")
            f.write(f"Training Samples: {len(self.X_train) if self.X_train is not None else len(self.X_train_ts):,}\n")
            f.write(f"Testing Samples: {len(self.X_test) if self.X_test is not None else len(self.X_test_ts):,}\n\n")
            
            f.write("=" * 60 + "\n")
            f.write("MODEL PERFORMANCE COMPARISON\n")
            f.write("=" * 60 + "\n\n")
            
            for _, row in self.comparison_results.iterrows():
                f.write(f"{row['Model']}:\n")
                f.write(f"  Test R²:    {row['Test R²']:.4f}\n")
                f.write(f"  Test MAE:   {row['Test MAE (kW)']:.3f} kW\n")
                f.write(f"  Test RMSE:  {row['Test RMSE (kW)']:.3f} kW\n")
                f.write(f"  Test MAPE:  {row['Test MAPE (%)']:.2f}%\n\n")
            
            f.write("=" * 60 + "\n")
            f.write(f"🏆 BEST MODEL: {self.best_model_name.upper()}\n")
            f.write("=" * 60 + "\n\n")
            
            best_metrics = self.results[self.best_model_name]['metrics']
            f.write(f"Test R²:   {best_metrics['test_r2']:.4f}\n")
            f.write(f"Test MAE:  {best_metrics['test_mae']:.3f} kW\n")
            f.write(f"Test RMSE: {best_metrics['test_rmse']:.3f} kW\n")
            f.write(f"Test MAPE: {best_metrics['test_mape']:.2f}%\n")
        
        print(f"✅ Saved training summary: {summary_path}")
    
    def run_full_pipeline(self):
        """Run the complete training pipeline"""
        print("Starting solar forecasting model comparison...\n")
        
        # 1. Load data
        self.load_and_prepare_data()
        
        # 2. Prepare features for tree models
        self.prepare_features_for_tree_models()
        
        # 3. Prepare features for Prophet
        self.prepare_features_for_prophet()
        
        # 4. Train LightGBM
        self.train_lightgbm()
        
        # 5. Train XGBoost
        self.train_xgboost()
        
        # 6. Train Prophet
        self.train_prophet()
        
        # 7. Compare models
        self.compare_models()
        
        # 8. Save models (skip visualization)
        self.save_models()
        
        print(f"\n{'='*70}")
        print("🎉 TRAINING COMPLETE!")
        print("=" * 70)
        
        print(f"\n📁 Models saved in: {self.model_dir}")
        print(f"🏆 Best model: {self.best_model_name}")
        print(f"📊 Best R²: {self.results[self.best_model_name]['metrics']['test_r2']:.4f}")
        
        print(f"\n🚀 RECOMMENDED NEXT STEPS:")
        print(f"   1. Use best model for forecasting: models/{self.best_model_name}_model_*.pkl")
        print(f"   2. Check feature importance for insights")
        print(f"   3. Monitor model performance over time")

def main():
    """Main function"""
    # Update this path to your solar dataset
    data_path = "../../data/generation_forecast/solar_forecasting_ready_dataset.csv"
    
    if not os.path.exists(data_path):
        print(f"❌ Dataset not found: {data_path}")
        print(f"💡 Please update the data_path in the main() function")
        return
    
    # Create and run the comparison
    trainer = SolarModelComparison(data_path)
    trainer.run_full_pipeline()

if __name__ == "__main__":
    main()