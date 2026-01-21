# analyze_tl212_fixed_with_cutoff.py
print("🔍 FIXED ANALYSIS WITH CUTOFF: TL212 - APPLIANCES CONSUMPTION")
print("=" * 70)

import pyodbc
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import os
import json

# Database connection
CONNECTION_STRING = (
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=(localdb)\\MSSQLLocalDB;'
    'DATABASE=TestSlimDB;'
    'Trusted_Connection=yes;'
)

TABLE_NAME = 'SaitSolarLab_30000_TL212'
COMPONENT_NAME = 'appliances_consumption'
CUTOFF_TIME = '2019-08-06 12:00:00'  # Cut off at this point

def create_output_directory():
    """Create organized output directory"""
    base_dir = f"data/analysis/{COMPONENT_NAME}"
    dirs = ['raw', 'processed', 'reports', 'plots', 'fixed']
    
    for dir_name in dirs:
        os.makedirs(os.path.join(base_dir, dir_name), exist_ok=True)
    
    return base_dir

def fetch_all_data_with_cutoff():
    """Fetch ALL data from the table and apply cutoff"""
    print("\n1. 📥 FETCHING ALL DATA FROM DATABASE (WITH CUTOFF)")
    print("-" * 50)
    
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM [dbo].[{TABLE_NAME}]"
        total_rows = pd.read_sql_query(count_query, conn).iloc[0,0]
        print(f"   Total records in database: {total_rows:,}")
        
        if total_rows == 0:
            print("   ❌ No data found")
            conn.close()
            return None
        
        # Fetch data up to cutoff time
        query = f"""
        SELECT 
            [ts] as timestamp,
            [value]
        FROM [dbo].[{TABLE_NAME}]
        WHERE [ts] <= '{CUTOFF_TIME}'
        ORDER BY [ts]
        """
        
        df = pd.read_sql_query(query, conn, parse_dates=['timestamp'])
        
        # Also get data after cutoff to see how much we're removing
        query_after = f"""
        SELECT 
            [ts] as timestamp,
            [value]
        FROM [dbo].[{TABLE_NAME}]
        WHERE [ts] > '{CUTOFF_TIME}'
        ORDER BY [ts]
        """
        df_after = pd.read_sql_query(query_after, conn, parse_dates=['timestamp'])
        
        conn.close()
        
        print(f"\n   ✅ Successfully fetched data up to {CUTOFF_TIME}")
        print(f"   Records before cutoff: {len(df):,}")
        print(f"   Records after cutoff (to be removed): {len(df_after):,}")
        print(f"   Percentage removed: {len(df_after)/total_rows*100:.1f}%")
        
        if len(df_after) > 0:
            # Analyze the stuck data
            print(f"\n   🔍 ANALYSIS OF REMOVED DATA (after {CUTOFF_TIME}):")
            print(f"      Date range: {df_after['timestamp'].min()} to {df_after['timestamp'].max()}")
            print(f"      Unique values: {df_after['value'].nunique():,}")
            print(f"      Most common value: {df_after['value'].mode().iloc[0] if len(df_after['value'].mode()) > 0 else 'N/A'}")
            
            # Check for consecutive identical values
            df_after = df_after.sort_values('timestamp')
            value_changes = df_after['value'].diff().abs()
            stuck_threshold = 0.0001
            stuck_count = (value_changes < stuck_threshold).sum()
            print(f"      Consecutive identical/similar values: {stuck_count:,} of {len(df_after):,}")
        
        return df
        
    except Exception as e:
        print(f"   ❌ Error fetching data: {e}")
        return None

