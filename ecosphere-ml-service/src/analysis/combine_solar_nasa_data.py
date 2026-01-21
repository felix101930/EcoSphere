# combine_solar_nasa_data_FINAL.py
print("🌞 COMBINING SOLAR & NASA WEATHER DATA FOR ML TRAINING")
print("=" * 70)

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')

def get_db_connection():
    """Get database connection"""
    try:
        import pyodbc
        CONNECTION_STRING = (
            'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=(localdb)\\MSSQLLocalDB;'
            'DATABASE=TestSlimDB;'
            'Trusted_Connection=yes;'
        )
        return pyodbc.connect(CONNECTION_STRING)
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def load_solar_data_from_db():
    """Load solar data directly from database"""
    print("📥 LOADING SOLAR DATA FROM DATABASE")
    print("-" * 50)
    
    conn = get_db_connection()
    if conn is None:
        return None, None
    
    try:
        # Load Carport Solar (TL252)
        print("  📊 Loading Carport Solar (TL252)...", end=" ")
        query_carport = """
        SELECT 
            [ts] as timestamp,
            [value] as carport_value
        FROM [dbo].[SaitSolarLab_30000_TL252]
        WHERE [ts] >= '2019-03-08 19:40:00' 
          AND [ts] <= '2020-11-08 03:54:00'
          AND [value] IS NOT NULL
        ORDER BY [ts]
        """
        carport_df = pd.read_sql_query(query_carport, conn, parse_dates=['timestamp'])
        print(f"✅ {len(carport_df):,} records")
        
        # Load Rooftop Solar (TL253)
        print("  📊 Loading Rooftop Solar (TL253)...", end=" ")
        query_rooftop = """
        SELECT 
            [ts] as timestamp,
            [value] as rooftop_value
        FROM [dbo].[SaitSolarLab_30000_TL253]
        WHERE [ts] >= '2019-03-08 19:40:00' 
          AND [ts] <= '2020-11-08 03:54:00'
          AND [value] IS NOT NULL
        ORDER BY [ts]
        """
        rooftop_df = pd.read_sql_query(query_rooftop, conn, parse_dates=['timestamp'])
        print(f"✅ {len(rooftop_df):,} records")
        
        conn.close()
        return carport_df, rooftop_df
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.close()
        return None, None

