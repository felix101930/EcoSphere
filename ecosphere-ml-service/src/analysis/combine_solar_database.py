"""
Solar Data Consolidation Script
Purpose: Combine rooftop and carport solar data from SAIT database
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def get_db_connection():
    """Establish database connection"""
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

def load_and_combine_solar_data():
    """Load and combine rooftop and carport solar data"""
    print("🌞 LOADING AND COMBINING SOLAR DATA")
    print("=" * 50)
    
    conn = get_db_connection()
    if conn is None:
        return None
    
    try:
        # Define common timeframe
        start_time = '2019-03-08 19:40:00'
        end_time = '2020-11-08 03:54:00'
        
        # Load Carport Solar (TL252)
        print("\n📊 Loading Carport Solar (TL252)...")
        query_carport = f"""
        SELECT 
            [ts] as timestamp,
            [value] as carport_value
        FROM [dbo].[SaitSolarLab_30000_TL252]
        WHERE [ts] >= '{start_time}' 
          AND [ts] <= '{end_time}'
          AND [value] IS NOT NULL
        ORDER BY [ts]
        """
        carport_df = pd.read_sql_query(query_carport, conn, parse_dates=['timestamp'])
        print(f"   ✅ Loaded {len(carport_df):,} carport records")
        
        # Load Rooftop Solar (TL253)
        print("📊 Loading Rooftop Solar (TL253)...")
        query_rooftop = f"""
        SELECT 
            [ts] as timestamp,
            [value] as rooftop_value
        FROM [dbo].[SaitSolarLab_30000_TL253]
        WHERE [ts] >= '{start_time}' 
          AND [ts] <= '{end_time}'
          AND [value] IS NOT NULL
        ORDER BY [ts]
        """
        rooftop_df = pd.read_sql_query(query_rooftop, conn, parse_dates=['timestamp'])
        print(f"   ✅ Loaded {len(rooftop_df):,} rooftop records")
        
        conn.close()
        
        # Return both dataframes
        return carport_df, rooftop_df
        
    except Exception as e:
        print(f"❌ Error loading solar data: {e}")
        if conn:
            conn.close()
        return None, None

def clean_and_merge_solar(carport_df, rooftop_df):
    """Clean and merge solar datasets"""
    print(f"\n🧹 CLEANING AND MERGING SOLAR DATA")
    print("-" * 50)
    
    if carport_df is None or rooftop_df is None:
        print("❌ Cannot proceed - missing solar data")
        return None
    
    # 1. Merge datasets on timestamp (outer join to keep all data)
    print("   Merging carport and rooftop data...")
    solar_df = pd.merge(carport_df, rooftop_df, on='timestamp', how='outer')
    print(f"   Combined records: {len(solar_df):,}")
    
    # 2. Sort by timestamp
    solar_df = solar_df.sort_values('timestamp').reset_index(drop=True)
    
    # 3. Convert units (Wh to kW)
    print("   Converting units (Wh → kW)...")
    solar_df['carport_kw'] = solar_df['carport_value'] / 1000
    solar_df['rooftop_kw'] = solar_df['rooftop_value'] / 1000
    
    # 4. Basic quality checks
    print("   Performing quality checks...")
    
    # Check for missing values
    missing_carport = solar_df['carport_kw'].isna().sum()
    missing_rooftop = solar_df['rooftop_kw'].isna().sum()
    print(f"   Missing carport values: {missing_carport:,}")
    print(f"   Missing rooftop values: {missing_rooftop:,}")
    
    # Remove unrealistic values
    before_clean = len(solar_df)
    solar_df = solar_df[(solar_df['carport_kw'] <= 100) & (solar_df['carport_kw'] >= 0)]
    solar_df = solar_df[(solar_df['rooftop_kw'] <= 50) & (solar_df['rooftop_kw'] >= 0)]
    after_clean = len(solar_df)
    print(f"   Removed {before_clean - after_clean} unrealistic records")
    
    # 5. Calculate total solar generation
    solar_df['total_solar_kw'] = solar_df['carport_kw'] + solar_df['rooftop_kw']
    
    # 6. Handle negative values during daytime (6AM-6PM)
    solar_df['hour'] = solar_df['timestamp'].dt.hour
    daytime_mask = (solar_df['hour'] >= 6) & (solar_df['hour'] <= 18)
    
    # Set negative values to 0 during daytime
    negative_carport = ((solar_df['carport_kw'] < 0) & daytime_mask).sum()
    negative_rooftop = ((solar_df['rooftop_kw'] < 0) & daytime_mask).sum()
    
    solar_df.loc[daytime_mask & (solar_df['carport_kw'] < 0), 'carport_kw'] = 0
    solar_df.loc[daytime_mask & (solar_df['rooftop_kw'] < 0), 'rooftop_kw'] = 0
    solar_df.loc[solar_df['total_solar_kw'] < 0, 'total_solar_kw'] = 0
    
    print(f"   Fixed {negative_carport} negative carport values during daytime")
    print(f"   Fixed {negative_rooftop} negative rooftop values during daytime")
    
    # 7. Select final columns
    final_cols = ['timestamp', 'carport_kw', 'rooftop_kw', 'total_solar_kw', 'hour']
    solar_clean = solar_df[final_cols].copy()
    
    # 8. Summary statistics
    print(f"\n📊 CLEANED DATA SUMMARY:")
    print(f"   Total records: {len(solar_clean):,}")
    print(f"   Date range: {solar_clean['timestamp'].min()} to {solar_clean['timestamp'].max()}")
    print(f"   Average total generation: {solar_clean['total_solar_kw'].mean():.2f} kW")
    print(f"   Max total generation: {solar_clean['total_solar_kw'].max():.2f} kW")
    print(f"   Carport average: {solar_clean['carport_kw'].mean():.2f} kW")
    print(f"   Rooftop average: {solar_clean['rooftop_kw'].mean():.2f} kW")
    
    return solar_clean

def resample_to_hourly(solar_df):
    """Resample solar data to hourly frequency"""
    print(f"\n⏱️ RESAMPLING TO HOURLY FREQUENCY")
    print("-" * 50)
    
    if solar_df is None:
        return None
    
    # Set timestamp as index
    solar_indexed = solar_df.set_index('timestamp')
    
    # Resample to hourly, taking the mean
    print("   Resampling to hourly (mean)...")
    solar_hourly = solar_indexed.resample('H').mean().reset_index()
    
    # Fill any missing hours with linear interpolation
    print("   Handling missing hours...")
    solar_hourly[['carport_kw', 'rooftop_kw', 'total_solar_kw']] = solar_hourly[
        ['carport_kw', 'rooftop_kw', 'total_solar_kw']
    ].interpolate(method='linear', limit=3)
    
    print(f"   Raw records: {len(solar_df):,}")
    print(f"   Hourly records: {len(solar_hourly):,}")
    print(f"   Coverage: {len(solar_hourly)/24:.1f} days")
    
    # Add hour column back
    solar_hourly['hour'] = solar_hourly['timestamp'].dt.hour
    
    return solar_hourly

def save_solar_dataset(solar_df, filename="solar_combined_dataset.csv"):
    """Save the combined solar dataset"""
    print(f"\n💾 SAVING COMBINED SOLAR DATASET")
    print("-" * 50)
    
    if solar_df is None:
        print("❌ No data to save")
        return None
    
    # Save to CSV
    solar_df.to_csv(filename, index=False)
    print(f"✅ Dataset saved to: {filename}")
    
    # Calculate file size
    file_size = solar_df.memory_usage(deep=True).sum() / 1024 / 1024
    print(f"📁 File size: {file_size:.1f} MB")
    print(f"📊 Data shape: {solar_df.shape[0]:,} rows × {solar_df.shape[1]} columns")
    
    # Create simple metadata
    metadata = {
        'created': datetime.now().isoformat(),
        'samples': len(solar_df),
        'date_range': {
            'start': solar_df['timestamp'].min().isoformat(),
            'end': solar_df['timestamp'].max().isoformat()
        },
        'duration_days': (solar_df['timestamp'].max() - solar_df['timestamp'].min()).days,
        'features': ['timestamp', 'carport_kw', 'rooftop_kw', 'total_solar_kw', 'hour'],
        'description': 'Combined SAIT carport and rooftop solar generation data'
    }
    
    import json
    with open('solar_dataset_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"📁 Metadata saved to: solar_dataset_metadata.json")
    
    return filename

def analyze_solar_dataset(solar_df):
    """Analyze the solar dataset"""
    print(f"\n📊 SOLAR DATASET ANALYSIS")
    print("=" * 60)
    
    if solar_df is None:
        return
    
    print(f"Dataset Statistics:")
    print(f"  Total records: {len(solar_df):,}")
    print(f"  Date range: {solar_df['timestamp'].min().date()} to {solar_df['timestamp'].max().date()}")
    duration_days = (solar_df['timestamp'].max() - solar_df['timestamp'].min()).days
    print(f"  Duration: {duration_days} days ({duration_days/30:.1f} months)")
    
    print(f"\nGeneration Statistics (kW):")
    stats = solar_df[['carport_kw', 'rooftop_kw', 'total_solar_kw']].describe().round(3)
    print(stats.to_string())
    
    print(f"\nData Quality:")
    print(f"  Missing carport values: {solar_df['carport_kw'].isna().sum()}")
    print(f"  Missing rooftop values: {solar_df['rooftop_kw'].isna().sum()}")
    print(f"  Zero generation hours: {(solar_df['total_solar_kw'] == 0).sum()} "
          f"({(solar_df['total_solar_kw'] == 0).sum()/len(solar_df)*100:.1f}%)")
    
    # Daily pattern analysis
    if 'hour' in solar_df.columns:
        daily_pattern = solar_df.groupby('hour')['total_solar_kw'].mean()
        peak_hour = daily_pattern.idxmax()
        peak_value = daily_pattern.max()
        print(f"\nDaily Generation Pattern:")
        print(f"  Peak generation hour: {peak_hour}:00 ({peak_value:.2f} kW)")
        print(f"  Generation hours (6AM-6PM avg): {solar_df[solar_df['hour'].between(6, 18)]['total_solar_kw'].mean():.2f} kW")

def main():
    """Main function to combine solar data"""
    print("\n" + "="*70)
    print("SAIT SOLAR DATA COMBINATION TOOL")
    print("="*70)
    
    # Step 1: Load data from database
    carport_df, rooftop_df = load_and_combine_solar_data()
    
    if carport_df is None or rooftop_df is None:
        print("❌ Failed to load solar data from database")
        return
    
    # Step 2: Clean and merge
    solar_merged = clean_and_merge_solar(carport_df, rooftop_df)
    
    if solar_merged is None:
        print("❌ Failed to clean and merge solar data")
        return
    
    # Step 3: Resample to hourly
    solar_hourly = resample_to_hourly(solar_merged)
    
    if solar_hourly is None:
        print("❌ Failed to resample solar data")
        return
    
    # Step 4: Analyze the dataset
    analyze_solar_dataset(solar_hourly)
    
    # Step 5: Save the dataset
    save_solar_dataset(solar_hourly, "sait_solar_combined_hourly.csv")
    
    print(f"\n{'='*70}")
    print("🎉 SOLAR DATA COMBINATION COMPLETE!")
    print("="*70)
    
    print(f"\n📋 NEXT STEPS:")
    print(f"   1. Dataset ready: sait_solar_combined_hourly.csv")
    print(f"   2. Next, combine with weather data (NASA or OpenWeather)")
    print(f"   3. Add time features (season, day_of_week, etc.)")
    print(f"   4. Train your solar forecasting model")

if __name__ == "__main__":
    main()