# fetch_specific_tables.py - Fetch ONLY the electricity tables you need
print("⚡ FETCHING SPECIFIC ELECTRICITY TABLES")
print("=" * 70)

import pyodbc
import pandas as pd
import numpy as np
from datetime import datetime
import os

# Working connection string
CONNECTION_STRING = (
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=(localdb)\\MSSQLLocalDB;'
    'DATABASE=TestSlimDB;'
    'Trusted_Connection=yes;'
)

# Your specific tables (from your list)
ELECTRICITY_TABLES = {
    # Format: 'table_name': 'description'
    'SaitSolarLab_30000_TL212': 'GBT Appliances consumption',
    'SaitSolarLab_30000_TL341': 'GBT Consumption Hourly Wh',
    'SaitSolarLab_30000_TL337': 'GBT Consumption Wh',
    'SaitSolarLab_30000_TL211': 'GBT Equipment/ R&D consumption',
    'SaitSolarLab_30000_TL340': 'GBT Generation Hourly Wh',
    'SaitSolarLab_30000_TL336': 'GBT Generation Wh',
    'SaitSolarLab_30000_TL209': 'GBT Lighting consumption',
    'SaitSolarLab_30000_TL343': 'GBT Mains PA',
    'SaitSolarLab_30000_TL344': 'GBT Mains PB',
    'SaitSolarLab_30000_TL345': 'GBT Mains PC',
    'SaitSolarLab_30000_TL335': 'GBT Net Energy',
    'SaitSolarLab_30000_TL339': 'GBT Net Energy Hourly Wh',
    'SaitSolarLab_30000_TL338': 'GBT Net Energy Wh',
    'SaitSolarLab_30000_TL342': 'GBT Site Consumption',
    'SaitSolarLab_30000_TL208': 'GBT Space heating/cooling',
    'SaitSolarLab_30000_TL3': 'GBT Total Generation',
    'SaitSolarLab_30000_TL388': 'GBT Total Generation kWh',
    'SaitSolarLab_30000_TL4': 'GBT Ventilation consumption',
    'SaitSolarLab_30000_TL213': 'Panel2A-1_TotalUsage',
    'SaitSolarLab_30000_TL252': 'PV-CarportSolar_Total',
    'SaitSolarLab_30000_TL253': 'PV-RooftopSolar_Total'
}

def fetch_table_data(table_name, description, limit=50000):
    """Fetch data from a specific electricity table"""
    print(f"\n📥 Fetching: {table_name}")
    print(f"   Description: {description}")
    
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        
        # Query to get data
        query = f"""
        SELECT TOP ({limit}) 
            [ts] as timestamp,
            [value] as [{table_name.replace('SaitSolarLab_', '').replace('_', '')}]
        FROM [dbo].[{table_name}]
        WHERE [ts] IS NOT NULL
        ORDER BY [ts] ASC
        """
        
        df = pd.read_sql_query(query, conn, parse_dates=['timestamp'])
        conn.close()
        
        if len(df) > 0:
            print(f"   ✅ {len(df):,} records | Range: {df['timestamp'].min().date()} to {df['timestamp'].max().date()}")
            return df
        else:
            print(f"   ⚠️  No data found")
            return None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def combine_all_tables():
    """Fetch and combine data from all electricity tables"""
    print(f"🔍 Fetching {len(ELECTRICITY_TABLES)} electricity tables...")
    print("-" * 70)
    
    all_data = {}
    successful_tables = []
    
    for table_name, description in ELECTRICITY_TABLES.items():
        df = fetch_table_data(table_name, description, limit=20000)
        if df is not None and len(df) > 0:
            all_data[table_name] = df
            successful_tables.append(table_name)
    
    print(f"\n✅ Successfully fetched {len(successful_tables)}/{len(ELECTRICITY_TABLES)} tables")
    
    if not successful_tables:
        print("❌ No data fetched. Exiting...")
        return None
    
    # Find common date range
    print(f"\n📅 Finding common date range...")
    min_dates = []
    max_dates = []
    
    for table_name in successful_tables:
        df = all_data[table_name]
        min_dates.append(df['timestamp'].min())
        max_dates.append(df['timestamp'].max())
    
    common_start = max(min_dates)
    common_end = min(max_dates)
    
    print(f"   Common date range: {common_start} to {common_end}")
    print(f"   Duration: {(common_end - common_start).days} days")
    
    # Combine all data
    print(f"\n🔗 Combining data from {len(successful_tables)} tables...")
    
    # Start with first table as base
    base_table = successful_tables[0]
    combined_df = all_data[base_table].copy()
    
    # Merge other tables
    for i, table_name in enumerate(successful_tables[1:], 1):
        df = all_data[table_name]
        
        # Resample to consistent frequency (15 minutes)
        df_resampled = df.set_index('timestamp').resample('15T').mean().reset_index()
        
        if i == 1:
            combined_df = pd.merge(combined_df, df_resampled, on='timestamp', how='inner')
        else:
            combined_df = pd.merge(combined_df, df_resampled, on='timestamp', how='inner')
    
    print(f"   Combined shape: {combined_df.shape}")
    print(f"   Columns: {list(combined_df.columns)}")
    
    return combined_df