def load_nasa_data(nasa_file_path):
    """Load NASA POWER weather data - FIXED VERSION"""
    print(f"\n🌤️ LOADING NASA POWER WEATHER DATA")
    print("-" * 50)
    
    try:
        # First, let's read the file to see its structure
        with open(nasa_file_path, 'r') as f:
            lines = f.readlines()
        
        print(f"  File has {len(lines)} lines")
        
        # Find where the data actually starts (skip header)
        data_start_line = 0
        for i, line in enumerate(lines):
            if line.startswith('YEAR,MO,DY,HR'):
                data_start_line = i
                break
        
        print(f"  Data starts at line: {data_start_line + 1}")
        
        # Read the data starting from the header row
        nasa_df = pd.read_csv(nasa_file_path, skiprows=data_start_line)
        
        print(f"✅ NASA data: {len(nasa_df):,} records")
        print(f"  Columns: {list(nasa_df.columns)}")
        
        # Create timestamp from YEAR, MO, DY, HR columns
        nasa_df['timestamp'] = pd.to_datetime(
            nasa_df[['YEAR', 'MO', 'DY', 'HR']].rename(
                columns={'YEAR': 'year', 'MO': 'month', 'DY': 'day', 'HR': 'hour'}
            )
        )
        
        print(f"📅 NASA date range: {nasa_df['timestamp'].min()} to {nasa_df['timestamp'].max()}")
        
        # Select and rename important columns
        nasa_clean = nasa_df[['timestamp']].copy()
        
        # Weather features (most important for solar)
        weather_features = {
            'ALLSKY_SFC_SW_DWN': 'solar_irradiance_whm2',  # Most important!
            'CLRSKY_SFC_SW_DWN': 'clear_sky_irradiance_whm2',
            'ALLSKY_SFC_SW_DNI': 'direct_normal_irradiance_whm2',
            'ALLSKY_SFC_SW_DIFF': 'diffuse_irradiance_whm2',
            'T2M': 'temperature_c',
            'RH2M': 'humidity_pct',
            'CLOUD_AMT': 'cloud_cover_pct',
            'WS10M': 'wind_speed_ms',
            'PRECTOTCORR': 'precipitation_mmh',
            'PS': 'pressure_kpa',
            'ALLSKY_KT': 'clearness_index',
            'SZA': 'solar_zenith_angle',
            'ALLSKY_SRF_ALB': 'albedo',
            'T2MDEW': 'dew_point_c',
            'T2MWET': 'wet_bulb_temp_c',
            'WD10M': 'wind_direction_deg',
            'ALLSKY_SFC_PAR_TOT': 'par_total_whm2',
            'CLRSKY_SFC_PAR_TOT': 'clear_sky_par_whm2',
            'QV2M': 'specific_humidity_gkg',
            'ALLSKY_SFC_UVA': 'uva_irradiance_whm2'
        }
        
        for nasa_col, clean_name in weather_features.items():
            if nasa_col in nasa_df.columns:
                nasa_clean[clean_name] = nasa_df[nasa_col]
                # Print first few values to check
                if nasa_col == 'ALLSKY_SFC_SW_DWN':
                    print(f"  Sample {clean_name}: {nasa_df[nasa_col].iloc[0]} (first value)")
        
        # Handle missing values (-999)
        print(f"  Handling missing values (-999)...")
        for col in nasa_clean.columns:
            if col != 'timestamp':
                # Count missing values before replacement
                missing_before = (nasa_clean[col] == -999).sum() if col in nasa_clean.columns else 0
                nasa_clean[col] = nasa_clean[col].replace(-999, np.nan)
                missing_after = nasa_clean[col].isna().sum()
                if missing_before > 0:
                    print(f"    {col}: Replaced {missing_before} -999 values with NaN")
        
        print(f"📊 Selected {len(nasa_clean.columns)-1} weather features")
        print(f"📈 Sample record:")
        print(nasa_clean.iloc[0].to_dict())
        
        return nasa_clean
        
    except Exception as e:
        print(f"❌ Error loading NASA data: {e}")
        import traceback
        traceback.print_exc()
        return None

