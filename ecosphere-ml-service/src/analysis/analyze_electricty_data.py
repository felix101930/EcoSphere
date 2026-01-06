# analyze_electricity_data.py
print("🔍 COMPREHENSIVE ELECTRICITY DATA ANALYSIS")
print("=" * 70)

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Your sensor data
SENSORS = [
    {'id': 'TL212', 'name': 'GBT Appliances consumption', 'type': 'consumption'},
    {'id': 'TL341', 'name': 'GBT Consumption Hourly Wh', 'type': 'consumption'},
    {'id': 'TL337', 'name': 'GBT Consumption Wh', 'type': 'consumption'},
    {'id': 'TL211', 'name': 'GBT Equipment/ R&D consumption', 'type': 'consumption'},
    {'id': 'TL340', 'name': 'GBT Generation Hourly Wh', 'type': 'generation'},
    {'id': 'TL336', 'name': 'GBT Generation Wh', 'type': 'generation'},
    {'id': 'TL209', 'name': 'GBT Lighting consumption-TL', 'type': 'consumption'},
    {'id': 'TL343', 'name': 'GBT Mains PA', 'type': 'mains'},
    {'id': 'TL344', 'name': 'GBT Mains PB', 'type': 'mains'},
    {'id': 'TL345', 'name': 'GBT Mains PC', 'type': 'mains'},
    {'id': 'TL335', 'name': 'GBT Net Energy', 'type': 'net'},
    {'id': 'TL339', 'name': 'GBT Net Energy Hourly Wh', 'type': 'net'},
    {'id': 'TL338', 'name': 'GBT Net Energy Wh', 'type': 'net'},
    {'id': 'TL342', 'name': 'GBT Site Consumption', 'type': 'total'},
    {'id': 'TL208', 'name': 'GBT Space heating/cooling consumption-TL', 'type': 'consumption'},
    {'id': 'TL3', 'name': 'GBT Total Generation', 'type': 'generation'},
    {'id': 'TL388', 'name': 'GBT Total Generation kWh-TL', 'type': 'generation'},
    {'id': 'TL4', 'name': 'GBT Ventilation consumption', 'type': 'consumption'},
    {'id': 'TL213', 'name': 'Panel2A-1_TotalUsage', 'type': 'consumption'},
    {'id': 'TL252', 'name': 'PV-CarportSolar_Total', 'type': 'generation'},
    {'id': 'TL253', 'name': 'PV-RooftopSolar_Total', 'type': 'generation'}
]

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
    except ImportError:
        print("⚠️  pyodbc not installed. Using CSV files if available.")
        return None
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def load_sensor_data(sensor_id, sensor_name):
    """Load data for a specific sensor"""
    print(f"  📥 {sensor_id} - {sensor_name}...", end=" ")
    
    # Try to load from CSV first
    csv_file = f"data/raw/{sensor_id}_raw.csv"
    if os.path.exists(csv_file):
        df = pd.read_csv(csv_file, parse_dates=['timestamp'])
        print(f"✅ {len(df):,} records (CSV)")
        return df
    
    # Fall back to database
    conn = get_db_connection()
    if conn is None:
        print(f"❌ No data source")
        return None
    
    try:
        table_name = f"SaitSolarLab_30000_{sensor_id}"
        query = f"""
        SELECT TOP 100000 [ts] as timestamp, [value]
        FROM [dbo].[{table_name}]
        ORDER BY [ts]
        """
        
        df = pd.read_sql_query(query, conn, parse_dates=['timestamp'])
        conn.close()
        
        print(f"✅ {len(df):,} records (DB)")
        
        # Save to CSV for future use
        os.makedirs("data/raw", exist_ok=True)
        df.to_csv(csv_file, index=False)
        
        return df
        
    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}...")
        conn.close()
        return None