def analyze_data_quality(df):
    """Comprehensive data quality analysis"""
    print("\n2. 🔬 DATA QUALITY ANALYSIS (CLEAN PORTION)")
    print("-" * 50)
    
    analysis = {
        'total_records': len(df),
        'date_range': {
            'min': df['timestamp'].min().isoformat(),
            'max': df['timestamp'].max().isoformat()
        },
        'duration_days': (df['timestamp'].max() - df['timestamp'].min()).days,
        'cutoff_applied': CUTOFF_TIME
    }
    
    # Ensure chronological order
    df = df.sort_values('timestamp').copy()
    
    # Remove any incomplete rows
    initial_count = len(df)
    df = df.dropna(subset=['timestamp', 'value'])
    removed_incomplete = initial_count - len(df)
    
    if removed_incomplete > 0:
        print(f"   Removed {removed_incomplete} incomplete rows")
    
    # Check for duplicate timestamps
    duplicate_timestamps = df['timestamp'].duplicated().sum()
    analysis['duplicate_timestamps'] = int(duplicate_timestamps)
    
    if duplicate_timestamps > 0:
        print(f"   ⚠️  Found {duplicate_timestamps:,} duplicate timestamps")
        # Keep first occurrence
        df = df.drop_duplicates(subset=['timestamp'], keep='first')
        print(f"   Removed duplicates. Remaining: {len(df):,} records")
    
    # Analyze frequency
    time_diffs = df['timestamp'].diff().dropna()
    if len(time_diffs) > 0:
        common_diff = time_diffs.mode()[0] if len(time_diffs.mode()) > 0 else time_diffs.median()
        analysis['common_interval_seconds'] = common_diff.total_seconds()
        analysis['common_interval'] = str(common_diff)
        
        print(f"   Most common interval: {common_diff}")
        print(f"   That's {common_diff.total_seconds():.0f}-second intervals")
    
    # Analyze values
    print(f"\n3. 📊 VALUE ANALYSIS")
    print("-" * 50)
    
    values = df['value']
    analysis['value_stats'] = {
        'min': float(values.min()),
        'max': float(values.max()),
        'mean': float(values.mean()),
        'median': float(values.median()),
        'std': float(values.std()),
        'unique_values': int(values.nunique())
    }
    
    print(f"   Min value: {values.min():.6f}")
    print(f"   Max value: {values.max():.6f}")
    print(f"   Mean: {values.mean():.6f}")
    print(f"   Std Dev: {values.std():.6f}")
    print(f"   Unique values: {values.nunique():,}")
    
    # Check for constant values (after cutoff, should be good)
    if values.std() < 0.001:
        print(f"   ⚠️  WARNING: Very low variance (std: {values.std():.6f})")
        analysis['low_variance'] = True
    else:
        analysis['low_variance'] = False
    
    # Check for zeros
    zero_count = (values == 0).sum()
    zero_pct = zero_count / len(values) * 100
    analysis['zero_values'] = {
        'count': int(zero_count),
        'percentage': float(zero_pct)
    }
    
    if zero_pct > 50:
        print(f"   ⚠️  WARNING: {zero_pct:.1f}% of values are zero")
    
    # Check for negatives (shouldn't exist for consumption)
    negative_count = (values < 0).sum()
    negative_pct = negative_count / len(values) * 100
    analysis['negative_values'] = {
        'count': int(negative_count),
        'percentage': float(negative_pct)
    }
    
    if negative_count > 0:
        print(f"   ⚠️  WARNING: {negative_count:,} negative values found ({negative_pct:.1f}%)")
    
    return df, analysis