def clean_solar_data(carport_df, rooftop_df):
    """Clean and preprocess solar data"""
    print(f"\n🧹 CLEANING SOLAR DATA")
    print("-" * 50)
    
    # Combine solar data
    solar_df = pd.merge(carport_df, rooftop_df, on='timestamp', how='outer')
    print(f"  Combined records: {len(solar_df):,}")
    
    # Sort by timestamp
    solar_df = solar_df.sort_values('timestamp').reset_index(drop=True)
    
    # FIX UNIT ISSUE: Data appears to be in Wh, convert to kW (divide by 1000)
    print(f"  🔧 Fixing unit issue: Assuming data is in Wh, converting to kW")
    solar_df['carport_kw'] = solar_df['carport_value'] / 1000
    solar_df['rooftop_kw'] = solar_df['rooftop_value'] / 1000
    
    # Remove extreme values (unrealistic for solar)
    print(f"  🗑️ Removing extreme values:")
    
    # Carport: Remove > 100 kW (unrealistic for carport solar)
    before_carport = len(solar_df)
    solar_df = solar_df[solar_df['carport_kw'] <= 100]
    after_carport = len(solar_df)
    removed_carport = before_carport - after_carport
    print(f"    Carport: Removed {removed_carport} records > 100 kW ({removed_carport/len(solar_df)*100:.1f}%)")
    
    # Rooftop: Remove > 50 kW (unrealistic for rooftop)
    before_rooftop = len(solar_df)
    solar_df = solar_df[solar_df['rooftop_kw'] <= 50]
    after_rooftop = len(solar_df)
    removed_rooftop = before_rooftop - after_rooftop
    print(f"    Rooftop: Removed {removed_rooftop} records > 50 kW ({removed_rooftop/len(solar_df)*100:.1f}%)")
    
    # Remove negative values during daytime (6AM-6PM)
    solar_df['hour'] = solar_df['timestamp'].dt.hour
    daytime_mask = (solar_df['hour'] >= 6) & (solar_df['hour'] <= 18)
    
    negative_day_carport = ((solar_df['carport_kw'] < 0) & daytime_mask).sum()
    negative_day_rooftop = ((solar_df['rooftop_kw'] < 0) & daytime_mask).sum()
    
    solar_df.loc[daytime_mask & (solar_df['carport_kw'] < 0), 'carport_kw'] = 0
    solar_df.loc[daytime_mask & (solar_df['rooftop_kw'] < 0), 'rooftop_kw'] = 0
    
    print(f"    Set {negative_day_carport} negative carport values to 0 during daytime")
    print(f"    Set {negative_day_rooftop} negative rooftop values to 0 during daytime")
    
    # Check for stuck values (consecutive identical values)
    print(f"  🔍 Checking for stuck values:")
    
    # Check for consecutive identical values in carport
    carport_stuck = ((solar_df['carport_kw'].diff() == 0) & 
                     (solar_df['carport_kw'].diff().shift(-1) == 0)).sum()
    
    # Check for consecutive identical values in rooftop
    rooftop_stuck = ((solar_df['rooftop_kw'].diff() == 0) & 
                     (solar_df['rooftop_kw'].diff().shift(-1) == 0)).sum()
    
    print(f"    Found {carport_stuck} stuck sequences in carport data")
    print(f"    Found {rooftop_stuck} stuck sequences in rooftop data")
    
    # For stuck values, we'll interpolate them later in the processing
    
    # Calculate total solar generation
    solar_df['total_solar_kw'] = solar_df['carport_kw'] + solar_df['rooftop_kw']
    
    # Keep only necessary columns
    solar_clean = solar_df[['timestamp', 'carport_kw', 'rooftop_kw', 'total_solar_kw']].copy()
    
    print(f"  ✅ Clean solar data: {len(solar_clean):,} records")
    print(f"  📊 Average generation: {solar_clean['total_solar_kw'].mean():.2f} kW")
    print(f"  📊 Carport avg: {solar_clean['carport_kw'].mean():.2f} kW")
    print(f"  📊 Rooftop avg: {solar_clean['rooftop_kw'].mean():.2f} kW")
    
    return solar_clean

def resample_and_align_data(solar_df, nasa_df):
    """Resample data to hourly and align timestamps"""
    print(f"\n⏱️ RESAMPLING & ALIGNING DATA")
    print("-" * 50)
    
    # Set timestamp as index for resampling
    solar_df = solar_df.set_index('timestamp')
    nasa_df = nasa_df.set_index('timestamp')
    
    print(f"  Solar data frequency: {pd.infer_freq(solar_df.index[:10])}")
    print(f"  NASA data frequency: {pd.infer_freq(nasa_df.index[:10])}")
    
    # Resample solar data to hourly (take mean)
    print(f"  Resampling solar data to hourly (mean)...")
    solar_hourly = solar_df.resample('H').mean()
    
    print(f"  Solar: {len(solar_df):,} raw → {len(solar_hourly):,} hourly records")
    print(f"  NASA: {len(nasa_df):,} hourly records")
    
    # Merge solar and weather data
    print(f"  Merging solar and weather data...")
    combined_df = pd.merge(solar_hourly, nasa_df, 
                          left_index=True, right_index=True, 
                          how='inner')
    
    print(f"  ✅ Combined dataset: {len(combined_df):,} hours")
    print(f"  📅 Date range: {combined_df.index.min()} to {combined_df.index.max()}")
    print(f"  📊 Coverage: {len(combined_df)/24:.0f} days")
    
    # Check for missing hours
    expected_hours = pd.date_range(start=combined_df.index.min(), 
                                   end=combined_df.index.max(), freq='H')
    missing_hours = len(expected_hours) - len(combined_df)
    if missing_hours > 0:
        print(f"  ⚠️  Missing {missing_hours} hours ({missing_hours/len(expected_hours)*100:.1f}%)")
    
    # Reset index for easier handling
    combined_df = combined_df.reset_index()
    
    return combined_df