def detect_sensor_issues(df, sensor_id):
    """Detect if sensor has issues (stuck, dead, etc.)"""
    issues = []
    
    if df is None or len(df) == 0:
        issues.append("NO_DATA")
        return issues
    
    # 1. Check for flat values (sensor stuck)
    df = df.sort_values('timestamp')
    
    # Calculate rolling variance
    df['rolling_std_24h'] = df['value'].rolling(window=24, min_periods=1).std()
    
    # Check last week for stuck values
    if len(df) >= 168:  # At least 1 week of hourly data
        last_week_std = df['rolling_std_24h'].tail(168).mean()
        overall_std = df['value'].std()
        
        if last_week_std < (overall_std * 0.1):  # Less than 10% of normal variance
            issues.append("STUCK_SENSOR")
    
    # 2. Check for constant values
    unique_values = df['value'].nunique()
    if unique_values < 5 and len(df) > 100:
        issues.append("CONSTANT_VALUES")
    
    # 3. Check for too many zeros
    zero_pct = (df['value'] == 0).sum() / len(df) * 100
    if zero_pct > 50:
        issues.append("EXCESSIVE_ZEROS")
    
    # 4. Check for missing data gaps
    if len(df) > 1:
        df['time_diff'] = df['timestamp'].diff().dt.total_seconds() / 3600  # hours
        avg_gap = df['time_diff'].mean()
        if avg_gap > 24:  # Average gap > 24 hours
            issues.append("LARGE_GAPS")
    
    return issues

def analyze_sensor_quality(df, sensor_id, sensor_name):
    """Comprehensive sensor analysis"""
    print(f"\n📊 {sensor_id} - {sensor_name}")
    print("-" * 50)
    
    if df is None or len(df) == 0:
        print("   ❌ NO DATA")
        return None
    
    # Basic stats
    print(f"   Records: {len(df):,}")
    print(f"   Date range: {df['timestamp'].min().date()} to {df['timestamp'].max().date()}")
    print(f"   Duration: {(df['timestamp'].max() - df['timestamp'].min()).days} days")
    
    # Value statistics
    print(f"\n   Value Statistics:")
    print(f"      Mean: {df['value'].mean():.2f}")
    print(f"      Std:  {df['value'].std():.2f}")
    print(f"      Min:  {df['value'].min():.2f}")
    print(f"      Max:  {df['value'].max():.2f}")
    print(f"      Median: {df['value'].median():.2f}")
    
    # Check for negatives
    neg_mask = df['value'] < 0
    neg_count = neg_mask.sum()
    neg_pct = neg_count / len(df) * 100
    
    print(f"\n   Negative Values:")
    print(f"      Count: {neg_count:,} ({neg_pct:.1f}%)")
    if neg_count > 0:
        print(f"      Range: [{df.loc[neg_mask, 'value'].min():.2f}, {df.loc[neg_mask, 'value'].max():.2f}]")
    
    # Check for zeros
    zero_count = (df['value'] == 0).sum()
    zero_pct = zero_count / len(df) * 100
    print(f"      Zero values: {zero_count:,} ({zero_pct:.1f}%)")
    
    # Check missing data
    missing_pct = df['value'].isna().sum() / len(df) * 100
    print(f"      Missing values: {df['value'].isna().sum():,} ({missing_pct:.1f}%)")
    
    # Detect sensor issues
    issues = detect_sensor_issues(df, sensor_id)
    if issues:
        print(f"\n   ⚠️  SENSOR ISSUES DETECTED:")
        for issue in issues:
            print(f"      • {issue}")
    
    # Data quality score
    quality_score = 100
    if issues:
        quality_score -= len(issues) * 20
    if neg_pct > 10 and sensor_id not in ['TL335', 'TL338', 'TL339']:  # Net energy sensors can be negative
        quality_score -= 20
    if zero_pct > 30:
        quality_score -= 20
    if missing_pct > 20:
        quality_score -= 20
    
    print(f"\n   📈 DATA QUALITY SCORE: {quality_score}/100")
    
    return {
        'sensor_id': sensor_id,
        'sensor_name': sensor_name,
        'records': len(df),
        'date_min': df['timestamp'].min(),
        'date_max': df['timestamp'].max(),
        'mean': df['value'].mean(),
        'std': df['value'].std(),
        'min': df['value'].min(),
        'max': df['value'].max(),
        'neg_count': neg_count,
        'neg_pct': neg_pct,
        'zero_count': zero_count,
        'zero_pct': zero_pct,
        'issues': issues,
        'quality_score': quality_score
    }