def create_visualizations(df, output_dir):
    """Create diagnostic visualizations"""
    print("\n4. 📈 CREATING VISUALIZATIONS")
    print("-" * 50)
    
    # 1. Full time series (clean portion)
    plt.figure(figsize=(15, 8))
    
    if len(df) > 10000:
        # Downsample for plotting
        plot_df = df.iloc[::10]  # Take every 10th point
        title_suffix = f" (Downsampled from {len(df):,} records)"
    else:
        plot_df = df
        title_suffix = ""
    
    plt.plot(plot_df['timestamp'], plot_df['value'], alpha=0.7, linewidth=0.5)
    plt.title(f'TL212 - Appliances Consumption (Clean up to {CUTOFF_TIME}){title_suffix}')
    plt.xlabel('Timestamp')
    plt.ylabel('Consumption Value')
    plt.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    
    # Add cutoff line
    cutoff_date = pd.to_datetime(CUTOFF_TIME)
    plt.axvline(x=cutoff_date, color='red', linestyle='--', alpha=0.5, label=f'Cutoff: {CUTOFF_TIME}')
    plt.legend()
    
    plt.tight_layout()
    
    plot_file = os.path.join(output_dir, 'plots', 'clean_timeseries_with_cutoff.png')
    plt.savefig(plot_file, dpi=150)
    plt.close()
    print(f"   ✅ Created: clean_timeseries_with_cutoff.png")
    
    # 2. Last 30 days for detail
    if len(df) > 24:
        last_month = df[df['timestamp'] > df['timestamp'].max() - timedelta(days=30)]
        if len(last_month) > 0:
            plt.figure(figsize=(15, 6))
            plt.plot(last_month['timestamp'], last_month['value'], alpha=0.7, linewidth=1)
            plt.title(f'Last 30 Days - Clean Data (up to {CUTOFF_TIME})')
            plt.xlabel('Timestamp')
            plt.ylabel('Consumption Value')
            plt.grid(True, alpha=0.3)
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            plot_file = os.path.join(output_dir, 'plots', 'last_30_days_clean.png')
            plt.savefig(plot_file, dpi=150)
            plt.close()
            print(f"   ✅ Created: last_30_days_clean.png")
    
    # 3. Histogram of values
    plt.figure(figsize=(12, 6))
    plt.hist(df['value'].dropna(), bins=50, alpha=0.7, edgecolor='black')
    plt.title(f'Distribution of Clean Consumption Values (up to {CUTOFF_TIME})')
    plt.xlabel('Consumption Value')
    plt.ylabel('Frequency')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    
    plot_file = os.path.join(output_dir, 'plots', 'clean_value_distribution.png')
    plt.savefig(plot_file, dpi=150)
    plt.close()
    print(f"   ✅ Created: clean_value_distribution.png")

def prepare_training_data(df, analysis, output_dir):
    """Prepare clean data for training"""
    print("\n5. 🛠️ PREPARING TRAINING DATA")
    print("-" * 50)
    
    # Make a copy
    df_clean = df.copy()
    
    # 1. Ensure chronological order
    df_clean = df_clean.sort_values('timestamp')
    
    # 2. Add a final check for stuck data in the clean portion
    print("   Running final check for stuck patterns...")
    df_clean['value_diff'] = df_clean['value'].diff().abs()
    
    # Check last few values
    last_values = df_clean.tail(20)['value'].values
    last_diffs = np.abs(np.diff(last_values))
    
    # If last few values are very similar, we might have an issue
    if len(last_diffs) > 0 and np.mean(last_diffs) < 0.001:
        print(f"   ⚠️  Warning: Last {len(last_values)} values have low variation")
        print(f"   Last value: {last_values[-1]:.6f}")
        print(f"   Mean diff: {np.mean(last_diffs):.6f}")
    
    # 3. Determine optimal frequency for resampling
    common_seconds = analysis.get('common_interval_seconds', 60)
    
    if common_seconds <= 60:  # 1-minute or less
        target_freq = '15T'  # Resample to 15 minutes
        print(f"   High frequency data ({common_seconds}s) → Resampling to 15-minute intervals")
    elif common_seconds <= 300:  # 5-minute or less
        target_freq = '15T'  # Keep as 15 minutes
        print(f"   Medium frequency data ({common_seconds}s) → Using 15-minute intervals")
    else:
        target_freq = 'H'  # Resample to hourly
        print(f"   Low frequency data ({common_seconds}s) → Resampling to hourly intervals")
    
    # 4. Resample to consistent frequency
    print(f"   Resampling to {target_freq} intervals...")
    
    # Set timestamp as index for resampling
    df_clean.set_index('timestamp', inplace=True)
    
    # Resample and take mean
    df_resampled = df_clean['value'].resample(target_freq).mean().to_frame()
    
    # Fill small gaps (limit to 4 periods)
    df_resampled = df_resampled.interpolate(method='time', limit=4)
    
    # Drop any remaining NaNs
    df_resampled = df_resampled.dropna()
    
    print(f"   After resampling: {len(df_resampled):,} records")
    
    # 5. Add hour column for training
    df_resampled['hour'] = df_resampled.index.hour
    
    # 6. Save processed data
    processed_file = os.path.join(output_dir, 'processed', 'appliances_consumption_clean.csv')
    df_resampled.to_csv(processed_file)
    
    # Also save a fixed version without hour column for your training script
    fixed_file = os.path.join(output_dir, 'fixed', 'appliances_consumption_fixed.csv')
    df_resampled[['value']].to_csv(fixed_file)
    
    print(f"\n   💾 CLEAN DATA SAVED: {processed_file}")
    print(f"   💾 FIXED DATA SAVED: {fixed_file}")
    print(f"   📊 Records: {len(df_resampled):,}")
    print(f"   📅 Date range: {df_resampled.index.min()} to {df_resampled.index.max()}")
    print(f"   ⏱️  Frequency: {target_freq}")
    
    # Return both versions
    return df_resampled, target_freq