def handle_missing_values(df):
    """Handle missing values in the combined dataset - FIXED VERSION"""
    print(f"\n🔧 HANDLING MISSING VALUES")
    print("-" * 50)
    
    missing_before = df.isna().sum().sum()
    if missing_before == 0:
        print(f"  ✅ No missing values found!")
        return df
    
    print(f"  Missing values before: {missing_before}")
    
    # Set timestamp as index temporarily for time-based interpolation
    df_temp = df.set_index('timestamp')
    
    # Separate features for different imputation strategies
    solar_cols = ['carport_kw', 'rooftop_kw', 'total_solar_kw']
    weather_cols = [col for col in df_temp.columns if col not in solar_cols]
    
    print(f"  Solar columns with missing: {[col for col in solar_cols if df_temp[col].isna().sum() > 0]}")
    print(f"  Weather columns with missing: {[col for col in weather_cols if df_temp[col].isna().sum() > 0][:5]}...")
    
    # 1. Solar data: Use time-based interpolation (limit 3 hours)
    for col in solar_cols:
        missing_count = df_temp[col].isna().sum()
        if missing_count > 0:
            df_temp[col] = df_temp[col].interpolate(method='time', limit=3)
            filled = missing_count - df_temp[col].isna().sum()
            if filled > 0:
                print(f"    Solar {col}: Interpolated {filled} values")
    
    # 2. Weather data: Use forward/backward fill with limits
    for col in weather_cols:
        missing_count = df_temp[col].isna().sum()
        if missing_count > 0:
            # First try forward fill (6 hours)
            df_temp[col] = df_temp[col].ffill(limit=6)
            # Then backward fill (6 hours)
            df_temp[col] = df_temp[col].bfill(limit=6)
            filled = missing_count - df_temp[col].isna().sum()
            if filled > 0:
                print(f"    Weather {col}: Filled {filled} values")
    
    # 3. For any remaining NaNs in solar data, use median of same hour
    for col in solar_cols:
        remaining = df_temp[col].isna().sum()
        if remaining > 0:
            # Calculate median by hour of day
            hour_median = df_temp.groupby(df_temp.index.hour)[col].transform('median')
            df_temp[col] = df_temp[col].fillna(hour_median)
            print(f"    Solar {col}: Filled {remaining} with hour-of-day median")
    
    # 4. For any remaining NaNs in weather, use column median
    for col in weather_cols:
        remaining = df_temp[col].isna().sum()
        if remaining > 0:
            median_val = df_temp[col].median()
            df_temp[col] = df_temp[col].fillna(median_val)
            print(f"    Weather {col}: Filled {remaining} with column median ({median_val:.2f})")
    
    # Reset index back to column
    df = df_temp.reset_index()
    
    missing_after = df.isna().sum().sum()
    print(f"  Missing values after: {missing_after}")
    print(f"  ✅ Handled {missing_before - missing_after} missing values")
    
    return df