def align_data_to_common_timeline(all_data):
    """Align all sensor data to common hourly timeline"""
    print(f"\n🔗 ALIGNING DATA TO COMMON TIMELINE")
    print("-" * 50)
    
    # Find common date range
    date_ranges = []
    for sensor_id, df in all_data.items():
        if df is not None and len(df) > 0:
            date_ranges.append({
                'sensor': sensor_id,
                'start': df['timestamp'].min(),
                'end': df['timestamp'].max()
            })
    
    if not date_ranges:
        print("❌ No valid data to align")
        return None
    
    # Find intersection
    common_start = max([r['start'] for r in date_ranges])
    common_end = min([r['end'] for r in date_ranges])
    
    print(f"Common timeframe: {common_start.date()} to {common_end.date()}")
    print(f"Duration: {(common_end - common_start).days} days")
    
    if common_start >= common_end:
        print("❌ No overlapping timeframe!")
        return None
    
    # Create hourly index
    hourly_index = pd.date_range(start=common_start, end=common_end, freq='H')
    
    # Align all sensors
    aligned_data = pd.DataFrame(index=hourly_index)
    
    for sensor_id, df in all_data.items():
        if df is not None and len(df) > 0:
            # Resample to hourly
            df_aligned = df.set_index('timestamp').resample('H').mean()
            
            # Align to common index
            aligned_data[sensor_id] = df_aligned.reindex(hourly_index)
    
    print(f"\nAligned data shape: {aligned_data.shape}")
    print(f"Coverage per sensor:")
    
    coverage_stats = []
    for sensor_id in aligned_data.columns:
        coverage = aligned_data[sensor_id].notna().mean() * 100
        coverage_stats.append((sensor_id, coverage))
    
    # Sort by coverage
    coverage_stats.sort(key=lambda x: x[1], reverse=True)
    
    for sensor_id, coverage in coverage_stats:
        status = "✅" if coverage > 80 else "⚠️" if coverage > 50 else "❌"
        print(f"  {status} {sensor_id}: {coverage:.1f}%")
    
    return aligned_data

def analyze_relationships(aligned_data):
    """Analyze correlations and relationships between sensors"""
    print(f"\n🔗 SENSOR RELATIONSHIPS & CORRELATIONS")
    print("=" * 70)
    
    if aligned_data is None or len(aligned_data.columns) < 2:
        print("❌ Not enough data for correlation analysis")
        return
    
    # Calculate correlations
    corr_matrix = aligned_data.corr()
    
    print("\n📈 TOP POSITIVE CORRELATIONS (>0.7):")
    high_pos_correlations = []
    
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            corr = corr_matrix.iloc[i, j]
            if corr > 0.7:
                sensor1 = corr_matrix.columns[i]
                sensor2 = corr_matrix.columns[j]
                high_pos_correlations.append((sensor1, sensor2, corr))
    
    high_pos_correlations.sort(key=lambda x: x[2], reverse=True)
    
    for sensor1, sensor2, corr in high_pos_correlations[:10]:
        print(f"  {sensor1} ↔ {sensor2}: {corr:.3f}")
    
    print("\n📉 TOP NEGATIVE CORRELATIONS (<-0.7):")
    high_neg_correlations = []
    
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            corr = corr_matrix.iloc[i, j]
            if corr < -0.7:
                sensor1 = corr_matrix.columns[i]
                sensor2 = corr_matrix.columns[j]
                high_neg_correlations.append((sensor1, sensor2, corr))
    
    high_neg_correlations.sort(key=lambda x: x[2])
    
    for sensor1, sensor2, corr in high_neg_correlations[:10]:
        print(f"  {sensor1} ↔ {sensor2}: {corr:.3f}")
    
    # Check mathematical relationships
    print(f"\n🔢 CHECKING MATHEMATICAL RELATIONSHIPS")
    print("-" * 50)
    
    # Check if mains add up to site consumption
    mains_sensors = ['TL343', 'TL344', 'TL345']  # PA, PB, PC
    if all(sensor in aligned_data.columns for sensor in mains_sensors):
        print("Checking mains (TL343+TL344+TL345) vs site consumption (TL342)...")
        
        # Sum of mains
        mains_sum = aligned_data[mains_sensors].sum(axis=1)
        site_consumption = aligned_data['TL342']
        
        # Compare
        valid_mask = mains_sum.notna() & site_consumption.notna()
        if valid_mask.sum() > 0:
            diff = (mains_sum - site_consumption).abs()
            avg_diff = diff.mean()
            max_diff = diff.max()
            
            print(f"  Average difference: {avg_diff:.2f}")
            print(f"  Maximum difference: {max_diff:.2f}")
            
            if avg_diff < 10:  # Less than 10 units average difference
                print("  ✅ Mains sum matches site consumption well")
            else:
                print("  ⚠️  Significant mismatch between mains sum and site consumption")
    
    # Check net energy relationship
    # Net Energy = Consumption - Generation
    print("\nChecking net energy relationship...")
    
    # Try different combinations
    consumption_sensors = [s for s in SENSORS if s['type'] == 'consumption']
    generation_sensors = [s for s in SENSORS if s['type'] == 'generation']
    
    print(f"  Found {len(consumption_sensors)} consumption sensors")
    print(f"  Found {len(generation_sensors)} generation sensors")
    
    return corr_matrix