def create_training_dataset(df, output_file='data/electricity_combined.csv'):
    """Create final training dataset"""
    print(f"\n🎯 Creating training dataset...")
    
    if df is None or len(df) == 0:
        print("❌ No data to process")
        return None
    
    # Ensure consistent datetime index
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df.set_index('timestamp', inplace=True)
    
    # Sort by timestamp
    df = df.sort_index()
    
    # Handle missing values (forward fill for electricity data)
    df = df.ffill().bfill()
    
    # Add time-based features
    print("   Adding time features...")
    df['hour'] = df.index.hour
    df['day_of_week'] = df.index.dayofweek
    df['month'] = df.index.month
    df['day_of_year'] = df.index.dayofyear
    df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
    df['is_business_hour'] = ((df.index.hour >= 9) & (df.index.hour <= 17) & (df.index.dayofweek < 5)).astype(int)
    
    # Calculate total consumption if we have multiple meters
    consumption_columns = [col for col in df.columns if any(x in col.lower() for x in ['tl212', 'tl342', 'consumption', 'usage'])]
    if consumption_columns:
        print(f"   Found consumption columns: {consumption_columns}")
        df['total_consumption'] = df[consumption_columns].sum(axis=1)
    
    # Save to CSV
    print(f"   Saving to {output_file}...")
    os.makedirs('data', exist_ok=True)
    df.to_csv(output_file)
    
    print(f"✅ Training dataset created:")
    print(f"   Records: {len(df):,}")
    print(f"   Features: {len(df.columns)}")
    print(f"   Date range: {df.index.min()} to {df.index.max()}")
    print(f"   File size: {os.path.getsize(output_file) / 1024 / 1024:.2f} MB")
    
    return df

def analyze_dataset(df):
    """Analyze the combined dataset"""
    print(f"\n🔬 Dataset Analysis:")
    print("-" * 40)
    
    print(f"📊 Shape: {df.shape}")
    print(f"📅 Time range: {df.index.min()} to {df.index.max()}")
    print(f"⏱️  Frequency: {(df.index[1] - df.index[0])}")
    
    print(f"\n📈 Column statistics:")
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols[:10]:  # Show first 10 numeric columns
        if df[col].notna().any():
            print(f"   {col}: mean={df[col].mean():.2f}, min={df[col].min():.2f}, max={df[col].max():.2f}")
    
    if 'total_consumption' in df.columns:
        print(f"\n⚡ Total Consumption Analysis:")
        print(f"   Average: {df['total_consumption'].mean():.2f} kWh")
        print(f"   Peak: {df['total_consumption'].max():.2f} kWh")
        print(f"   Minimum: {df['total_consumption'].min():.2f} kWh")
        
        # Hourly pattern
        hourly_avg = df.groupby('hour')['total_consumption'].mean()
        peak_hour = hourly_avg.idxmax()
        print(f"   Peak hour: {peak_hour}:00 ({hourly_avg.max():.2f} kWh avg)")

def main():
    print(f"Starting electricity data collection...")
    print(f"Target tables: {len(ELECTRICITY_TABLES)}\n")
    
    # Fetch and combine data
    combined_df = combine_all_tables()
    
    if combined_df is not None:
        # Create training dataset
        training_df = create_training_dataset(combined_df)
        
        if training_df is not None:
            # Analyze the dataset
            analyze_dataset(training_df)
            
            # Create a smaller sample for quick testing
            sample_size = min(5000, len(training_df))
            sample_df = training_df.sample(sample_size, random_state=42).sort_index()
            sample_file = 'data/electricity_training_sample.csv'
            sample_df.to_csv(sample_file)
            print(f"\n💾 Training sample saved: {sample_file} ({sample_size} records)")
            
            print("\n" + "=" * 70)
            print("🎉 ELECTRICITY DATASET READY FOR TRAINING!")
            print(f"✅ Combined data from multiple sensors")
            print(f"✅ Ready for forecasting model training")
            print(f"✅ Main file: data/electricity_combined.csv")
            print(f"✅ Sample file: data/electricity_training_sample.csv")
            print("\n🎯 Next: Run the model training script!")
    
    else:
        print("\n❌ Failed to create dataset. Using single table data...")
        # Fallback to single table
        use_fallback()

def use_fallback():
    """Use data from a single table if combining fails"""
    print("Using data from SaitSolarLab_30000_TL342 (GBT Site Consumption)...")
    
    conn = pyodbc.connect(CONNECTION_STRING)
    query = """
    SELECT TOP (50000) 
        [ts] as timestamp,
        [value] as total_consumption
    FROM [dbo].[SaitSolarLab_30000_TL342]
    ORDER BY [ts] ASC
    """
    
    df = pd.read_sql_query(query, conn, parse_dates=['timestamp'])
    conn.close()
    
    if len(df) > 0:
        df.set_index('timestamp', inplace=True)
        df = df.sort_index()
        
        # Add features
        df['hour'] = df.index.hour
        df['day_of_week'] = df.index.dayofweek
        df['month'] = df.index.month
        df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
        
        # Save
        os.makedirs('data', exist_ok=True)
        df.to_csv('data/single_table_electricity.csv')
        
        print(f"✅ Single table dataset created:")
        print(f"   Records: {len(df):,}")
        print(f"   Saved: data/single_table_electricity.csv")

if __name__ == "__main__":
    main()