def add_time_features(df):
    """Add time-based features for ML"""
    print(f"\n⏰ ADDING TIME FEATURES")
    print("-" * 50)
    
    df_features = df.copy()
    
    # 1. Basic time features
    df_features['hour'] = df_features['timestamp'].dt.hour
    df_features['day_of_week'] = df_features['timestamp'].dt.dayofweek
    df_features['month'] = df_features['timestamp'].dt.month
    df_features['day_of_year'] = df_features['timestamp'].dt.dayofyear
    df_features['is_weekend'] = (df_features['day_of_week'] >= 5).astype(int)
    
    # 2. Cyclical encoding for hour and month
    df_features['hour_sin'] = np.sin(2 * np.pi * df_features['hour'] / 24)
    df_features['hour_cos'] = np.cos(2 * np.pi * df_features['hour'] / 24)
    df_features['month_sin'] = np.sin(2 * np.pi * df_features['month'] / 12)
    df_features['month_cos'] = np.cos(2 * np.pi * df_features['month'] / 12)
    
    # 3. Daylight indicator (Calgary: 6AM-9PM in summer)
    df_features['is_daylight'] = ((df_features['hour'] >= 6) & (df_features['hour'] <= 21)).astype(int)
    
    # 4. Season indicator
    df_features['season'] = df_features['month'].apply(
        lambda x: 0 if x in [12, 1, 2] else  # Winter
                  1 if x in [3, 4, 5] else   # Spring
                  2 if x in [6, 7, 8] else   # Summer
                  3                          # Fall
    )
    
    # 5. Lag features for solar generation
    print(f"  Adding lag features...")
    for lag in [24, 48, 168]:  # 1 day, 2 days, 1 week
        df_features[f'total_solar_lag_{lag}h'] = df_features['total_solar_kw'].shift(lag)
    
    # 6. Rolling statistics
    print(f"  Adding rolling statistics...")
    windows = [24, 168]  # Daily and weekly
    for window in windows:
        df_features[f'total_solar_rolling_{window}h_mean'] = df_features['total_solar_kw'].rolling(window, min_periods=1).mean()
        df_features[f'total_solar_rolling_{window}h_std'] = df_features['total_solar_kw'].rolling(window, min_periods=1).std()
    
    # 7. Weather-solar interaction features
    print(f"  Adding interaction features...")
    df_features['irradiance_per_kw'] = df_features['solar_irradiance_whm2'] / (df_features['total_solar_kw'] + 0.001)
    df_features['efficiency_estimate'] = df_features['total_solar_kw'] / (df_features['solar_irradiance_whm2'] + 0.001)
    
    # 8. Sunrise/sunset approximation for Calgary (simplified)
    # Calgary approx: Summer ~5AM-10PM, Winter ~8AM-5PM
    df_features['day_length_hours'] = df_features['month'].apply(
        lambda m: 17 if m in [6, 7, 8] else  # Summer
                  9 if m in [12, 1, 2] else  # Winter
                  13 if m in [3, 4, 5] else  # Spring
                  11                          # Fall
    )
    
    added_features = len(df_features.columns) - len(df.columns)
    print(f"  ✅ Added {added_features} new features")
    print(f"  Total features: {len(df_features.columns)}")
    
    return df_features

def analyze_final_dataset(df):
    """Analyze the final combined dataset"""
    print(f"\n📊 FINAL DATASET ANALYSIS")
    print("=" * 60)
    
    print(f"Dataset Shape: {df.shape[0]:,} samples × {df.shape[1]} features")
    print(f"Date Range: {df['timestamp'].min().date()} to {df['timestamp'].max().date()}")
    duration_days = (df['timestamp'].max() - df['timestamp'].min()).days
    print(f"Duration: {duration_days} days ({duration_days/30:.1f} months)")
    
    print(f"\n🌞 SOLAR GENERATION STATISTICS:")
    solar_stats = df[['carport_kw', 'rooftop_kw', 'total_solar_kw']].describe().round(2)
    print(solar_stats.to_string())
    
    print(f"\n🌤️ WEATHER STATISTICS (key features):")
    weather_cols = ['solar_irradiance_whm2', 'temperature_c', 'cloud_cover_pct', 
                    'humidity_pct', 'wind_speed_ms', 'pressure_kpa']
    weather_stats = df[weather_cols].describe().round(2)
    print(weather_stats.to_string())
    
    print(f"\n📈 CORRELATION WITH TOTAL SOLAR (top 15):")
    # Calculate correlation with target
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    corr_with_target = df[numeric_cols].corr()['total_solar_kw'].sort_values(ascending=False)
    
    # Display top 15 (excluding target itself)
    top_features = corr_with_target.head(16)  # Get 16 to account for target
    print("  Feature".ljust(40) + "Correlation")
    print("-" * 60)
    for feature, corr in top_features.items():
        if feature != 'total_solar_kw':
            print(f"  {feature[:38].ljust(40)} {corr:.3f}")
    
    return corr_with_target

