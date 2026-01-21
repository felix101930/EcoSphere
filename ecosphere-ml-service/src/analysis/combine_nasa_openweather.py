"""
COMBINE SAIT SOLAR DATA WITH NASA WEATHER DATA
Creates a clean training dataset for solar forecasting model
"""
import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def load_sait_data(sait_file):
    """Load and clean SAIT solar data"""
    print("📥 LOADING SAIT SOLAR DATA")
    print("-" * 50)
    
    df = pd.read_csv(sait_file, parse_dates=['timestamp'])
    print(f"✅ Loaded {len(df):,} SAIT records")
    print(f"   Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # Clean solar data
    df['total_solar_kw'] = df['total_solar_kw'].clip(lower=0)  # No negative solar
    df = df[df['hour'].between(6, 21)]  # Keep only daylight hours
    
    print(f"📊 After cleaning:")
    print(f"   Records: {len(df):,}")
    print(f"   Average generation: {df['total_solar_kw'].mean():.2f} kW")
    
    return df

def load_nasa_data(nasa_file):
    """Load and clean NASA weather data with header handling"""
    print(f"\n🌍 LOADING NASA WEATHER DATA")
    print("-" * 50)
    
    # First, read the file to find where data actually starts
    with open(nasa_file, 'r') as f:
        lines = f.readlines()
    
    # Find the line that starts with "YEAR,MO,DY,HR" (actual header)
    data_start_line = 0
    for i, line in enumerate(lines):
        if line.startswith('YEAR,MO,DY,HR'):
            data_start_line = i
            break
    
    print(f"📄 NASA file structure:")
    print(f"   Total lines: {len(lines)}")
    print(f"   Data starts at line: {data_start_line + 1}")
    print(f"   Header lines to skip: {data_start_line}")
    
    # Read the CSV starting from the actual data header
    nasa_df = pd.read_csv(nasa_file, skiprows=data_start_line)
    
    print(f"✅ Raw NASA records: {len(nasa_df):,}")
    
    # Create timestamp from separate columns
    nasa_df['timestamp'] = pd.to_datetime(
        nasa_df[['YEAR', 'MO', 'DY', 'HR']].rename(
            columns={'YEAR': 'year', 'MO': 'month', 'DY': 'day', 'HR': 'hour'}
        )
    )
    
    # Remove -999 values (NASA's missing value indicator)
    nasa_clean = nasa_df.copy()
    
    # Identify which columns are weather data (not timestamp columns)
    weather_cols = [col for col in nasa_clean.columns 
                   if col not in ['YEAR', 'MO', 'DY', 'HR', 'timestamp']]
    
    for col in weather_cols:
        nasa_clean[col] = nasa_clean[col].replace(-999, np.nan)
    
    print(f"📊 Cleaned NASA data:")
    print(f"   Date range: {nasa_clean['timestamp'].min()} to {nasa_clean['timestamp'].max()}")
    
    # Check data quality
    print(f"\n🔍 NASA DATA QUALITY CHECK:")
    for col in ['ALLSKY_SFC_UV_INDEX', 'T2M', 'RH2M', 'PS', 'T2MDEW', 'WS10M']:
        if col in nasa_clean.columns:
            missing = nasa_clean[col].isna().sum()
            total = len(nasa_clean)
            print(f"   {col}: {missing:,} missing ({missing/total*100:.1f}%)")
        else:
            print(f"   ⚠️ {col}: Column not found in NASA data!")
    
    return nasa_clean

def merge_datasets(sait_df, nasa_df):
    """Merge SAIT solar data with NASA weather data"""
    print(f"\n🤝 MERGING SAIT & NASA DATA")
    print("-" * 50)
    
    # Ensure timestamps are on the hour (remove seconds)
    sait_df['timestamp'] = sait_df['timestamp'].dt.floor('H')
    nasa_df['timestamp'] = nasa_df['timestamp'].dt.floor('H')
    
    # Merge on timestamp
    merged = pd.merge(sait_df, nasa_df, on='timestamp', how='inner')
    
    print(f"✅ Merge complete:")
    print(f"   SAIT records: {len(sait_df):,}")
    print(f"   NASA records: {len(nasa_df):,}")
    print(f"   Merged records: {len(merged):,}")
    print(f"   Merge efficiency: {len(merged)/len(sait_df)*100:.1f}%")
    
    return merged

def handle_missing_values_simple(df):
    """Simplified missing value handling"""
    print(f"\n🔧 HANDLING MISSING VALUES (Simplified)")
    print("-" * 50)
    
    missing_before = df.isna().sum().sum()
    print(f"   Missing values before: {missing_before:,}")
    
    # Create hour column from timestamp if not exists
    if 'hour' not in df.columns:
        df['hour'] = df['timestamp'].dt.hour
    
    # 1. Handle solar columns
    solar_cols = ['carport_kw', 'rooftop_kw', 'total_solar_kw']
    for col in solar_cols:
        if col in df.columns:
            # Set nighttime (9PM-6AM) solar to 0
            night_mask = ~df['hour'].between(6, 21)
            df.loc[night_mask & df[col].isna(), col] = 0
            
            # Interpolate remaining missing
            df[col] = df[col].interpolate(method='linear', limit=3)
            
            # Fill any remaining with 0
            df[col] = df[col].fillna(0)
            
            missing_now = df[col].isna().sum()
            print(f"   Solar {col}: {df[col].isna().sum():,} remaining missing")
    
    # 2. Handle weather columns (NASA data)
    # These should have very few missing based on your NASA quality check
    weather_prefixes = ['ALLSKY', 'T2M', 'RH2M', 'PS', 'WS', 'WD', 'PRECTOT']
    weather_cols = [col for col in df.columns 
                   if any(col.startswith(prefix) for prefix in weather_prefixes)]
    
    for col in weather_cols:
        if col in df.columns:
            # Simple forward/backward fill
            df[col] = df[col].ffill().bfill()
            
            # If still missing, use column median
            df[col] = df[col].fillna(df[col].median())
            
            print(f"   Weather {col}: {df[col].isna().sum():,} remaining missing")
    
    missing_after = df.isna().sum().sum()
    print(f"   Missing values after: {missing_after:,}")
    print(f"   Total filled: {missing_before - missing_after:,}")
    
    return df

def create_engineered_features(df):
    """Create time-based and derived features for ML"""
    print(f"\n⚙️ CREATING ENGINEERED FEATURES")
    print("-" * 50)
    
    features_df = df.copy()
    
    # 1. Rename NASA columns to meaningful names
    column_mapping = {
        'ALLSKY_SFC_UV_INDEX': 'uv_index',
        'T2M': 'temperature_c',
        'RH2M': 'humidity_pct',
        'PS': 'pressure_kpa',
        'T2MDEW': 'dew_point_c',
        'WS10M': 'wind_speed_ms',
        'WD10M': 'wind_direction_deg',
        'PRECTOTCORR': 'precipitation_mmh'
    }
    
    for old, new in column_mapping.items():
        if old in features_df.columns:
            features_df[new] = features_df[old]
    
    # 2. Time-based features
    features_df['hour'] = features_df['timestamp'].dt.hour
    features_df['day_of_week'] = features_df['timestamp'].dt.dayofweek
    features_df['month'] = features_df['timestamp'].dt.month
    features_df['day_of_year'] = features_df['timestamp'].dt.dayofyear
    
    # Cyclical encoding
    features_df['hour_sin'] = np.sin(2 * np.pi * features_df['hour'] / 24)
    features_df['hour_cos'] = np.cos(2 * np.pi * features_df['hour'] / 24)
    features_df['month_sin'] = np.sin(2 * np.pi * features_df['month'] / 12)
    features_df['month_cos'] = np.cos(2 * np.pi * features_df['month'] / 12)
    
    # Daylight indicator
    features_df['is_daylight'] = features_df['hour'].between(6, 21).astype(int)
    
    # Season (Calgary: 0=Winter, 1=Spring, 2=Summer, 3=Fall)
    features_df['season'] = features_df['month'].apply(
        lambda m: 0 if m in [12, 1, 2] else
                  1 if m in [3, 4, 5] else
                  2 if m in [6, 7, 8] else 3
    )
    
    # 3. Derived weather features
    # Clear sky estimate (simplified)
    features_df['clear_sky_uv'] = features_df['uv_index'] / (1 - 0.6 * (features_df['humidity_pct'] / 100))
    
    # Wind chill (simplified)
    features_df['feels_like_temp'] = features_df['temperature_c'] - (features_df['wind_speed_ms'] * 0.7)
    
    # 4. Target variable transformations
    features_df['log_total_solar'] = np.log1p(features_df['total_solar_kw'])
    
    print(f"✅ Created {len(features_df.columns) - len(df.columns)} new features")
    print(f"   Total features: {len(features_df.columns)}")
    
    return features_df

def analyze_final_dataset(df):
    """Analyze the final combined dataset"""
    print(f"\n📊 FINAL DATASET ANALYSIS")
    print("=" * 60)
    
    print(f"Dataset shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"Date range: {df['timestamp'].min().date()} to {df['timestamp'].max().date()}")
    
    duration_days = (df['timestamp'].max() - df['timestamp'].min()).days
    print(f"Duration: {duration_days} days ({duration_days/30:.1f} months)")
    
    print(f"\n🌞 SOLAR GENERATION STATISTICS:")
    solar_stats = df[['carport_kw', 'rooftop_kw', 'total_solar_kw']].describe().round(3)
    print(solar_stats.to_string())
    
    print(f"\n🌤️ WEATHER STATISTICS:")
    weather_cols = ['uv_index', 'temperature_c', 'humidity_pct', 'wind_speed_ms', 'pressure_kpa']
    weather_stats = df[weather_cols].describe().round(3)
    print(weather_stats.to_string())
    
    print(f"\n📈 CORRELATION WITH TOTAL SOLAR (top 10):")
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    corr_with_target = df[numeric_cols].corr()['total_solar_kw'].abs().sort_values(ascending=False)
    
    print("Feature".ljust(25) + "Correlation")
    print("-" * 40)
    for feature, corr in corr_with_target.head(11).items():
        if feature != 'total_solar_kw':
            print(f"{feature[:24].ljust(25)} {corr:.3f}")
    
    return corr_with_target

def save_dataset(df, filename="sait_nasa_combined_dataset.csv"):
    """Save the final dataset"""
    print(f"\n💾 SAVING FINAL DATASET")
    print("-" * 50)
    
    # Select and order columns
    final_cols = [
        'timestamp',
        'carport_kw', 'rooftop_kw', 'total_solar_kw',
        'uv_index', 'temperature_c', 'humidity_pct', 
        'pressure_kpa', 'dew_point_c', 'wind_speed_ms',
        'wind_direction_deg', 'precipitation_mmh',
        'hour', 'hour_sin', 'hour_cos', 'month_sin', 'month_cos',
        'day_of_week', 'month', 'day_of_year', 'is_daylight', 'season'
    ]
    
    # Only include columns that exist
    final_cols = [col for col in final_cols if col in df.columns]
    
    final_df = df[final_cols].copy()
    final_df.to_csv(filename, index=False)
    
    print(f"✅ Dataset saved to: {filename}")
    print(f"📁 File size: {final_df.memory_usage(deep=True).sum() / 1024 / 1024:.1f} MB")
    print(f"📊 Shape: {final_df.shape[0]:,} rows × {final_df.shape[1]} columns")
    
    # Save metadata
    metadata = {
        'created': datetime.now().isoformat(),
        'samples': len(final_df),
        'features': len(final_df.columns),
        'date_range': {
            'start': final_df['timestamp'].min().isoformat(),
            'end': final_df['timestamp'].max().isoformat()
        },
        'target_variable': 'total_solar_kw',
        'description': 'SAIT solar + NASA weather combined dataset for ML training'
    }
    
    import json
    with open('dataset_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📁 Metadata saved to: dataset_metadata.json")
    
    return filename

def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("SAIT + NASA DATA COMBINATION PIPELINE")
    print("="*70)
    
    # File paths
    sait_file = "../../data/processed/sait_solar_combined_hourly.csv"
    nasa_file = "../../data/processed/nasa_match_openweather.csv"
    
    # 1. Load SAIT data
    sait_df = load_sait_data(sait_file)
    
    # 2. Load NASA data
    nasa_df = load_nasa_data(nasa_file)
    
    # 3. Merge datasets
    merged_df = merge_datasets(sait_df, nasa_df)
    
    if len(merged_df) == 0:
        print("❌ No overlapping data found!")
        return
    
    # 4. Handle missing values - USE SIMPLIFIED VERSION
    clean_df = handle_missing_values_simple(merged_df)
    
    # 5. Create engineered features
    final_df = create_engineered_features(clean_df)
    
    # 6. Analyze the dataset
    analyze_final_dataset(final_df)
    
    # 7. Save the final dataset
    output_file = save_dataset(final_df, "sait_nasa_ready_for_training.csv")
    
    print(f"\n{'='*70}")
    print("🎉 DATASET CREATION COMPLETE!")
    print("="*70)
    
    print(f"\n🚀 READY FOR MODEL TRAINING!")
    print(f"   Dataset: {output_file}")
    print(f"   Target: 'total_solar_kw'")
    print(f"   Features: {len(final_df.columns) - 4} weather/time features")
    
    print(f"\n📋 RECOMMENDED MODEL FEATURES:")
    print(f"   1. uv_index (most important for solar)")
    print(f"   2. temperature_c")
    print(f"   3. hour_sin/hour_cos (time encoding)")
    print(f"   4. humidity_pct")
    print(f"   5. wind_speed_ms")

if __name__ == "__main__":
    main()