def create_modeling_recommendations(sensor_stats, aligned_data):
    """Create recommendations for modeling"""
    print(f"\n🎯 MODELING RECOMMENDATIONS")
    print("=" * 70)
    
    # Filter sensors with good quality
    good_sensors = [s for s in sensor_stats if s['quality_score'] >= 70]
    poor_sensors = [s for s in sensor_stats if s['quality_score'] < 70]
    
    print(f"\n📊 SENSOR QUALITY SUMMARY:")
    print(f"  Good sensors (score ≥70): {len(good_sensors)}")
    print(f"  Poor sensors (score <70): {len(poor_sensors)}")
    
    print(f"\n✅ RECOMMENDED SENSORS FOR MODELING:")
    good_sensors.sort(key=lambda x: x['quality_score'], reverse=True)
    
    for sensor in good_sensors[:10]:  # Top 10
        print(f"  {sensor['sensor_id']} - {sensor['sensor_name']} (Score: {sensor['quality_score']}/100)")
    
    if poor_sensors:
        print(f"\n⚠️  SENSORS TO AVOID OR CLEAN:")
        for sensor in poor_sensors[:5]:  # Top 5 worst
            print(f"  {sensor['sensor_id']} - Issues: {', '.join(sensor['issues'])}")
    
    # Modeling strategy
    print(f"\n🚀 MODELING STRATEGY:")
    print("1. PRIMARY MODEL: Predict TL342 (Site Consumption)")
    print("2. Use these features:")
    print("   - Time features (hour, day, month, season)")
    print("   - Weather data (temperature, solar irradiance)")
    print("   - Lag features (24h, 168h)")
    print("   - Selected high-quality sensors as features")
    
    # Check for negative values in site consumption
    if 'TL342' in aligned_data.columns:
        tl342_negatives = (aligned_data['TL342'] < 0).sum()
        if tl342_negatives > 0:
            print(f"\n⚠️  CRITICAL ISSUE: TL342 (Site Consumption) has {tl342_negatives} negative values!")
            print("   This suggests data quality issues - site consumption should NEVER be negative.")
            print("   Recommendation: Clean TL342 data by removing negative values")
    
    # Check generation sensors
    generation_sensors = ['TL340', 'TL336', 'TL252', 'TL253', 'TL3', 'TL388']
    gen_data_exists = any(sensor in aligned_data.columns for sensor in generation_sensors)
    
    if gen_data_exists:
        print(f"\n🌞 GENERATION DATA AVAILABLE")
        print("   Consider building separate consumption and generation models")
        print("   OR a combined model with generation as a feature")
    
    return {
        'good_sensors': good_sensors,
        'poor_sensors': poor_sensors,
        'modeling_approach': 'Predict TL342 with time + weather + sensor features'
    }