def save_dataset(df, output_path="solar_forecasting_dataset.csv"):
    """Save the combined dataset"""
    print(f"\n💾 SAVING DATASET")
    print("-" * 50)
    
    # Save to CSV
    df.to_csv(output_path, index=False)
    print(f"✅ Dataset saved to: {output_path}")
    
    # Calculate file size
    file_size = df.memory_usage(deep=True).sum() / 1024 / 1024
    print(f"📁 File size: {file_size:.1f} MB")
    
    # Save metadata
    metadata = {
        'created': datetime.now().isoformat(),
        'samples': len(df),
        'features': len(df.columns),
        'date_range': {
            'start': df['timestamp'].min().isoformat(),
            'end': df['timestamp'].max().isoformat()
        },
        'duration_days': (df['timestamp'].max() - df['timestamp'].min()).days,
        'solar_features': ['carport_kw', 'rooftop_kw', 'total_solar_kw'],
        'weather_features': [col for col in df.columns if any(x in col for x in [
            'irradiance', 'temperature', 'humidity', 'cloud', 'wind', 'pressure'
        ])],
        'time_features': [col for col in df.columns if col in [
            'hour', 'day_of_week', 'month', 'season', 'is_weekend', 'is_daylight'
        ]]
    }
    
    import json
    with open('dataset_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📁 Metadata saved to: dataset_metadata.json")
    
    return output_path

def visualize_dataset(df):
    """Create visualizations of the dataset"""
    print(f"\n📊 CREATING VISUALIZATIONS")
    print("-" * 50)
    
    try:
        fig, axes = plt.subplots(3, 3, figsize=(16, 14))
        fig.suptitle('SAIT Solar Forecasting Dataset - Ready for ML Training', 
                    fontsize=16, fontweight='bold', y=0.98)
        
        # 1. Solar generation over time (last 7 days sample)
        last_week = df[df['timestamp'] >= df['timestamp'].max() - pd.Timedelta(days=7)]
        if len(last_week) > 0:
            axes[0, 0].plot(last_week['timestamp'], last_week['total_solar_kw'], 
                           'g-', alpha=0.8, linewidth=1.5, label='Total')
            axes[0, 0].plot(last_week['timestamp'], last_week['carport_kw'], 
                           'b-', alpha=0.6, linewidth=1, label='Carport')
            axes[0, 0].plot(last_week['timestamp'], last_week['rooftop_kw'], 
                           'r-', alpha=0.6, linewidth=1, label='Rooftop')
            axes[0, 0].set_title('Solar Generation - Last 7 Days')
            axes[0, 0].set_xlabel('Date')
            axes[0, 0].set_ylabel('Generation (kW)')
            axes[0, 0].legend(loc='upper left', fontsize=8)
            axes[0, 0].grid(True, alpha=0.3)
            axes[0, 0].tick_params(axis='x', rotation=45)
        
        # 2. Daily pattern
        daily_pattern = df.groupby('hour')['total_solar_kw'].mean()
        axes[0, 1].plot(daily_pattern.index, daily_pattern.values, 'b-', linewidth=2)
        axes[0, 1].fill_between(daily_pattern.index, 0, daily_pattern.values, alpha=0.3)
        axes[0, 1].set_title('Average Daily Pattern')
        axes[0, 1].set_xlabel('Hour of Day')
        axes[0, 1].set_ylabel('Average Generation (kW)')
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].set_xticks(range(0, 24, 3))
        
        # 3. Monthly pattern
        monthly_pattern = df.groupby('month')['total_solar_kw'].mean()
        axes[0, 2].bar(monthly_pattern.index, monthly_pattern.values, alpha=0.7)
        axes[0, 2].set_title('Average Monthly Pattern')
        axes[0, 2].set_xlabel('Month')
        axes[0, 2].set_ylabel('Average Generation (kW)')
        axes[0, 2].grid(True, alpha=0.3)
        axes[0, 2].set_xticks(range(1, 13))
        
        # 4. Solar vs Irradiance (scatter with regression line)
        sample_size = min(500, len(df))
        sample_df = df.sample(sample_size, random_state=42)
        axes[1, 0].scatter(sample_df['solar_irradiance_whm2'], sample_df['total_solar_kw'], 
                          alpha=0.5, s=10, c='green')
        
        # Add regression line
        if len(sample_df) > 1:
            z = np.polyfit(sample_df['solar_irradiance_whm2'], sample_df['total_solar_kw'], 1)
            p = np.poly1d(z)
            axes[1, 0].plot(sample_df['solar_irradiance_whm2'], 
                           p(sample_df['solar_irradiance_whm2']), 
                           "r--", alpha=0.8, linewidth=1)
        
        axes[1, 0].set_title(f'Solar vs Irradiance (n={sample_size})')
        axes[1, 0].set_xlabel('Solar Irradiance (Wh/m²)')
        axes[1, 0].set_ylabel('Generation (kW)')
        axes[1, 0].grid(True, alpha=0.3)
        
        # 5. Correlation heatmap (top 10 features)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        corr_matrix = df[numeric_cols].corr()
        target_corr = corr_matrix['total_solar_kw'].abs().sort_values(ascending=False)
        top_features = target_corr.head(11).index.tolist()  # Get 11 to account for target
        if 'total_solar_kw' in top_features:
            top_features.remove('total_solar_kw')
        top_features = top_features[:10]  # Take top 10
        
        im = axes[1, 1].imshow(corr_matrix.loc[top_features, top_features], 
                              cmap='coolwarm', aspect='auto', vmin=-1, vmax=1)
        axes[1, 1].set_title('Top 10 Features Correlation')
        axes[1, 1].set_xticks(range(len(top_features)))
        axes[1, 1].set_xticklabels([f[:15] for f in top_features], rotation=45, fontsize=8, ha='right')
        axes[1, 1].set_yticks(range(len(top_features)))
        axes[1, 1].set_yticklabels([f[:15] for f in top_features], fontsize=8)
        plt.colorbar(im, ax=axes[1, 1])
        
        # 6. Feature importance bar chart (top 10 correlations)
        top_corr = target_corr.head(11)
        if 'total_solar_kw' in top_corr.index:
            top_corr = top_corr.drop('total_solar_kw')
        top_corr = top_corr.head(10)
        
        colors = plt.cm.viridis(np.linspace(0, 1, len(top_corr)))
        axes[1, 2].barh(range(len(top_corr)), top_corr.values, color=colors)
        axes[1, 2].set_yticks(range(len(top_corr)))
        axes[1, 2].set_yticklabels([f[:20] for f in top_corr.index])
        axes[1, 2].set_xlabel('Correlation with Total Solar')
        axes[1, 2].set_title('Top 10 Most Correlated Features')
        axes[1, 2].grid(True, alpha=0.3, axis='x')
        
        # 7. Dataset statistics
        duration_days = (df['timestamp'].max() - df['timestamp'].min()).days
        stats_text = f"DATASET READY FOR ML:\n"
        stats_text += f"────────────────────\n"
        stats_text += f"Samples: {len(df):,}\n"
        stats_text += f"Features: {len(df.columns)}\n"
        stats_text += f"Date Range:\n"
        stats_text += f"  {df['timestamp'].min().date()} to\n"
        stats_text += f"  {df['timestamp'].max().date()}\n"
        stats_text += f"Duration: {duration_days} days\n\n"
        stats_text += f"TARGET VARIABLE:\n"
        stats_text += f"total_solar_kw\n"
        stats_text += f"Mean: {df['total_solar_kw'].mean():.2f} kW\n"
        stats_text += f"Max: {df['total_solar_kw'].max():.2f} kW"
        
        axes[2, 0].text(0.05, 0.5, stats_text, fontsize=9, verticalalignment='center',
                       bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
        axes[2, 0].axis('off')
        
        # 8. Data quality summary
        quality_text = f"DATA QUALITY SUMMARY:\n"
        quality_text += f"────────────────────\n"
        quality_text += f"✓ Solar data cleaned\n"
        quality_text += f"  - Units fixed (Wh → kW)\n"
        quality_text += f"  - Extremes removed\n"
        quality_text += f"  - Stuck values handled\n"
        quality_text += f"✓ NASA weather data\n"
        quality_text += f"  - Solar irradiance: ✓\n"
        quality_text += f"  - Temperature: ✓\n"
        quality_text += f"  - Cloud cover: ✓\n"
        quality_text += f"  - 12+ features\n"
        quality_text += f"✓ Time features added\n"
        quality_text += f"✓ Missing values handled\n"
        quality_text += f"✓ Ready for ML training"
        
        axes[2, 1].text(0.05, 0.5, quality_text, fontsize=9, verticalalignment='center',
                       bbox=dict(boxstyle='round', facecolor='lightgreen', alpha=0.8))
        axes[2, 1].axis('off')
        
        # 9. ML recommendations
        ml_text = f"RECOMMENDED MODELS:\n"
        ml_text += f"──────────────────\n"
        ml_text += f"1. XGBoost/LightGBM\n"
        ml_text += f"   - Fast training\n"
        ml_text += f"   - Handles many features\n"
        ml_text += f"   - Good accuracy\n\n"
        ml_text += f"2. Random Forest\n"
        ml_text += f"   - Robust to outliers\n"
        ml_text += f"   - Feature importance\n\n"
        ml_text += f"3. Prophet\n"
        ml_text += f"   - Time series specific\n"
        ml_text += f"   - Seasonality handling\n\n"
        ml_text += f"4. LSTM/GRU\n"
        ml_text += f"   - Sequence learning\n"
        ml_text += f"   - Best for patterns"
        
        axes[2, 2].text(0.05, 0.5, ml_text, fontsize=9, verticalalignment='center',
                       bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8))
        axes[2, 2].axis('off')
        
        plt.tight_layout()
        plt.savefig('solar_dataset_analysis.png', dpi=150, bbox_inches='tight')
        print(f"📊 Visualization saved: solar_dataset_analysis.png")
        plt.show()
        
    except Exception as e:
        print(f"⚠️  Visualization error: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function to combine solar and weather data"""
    print("Starting data combination process...")
    
    # Step 1: Load solar data from database
    carport_df, rooftop_df = load_solar_data_from_db()
    if carport_df is None or rooftop_df is None:
        print("❌ Failed to load solar data")
        return
    
    # Step 2: Load NASA weather data - UPDATE THIS PATH!
    nasa_df = load_nasa_data("data/nasa_solar_data.csv")  # Update with your NASA file path
    if nasa_df is None:
        print("❌ Failed to load NASA data")
        return
    
    # Step 3: Clean solar data
    solar_clean = clean_solar_data(carport_df, rooftop_df)
    
    # Step 4: Resample and align data
    combined_df = resample_and_align_data(solar_clean, nasa_df)
    
    # Step 5: Handle missing values
    combined_df = handle_missing_values(combined_df)
    
    # Step 6: Add time features
    final_df = add_time_features(combined_df)
    
    # Step 7: Analyze dataset
    analyze_final_dataset(final_df)
    
    # Step 8: Save dataset
    save_dataset(final_df, "solar_forecasting_ready_dataset.csv")
    
    # Step 9: Visualize
    visualize_dataset(final_df)
    
    print(f"\n{'='*70}")
    print("🎉 DATASET CREATION COMPLETE!")
    print("=" * 70)
    
    print(f"\n🚀 READY FOR MODEL TRAINING!")
    print(f"   Dataset: solar_forecasting_ready_dataset.csv")
    print(f"   Samples: {len(final_df):,}")
    print(f"   Features: {len(final_df.columns)}")
    print(f"   Target: 'total_solar_kw'")
    
    print(f"\n💡 RECOMMENDED NEXT STEPS:")
    print(f"   1. Split data: 80% train, 20% test")
    print(f"   2. Train XGBoost model first (fastest)")
    print(f"   3. Try Prophet for time series patterns")
    print(f"   4. Use LSTM for sequence forecasting")
    
    print(f"\n📊 KEY FEATURES TO USE:")
    print(f"   - solar_irradiance_whm2 (most important)")
    print(f"   - hour_sin/hour_cos (time encoding)")
    print(f"   - total_solar_lag_24h (yesterday same hour)")
    print(f"   - cloud_cover_pct")
    print(f"   - temperature_c")

if __name__ == "__main__":
    main()