def save_analysis_report(analysis, output_dir):
    """Save comprehensive analysis report"""
    report_file = os.path.join(output_dir, 'reports', 'analysis_report.json')
    
    with open(report_file, 'w') as f:
        json.dump(analysis, f, indent=2, default=str)
    
    print(f"   📄 Analysis report saved: {report_file}")

def main():
    """Main execution function"""
    global output_dir
    print(f"Starting FIXED analysis for {TABLE_NAME} ({COMPONENT_NAME})")
    print(f"Cutoff time: {CUTOFF_TIME}")
    
    # Create output directory
    output_dir = create_output_directory()
    print(f"\n📁 Output directory: {output_dir}")
    
    # Step 1: Fetch all data WITH CUTOFF
    df_raw = fetch_all_data_with_cutoff()
    if df_raw is None or len(df_raw) == 0:
        print("❌ No data fetched. Exiting.")
        return
    
    # Save raw data
    raw_file = os.path.join(output_dir, 'raw', 'appliances_consumption_raw_cutoff.csv')
    df_raw.to_csv(raw_file, index=False)
    print(f"   💾 Raw data (with cutoff) saved: {raw_file}")
    
    # Step 2: Analyze data quality
    df_clean, analysis = analyze_data_quality(df_raw)
    
    # Step 3: Create visualizations
    create_visualizations(df_clean, output_dir)
    
    # Step 4: Prepare training data
    df_training, target_freq = prepare_training_data(df_clean, analysis, output_dir)
    
    # Step 5: Save analysis report
    save_analysis_report(analysis, output_dir)
    
    # Step 6: Training readiness check
    print("\n6. ✅ TRAINING READINESS CHECK")
    print("-" * 50)
    
    if analysis.get('low_variance', False):
        print(f"   ⚠️  LIMITED TRAINABILITY: Low variance in data")
        print(f"   Consider: Check sensor health, collect more data")
        trainable = True  # Still trainable but may not perform well
    elif len(df_training) < 100:
        print(f"   ❌ NOT TRAINABLE: Insufficient data ({len(df_training):,} records)")
        trainable = False
    else:
        print(f"   ✅ READY FOR TRAINING:")
        print(f"      - Clean records: {len(df_training):,}")
        print(f"      - Frequency: {target_freq}")
        print(f"      - Date range: {df_training.index.min().date()} to {df_training.index.max().date()}")
        print(f"      - Value variance: {analysis.get('value_stats', {}).get('std', 0):.6f}")
        trainable = True
    
    # Add to analysis
    analysis['trainable'] = trainable
    analysis['training_frequency'] = target_freq
    analysis['final_record_count'] = len(df_training)
    
    # Save updated report
    save_analysis_report(analysis, output_dir)
    
    print(f"\n{'='*70}")
    print("🎉 FIXED ANALYSIS WITH CUTOFF COMPLETE!")
    print("=" * 70)
    print(f"\n📊 SUMMARY:")
    print(f"   Component: {COMPONENT_NAME}")
    print(f"   Cutoff applied: {CUTOFF_TIME}")
    print(f"   Clean records: {len(df_training):,}")
    print(f"   Trainable: {'✅ YES' if trainable else '❌ NO'}")
    
    if trainable:
        print(f"\n🎯 NEXT STEPS:")
        print(f"   1. Copy the fixed file to your training location:")
        print(f"      cp {os.path.join(output_dir, 'fixed', 'appliances_consumption_fixed.csv')} data/processed/")
        print(f"   2. Run the improved training script:")
        print(f"      python train_tl212.py")
        print(f"\n⚠️  IMPORTANT NOTE:")
        print(f"   Data after {CUTOFF_TIME} has been removed because it contains stuck/repeating values.")
        print(f"   This should prevent training errors caused by constant or patterned data.")

if __name__ == "__main__":
    main()