def save_analysis_report(sensor_stats, aligned_data, recommendations):
    """Save analysis report"""
    print(f"\n💾 SAVING ANALYSIS REPORT")
    print("-" * 50)
    
    import json
    from datetime import datetime
    
    # Create report directory
    report_dir = "reports/electricity_analysis"
    os.makedirs(report_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save sensor statistics
    stats_df = pd.DataFrame(sensor_stats)
    stats_file = os.path.join(report_dir, f"sensor_stats_{timestamp}.csv")
    stats_df.to_csv(stats_file, index=False)
    print(f"✅ Sensor statistics: {stats_file}")
    
    # Save aligned data
    if aligned_data is not None:
        aligned_file = os.path.join(report_dir, f"aligned_data_{timestamp}.csv")
        aligned_data.to_csv(aligned_file)
        print(f"✅ Aligned data: {aligned_file}")
    
    # Save recommendations
    rec_file = os.path.join(report_dir, f"recommendations_{timestamp}.json")
    with open(rec_file, 'w') as f:
        json.dump(recommendations, f, indent=2, default=str)
    print(f"✅ Recommendations: {rec_file}")
    
    # Create summary report
    summary = f"""
    ELECTRICITY DATA ANALYSIS REPORT
    =================================
    Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    
    SUMMARY:
    - Total sensors analyzed: {len(sensor_stats)}
    - Good quality sensors: {len(recommendations['good_sensors'])}
    - Poor quality sensors: {len(recommendations['poor_sensors'])}
    - Common timeframe: {aligned_data.index.min().date() if aligned_data is not None else 'N/A'} to {aligned_data.index.max().date() if aligned_data is not None else 'N/A'}
    
    KEY FINDINGS:
    1. Site consumption (TL342) should be the target variable
    2. Check negative values in consumption sensors
    3. Use time-based features extensively
    
    NEXT STEPS:
    1. Clean negative values from consumption sensors
    2. Fill missing data using interpolation
    3. Build model for TL342 prediction
    4. Consider separate generation model if data quality is good
    """
    
    summary_file = os.path.join(report_dir, f"summary_{timestamp}.txt")
    with open(summary_file, 'w') as f:
        f.write(summary)
    
    print(f"✅ Summary report: {summary_file}")
    print(f"\n📁 All reports saved to: {report_dir}")

def main():
    """Main analysis function"""
    print(f"\n🔍 ANALYZING ALL ELECTRICITY SENSORS")
    print("=" * 70)
    
    all_data = {}
    sensor_stats = []
    
    # Load and analyze each sensor
    for sensor in SENSORS:
        df = load_sensor_data(sensor['id'], sensor['name'])
        all_data[sensor['id']] = df
        
        if df is not None and len(df) > 0:
            stats = analyze_sensor_quality(df, sensor['id'], sensor['name'])
            if stats:
                stats['type'] = sensor['type']
                sensor_stats.append(stats)
    
    print(f"\n{'='*70}")
    print(f"📊 ANALYSIS COMPLETE: {len(sensor_stats)} sensors analyzed")
    print("=" * 70)
    
    # Align data to common timeline
    aligned_data = align_data_to_common_timeline(all_data)
    
    # Analyze relationships
    if aligned_data is not None:
        corr_matrix = analyze_relationships(aligned_data)
    
    # Create recommendations
    recommendations = create_modeling_recommendations(sensor_stats, aligned_data)
    
    # Save reports
    save_analysis_report(sensor_stats, aligned_data, recommendations)
    
    print(f"\n🎉 ANALYSIS COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print("\n🔑 KEY INSIGHTS:")
    print("1. Check negative values in site consumption (TL342)")
    print("2. Identify which sensors are working properly")
    print("3. Use common timeframe for modeling")
    print("4. Start with simple model using TL342 as target")

if __name__ == "__main__":
    import os
    os.makedirs("data/raw", exist_ok=True)
    main()