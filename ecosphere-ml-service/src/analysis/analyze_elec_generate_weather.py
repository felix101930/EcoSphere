# analyze_solar_data_for_weather_FIXED.py
print("🔍 SOLAR DATA ANALYSIS FOR WEATHER INTEGRATION")
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
    except ImportError:
        print("❌ pyodbc not installed. Please install: pip install pyodbc")
        return None
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None

def fetch_solar_data(sensor_table):
    """Fetch solar generation data from database"""
    print(f"  📥 Fetching {sensor_table}...", end=" ")
    
    conn = get_db_connection()
    if conn is None:
        return None
    
    try:
        query = f"""
        SELECT 
            [ts] as timestamp,
            [value] as generation_kw
        FROM [dbo].[{sensor_table}]
        WHERE [ts] IS NOT NULL 
          AND [value] IS NOT NULL
        ORDER BY [ts]
        """
        
        df = pd.read_sql_query(query, conn, parse_dates=['timestamp'])
        conn.close()
        
        print(f"✅ {len(df):,} records")
        return df
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)[:50]}...")
        if conn:
            conn.close()
        return None

def analyze_sensor_timeline(df, sensor_name):
    """Analyze sensor timeline and data quality"""
    print(f"\n📊 TIMELINE ANALYSIS: {sensor_name}")
    print("-" * 50)
    
    if df is None or len(df) == 0:
        print("  ❌ No data available")
        return None
    
    # Basic stats
    print(f"  📅 Date Range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"  ⏱️  Duration: {(df['timestamp'].max() - df['timestamp'].min()).days} days")
    print(f"  🔢 Total Records: {len(df):,}")
    
    # Check sampling frequency
    time_diff = df['timestamp'].diff().dropna()
    avg_interval = time_diff.mean()
    print(f"  📈 Avg Interval: {avg_interval}")
    
    # Data quality
    missing_count = df['generation_kw'].isna().sum()
    print(f"  ❓ Missing Values: {missing_count} ({missing_count/len(df)*100:.1f}%)")
    
    # Detect stuck values
    print(f"\n  🔍 STUCK VALUE DETECTION:")
    
    # Check for consecutive identical values
    df['value_diff'] = df['generation_kw'].diff().abs()
    
    # Find sequences of identical values
    identical_mask = df['value_diff'] == 0
    consecutive_counts = identical_mask.groupby((~identical_mask).cumsum()).cumsum() + 1
    
    # Report problematic sequences
    problematic = consecutive_counts[consecutive_counts > 10]  # More than 10 identical readings
    if len(problematic) > 0:
        print(f"    ⚠️  Found {len(problematic[problematic > 10])} stuck sequences (>10 identical values)")
        
        # Find longest stuck sequence
        max_stuck = consecutive_counts.max()
        if max_stuck > 10:
            stuck_start_idx = consecutive_counts.idxmax() - max_stuck + 1
            stuck_value = df.loc[stuck_start_idx, 'generation_kw']
            stuck_time = df.loc[stuck_start_idx, 'timestamp']
            print(f"    ⚠️  Longest stuck: {max_stuck} values of {stuck_value:.2f} kW starting at {stuck_time}")
    else:
        print(f"    ✅ No stuck values detected")
    
    # Check for zeros/night patterns (normal for solar)
    night_mask = (df['timestamp'].dt.hour < 6) | (df['timestamp'].dt.hour > 18)
    night_zeros = ((df['generation_kw'] <= 0) & night_mask).sum()
    day_zeros = ((df['generation_kw'] <= 0) & ~night_mask).sum()
    
    print(f"\n  🌙 Night values (6PM-6AM):")
    print(f"    Zero/negative: {night_zeros:,} ({night_zeros/len(df[night_mask])*100:.1f}% of night)")
    print(f"\n  ☀️  Day values (6AM-6PM):")
    print(f"    Zero/negative: {day_zeros:,} ({day_zeros/len(df[~night_mask])*100:.1f}% of day)")
    
    # Value distribution - CAREFUL WITH EXTREME VALUES!
    print(f"\n  📊 Value Distribution:")
    print(f"    Min: {df['generation_kw'].min():.2f} kW")
    print(f"    Max: {df['generation_kw'].max():.2f} kW")
    print(f"    Mean: {df['generation_kw'].mean():.2f} kW")
    print(f"    Std: {df['generation_kw'].std():.2f} kW")
    
    # Check for extreme values (15,391 kW is unrealistic for solar!)
    extreme_mask = df['generation_kw'] > 1000  # Anything > 1000kW is suspicious
    if extreme_mask.sum() > 0:
        print(f"    ⚠️  WARNING: {extreme_mask.sum()} records > 1000 kW (max: {df['generation_kw'].max():.2f} kW)")
        print(f"    ⚠️  This suggests data quality issues or unit problems")
    
    # Percentiles (more representative than min/max)
    percentiles = df['generation_kw'].quantile([0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99])
    print(f"    P1: {percentiles[0.01]:.2f} kW, P99: {percentiles[0.99]:.2f} kW")
    
    return {
        'start_date': df['timestamp'].min(),
        'end_date': df['timestamp'].max(),
        'total_records': len(df),
        'has_stuck': len(problematic[problematic > 10]) > 0,
        'coverage_days': (df['timestamp'].max() - df['timestamp'].min()).days,
        'extreme_values': extreme_mask.sum()
    }

def find_optimal_overlap(carport_data, rooftop_data):
    """Find optimal overlapping period for combined analysis"""
    print(f"\n🤝 FINDING OPTIMAL OVERLAP PERIOD")
    print("-" * 50)
    
    if carport_data is None or rooftop_data is None:
        print("❌ Missing one or both datasets")
        return None
    
    # Find common timeframe
    common_start = max(carport_data['timestamp'].min(), rooftop_data['timestamp'].min())
    common_end = min(carport_data['timestamp'].max(), rooftop_data['timestamp'].max())
    
    print(f"  Carport: {carport_data['timestamp'].min()} to {carport_data['timestamp'].max()}")
    print(f"  Rooftop: {rooftop_data['timestamp'].min()} to {rooftop_data['timestamp'].max()}")
    print(f"  Common:  {common_start} to {common_end}")
    
    overlap_days = (common_end - common_start).days
    print(f"  📅 Overlap Duration: {overlap_days} days")
    
    if overlap_days <= 0:
        print("❌ No overlapping period found!")
        return None
    
    # Filter to common period
    carport_overlap = carport_data[(carport_data['timestamp'] >= common_start) & 
                                   (carport_data['timestamp'] <= common_end)].copy()
    rooftop_overlap = rooftop_data[(rooftop_data['timestamp'] >= common_start) & 
                                   (rooftop_data['timestamp'] <= common_end)].copy()
    
    print(f"\n  📊 Overlap Statistics:")
    print(f"    Carport records: {len(carport_overlap):,}")
    print(f"    Rooftop records: {len(rooftop_overlap):,}")
    
    # Resample to ensure alignment
    carport_overlap.set_index('timestamp', inplace=True)
    rooftop_overlap.set_index('timestamp', inplace=True)
    
    # Resample to hourly (if needed)
    carport_hourly = carport_overlap.resample('H').mean()
    rooftop_hourly = rooftop_overlap.resample('H').mean()
    
    # Merge aligned data
    aligned_data = pd.DataFrame({
        'carport_kw': carport_hourly['generation_kw'],
        'rooftop_kw': rooftop_hourly['generation_kw']
    }).dropna()
    
    print(f"    Aligned hourly records: {len(aligned_data):,}")
    
    # Calculate correlation
    correlation = aligned_data['carport_kw'].corr(aligned_data['rooftop_kw'])
    print(f"    Correlation: {correlation:.3f}")
    
    # Analyze daily patterns
    aligned_data['hour'] = aligned_data.index.hour
    aligned_data['month'] = aligned_data.index.month
    
    print(f"\n  📈 DAILY PATTERNS (for weather alignment):")
    
    # Find typical generation hours
    daytime_mask = (aligned_data.index.hour >= 6) & (aligned_data.index.hour <= 18)
    daytime_data = aligned_data[daytime_mask]
    
    if len(daytime_data) > 0:
        avg_carport_day = daytime_data['carport_kw'].mean()
        avg_rooftop_day = daytime_data['rooftop_kw'].mean()
        print(f"    Avg daytime generation (6AM-6PM):")
        print(f"      Carport: {avg_carport_day:.2f} kW")
        print(f"      Rooftop: {avg_rooftop_day:.2f} kW")
    
    # Check data quality - REMOVE EXTREME VALUES FIRST
    print(f"\n  🧹 DATA CLEANING NEEDED:")
    
    # Check for extreme values (15,391 kW is unrealistic!)
    extreme_carport = (aligned_data['carport_kw'] > 1000).sum()
    extreme_rooftop = (aligned_data['rooftop_kw'] > 1000).sum()
    
    if extreme_carport > 0:
        print(f"    ⚠️  Carport: {extreme_carport} records > 1000 kW (max: {aligned_data['carport_kw'].max():.2f} kW)")
        print(f"    ⚠️  Likely data quality issue - values too high for solar")
    
    if extreme_rooftop > 0:
        print(f"    ⚠️  Rooftop: {extreme_rooftop} records > 1000 kW")
    
    # Find best continuous period (min 30 days with good data)
    print(f"\n  🎯 RECOMMENDED WEATHER DATA PERIOD:")
    
    # First, clean the data by removing extreme values
    aligned_data_clean = aligned_data.copy()
    
    # Apply reasonable limits (typical solar array: 0-200 kW for carport, 0-100 kW for rooftop)
    # Based on your data: Carport avg 4,260 kW is WAY too high - probably Wh not kW!
    # Let's assume the unit is actually Wh, not kW
    aligned_data_clean['carport_kw'] = aligned_data_clean['carport_kw'] / 1000  # Convert to kW if it's Wh
    aligned_data_clean['rooftop_kw'] = aligned_data_clean['rooftop_kw'] / 1000  # Convert to kW if it's Wh
    
    print(f"    🔧 Assuming data is in Wh, converting to kW (divide by 1000)")
    print(f"    Carport after conversion: {aligned_data_clean['carport_kw'].mean():.2f} kW avg")
    print(f"    Rooftop after conversion: {aligned_data_clean['rooftop_kw'].mean():.2f} kW avg")
    
    # Now find continuous period
    aligned_data_clean['date'] = aligned_data_clean.index.date
    daily_presence = aligned_data_clean.groupby('date').size()
    
    # Convert to DataFrame for easier handling
    daily_df = pd.DataFrame({
        'date': pd.to_datetime(daily_presence.index),
        'count': daily_presence.values
    })
    
    # Sort by date
    daily_df = daily_df.sort_values('date')
    
    # Find gaps
    daily_df['date_diff'] = daily_df['date'].diff().dt.days
    daily_df['gap'] = daily_df['date_diff'] > 1
    daily_df['group'] = daily_df['gap'].cumsum()
    
    # Find largest continuous group
    continuous_groups = daily_df.groupby('group').agg({
        'date': ['min', 'max', 'count']
    })
    
    if len(continuous_groups) > 0:
        # Get the group with most days
        largest_group_idx = continuous_groups[('date', 'count')].idxmax()
        largest_group = continuous_groups.loc[largest_group_idx]
        
        rec_start = largest_group[('date', 'min')]
        rec_end = largest_group[('date', 'max')]
        rec_days = largest_group[('date', 'count')]
        
        print(f"    📅 Period: {rec_start.date()} to {rec_end.date()}")
        print(f"    ⏱️  Duration: {rec_days} days")
        print(f"    📊 Expected hours: {rec_days * 24:,} hours")
        
        # Check data quality in this period
        period_mask = (aligned_data_clean.index.date >= rec_start.date()) & \
                     (aligned_data_clean.index.date <= rec_end.date())
        period_data = aligned_data_clean[period_mask]
        
        coverage_pct = len(period_data) / (rec_days * 24) * 100
        print(f"    📈 Coverage: {coverage_pct:.1f}% of hours")
        
        # Calculate season based on middle of period
        middle_date = rec_start + (rec_end - rec_start) / 2
        month = middle_date.month
        if month in [12, 1, 2]:
            season = "Winter"
        elif month in [3, 4, 5]:
            season = "Spring"
        elif month in [6, 7, 8]:
            season = "Summer"
        else:
            season = "Fall"
        
        print(f"    🌤️  Season: {season}")
        
        # Important note about data quality
        print(f"\n    ⚠️  IMPORTANT DATA QUALITY NOTES:")
        print(f"    1. Carport data has extreme values (up to 15,391 'kW')")
        print(f"    2. Likely the unit is Wh, not kW (divide by 1000)")
        print(f"    3. Carport has stuck values (16 identical readings)")
        print(f"    4. Negative values at night are normal for solar")
        
        return {
            'start_date': rec_start,
            'end_date': rec_end,
            'duration_days': rec_days,
            'total_hours': rec_days * 24,
            'season': season,
            'aligned_data': aligned_data_clean,
            'correlation': correlation,
            'data_quality_notes': [
                "Unit appears to be Wh, not kW (divide by 1000)",
                "Carport has extreme high values",
                "Carport has stuck values",
                "Rooftop data looks cleaner"
            ]
        }
    
    return None

def generate_weather_data_requirements(overlap_info):
    """Generate specific requirements for weather data"""
    print(f"\n🌤️  WEATHER DATA REQUIREMENTS")
    print("=" * 50)
    
    if overlap_info is None:
        print("❌ No valid overlap period found")
        return
    
    print(f"\n📋 WHAT YOU NEED TO DOWNLOAD:")
    print("-" * 40)
    print(f"📍 Location: SAIT Solar Lab (Calgary, Alberta)")
    print(f"📅 Period: {overlap_info['start_date'].date()} to {overlap_info['end_date'].date()}")
    print(f"⏱️  Duration: {overlap_info['duration_days']} days")
    print(f"🌤️  Season: {overlap_info['season']}")
    print(f"🕒 Timezone: Mountain Time (Calgary)")
    
    print(f"\n⚠️  DATA QUALITY ISSUES TO ADDRESS:")
    print("-" * 40)
    for note in overlap_info.get('data_quality_notes', []):
        print(f"  • {note}")
    
    print(f"\n📊 WEATHER VARIABLES REQUIRED:")
    print("-" * 40)
    print(f"1. 🌞 SOLAR IRRADIANCE (MOST IMPORTANT)")
    print(f"   • Global Horizontal Irradiance (GHI) - W/m²")
    print(f"   • Direct Normal Irradiance (DNI) - W/m²")
    print(f"   • Time resolution: Hourly or better")
    
    print(f"\n2. 🌡️  TEMPERATURE")
    print(f"   • Air Temperature (°C)")
    print(f"   • Panel Temperature effect: -0.5% per °C above 25°C")
    
    print(f"\n3. ☁️  CLOUD COVER")
    print(f"   • Cloud cover percentage (%)")
    print(f"   • Sky condition (clear, partly cloudy, overcast)")
    
    print(f"\n4. 💧 OTHER METRICS")
    print(f"   • Relative Humidity (%)")
    print(f"   • Wind Speed (m/s) - affects cooling")
    print(f"   • Precipitation (mm) - cleaning effect")
    
    print(f"\n📈 DATA RESOLUTION:")
    print(f"   • Temporal: Hourly (match solar timestamps)")
    print(f"   • Location: 51.064°N, -114.088°W (SAIT coordinates)")
    print(f"   • Timezone: America/Denver (UTC-7 in winter, UTC-6 in summer)")
    
    print(f"\n🔗 RECOMMENDED DATA SOURCES FOR CALGARY:")
    print("-" * 40)
    print(f"1. 🇨🇦 Environment Canada (free, most accurate for Canada)")
    print(f"   - Historical data: https://climate.weather.gc.ca/")
    print(f"   - Calgary International Airport station")
    
    print(f"\n2. ☀️  Solcast API (solar-specific, paid but accurate)")
    print(f"   - Best for solar irradiance forecasting")
    
    print(f"\n3. 🌍 OpenWeatherMap API (free tier available)")
    print(f"   - Easy to use, global coverage")
    
    print(f"\n💡 SPECIFIC INSTRUCTIONS:")
    print(f"   • Get EXACT hourly data for the period above")
    print(f"   • Include sunrise/sunset times for Calgary")
    print(f"   • Note: Calgary gets 2400+ sunshine hours/year")
    print(f"   • Winter has less than 8 hours daylight, summer has 16+")
    
    # Save to file
    save_requirements_to_file(overlap_info)

def save_requirements_to_file(overlap_info):
    """Save weather data requirements to file"""
    import json
    
    requirements = {
        'project': 'SAIT Solar Generation Forecasting',
        'generated_date': datetime.now().isoformat(),
        'solar_data_period': {
            'start_date': overlap_info['start_date'].isoformat(),
            'end_date': overlap_info['end_date'].isoformat(),
            'duration_days': overlap_info['duration_days'],
            'total_hours': overlap_info['total_hours'],
            'season': overlap_info['season']
        },
        'data_quality_issues': overlap_info.get('data_quality_notes', []),
        'location': {
            'site': 'SAIT Solar Lab',
            'city': 'Calgary',
            'province': 'Alberta',
            'country': 'Canada',
            'coordinates': {
                'latitude': 51.064,
                'longitude': -114.088
            },
            'timezone': 'America/Denver',
            'elevation': '1080m'
        },
        'required_weather_variables': {
            'essential': ['solar_irradiance_ghi', 'temperature_air', 'cloud_cover'],
            'recommended': ['solar_irradiance_dni', 'relative_humidity', 'wind_speed', 'precipitation'],
            'unit_notes': 'Solar data appears to be in Wh (divide by 1000 for kW)'
        },
        'data_sources_recommended': [
            {'name': 'Environment Canada', 'url': 'https://climate.weather.gc.ca/', 'notes': 'Free, accurate for Calgary'},
            {'name': 'Solcast', 'url': 'https://solcast.com/', 'notes': 'Solar-specific, paid'},
            {'name': 'OpenWeatherMap', 'url': 'https://openweathermap.org/', 'notes': 'Free tier available'}
        ],
        'calgary_climate_notes': [
            '2400+ sunshine hours annually',
            'Dry climate with low humidity',
            'Chinook winds in winter can cause rapid temperature changes',
            'High altitude (1080m) affects solar irradiance'
        ]
    }
    
    with open('weather_data_requirements.json', 'w') as f:
        json.dump(requirements, f, indent=2)
    
    print(f"\n📁 Requirements saved to: weather_data_requirements.json")
    print(f"\n🚀 NEXT STEPS:")
    print(f"   1. Download weather data for the period above")
    print(f"   2. Clean solar data (divide by 1000, remove extremes)")
    print(f"   3. Match timestamps (hourly alignment)")
    print(f"   4. Train forecasting model")

def visualize_solar_patterns(carport_data, rooftop_data, overlap_info):
    """Create visualization of solar patterns"""
    print(f"\n📊 CREATING VISUALIZATIONS")
    print("-" * 50)
    
    try:
        fig, axes = plt.subplots(3, 2, figsize=(15, 12))
        fig.suptitle('SAIT Solar Generation Analysis - Weather Integration', fontsize=16, fontweight='bold')
        
        # 1. Clean data first
        carport_clean = carport_data.copy()
        rooftop_clean = rooftop_data.copy()
        
        # Assuming data is in Wh, convert to kW
        carport_clean['generation_kw'] = carport_clean['generation_kw'] / 1000
        rooftop_clean['generation_kw'] = rooftop_clean['generation_kw'] / 1000
        
        # Remove extreme values for visualization
        carport_clean = carport_clean[carport_clean['generation_kw'] < 100]  # Reasonable solar limit
        rooftop_clean = rooftop_clean[rooftop_clean['generation_kw'] < 100]
        
        # 1. Daily pattern for carport
        if len(carport_clean) > 0:
            carport_clean['hour'] = carport_clean['timestamp'].dt.hour
            daily_pattern = carport_clean.groupby('hour')['generation_kw'].mean()
            axes[0, 0].plot(daily_pattern.index, daily_pattern.values, 'b-', linewidth=2)
            axes[0, 0].set_title('Carport Solar - Daily Pattern (kW)')
            axes[0, 0].set_xlabel('Hour of Day')
            axes[0, 0].set_ylabel('Average Generation (kW)')
            axes[0, 0].grid(True, alpha=0.3)
            axes[0, 0].fill_between(daily_pattern.index, 0, daily_pattern.values, alpha=0.3)
            axes[0, 0].set_ylim(0, max(daily_pattern.values) * 1.1)
        
        # 2. Daily pattern for rooftop
        if len(rooftop_clean) > 0:
            rooftop_clean['hour'] = rooftop_clean['timestamp'].dt.hour
            daily_pattern = rooftop_clean.groupby('hour')['generation_kw'].mean()
            axes[0, 1].plot(daily_pattern.index, daily_pattern.values, 'g-', linewidth=2)
            axes[0, 1].set_title('Rooftop Solar - Daily Pattern (kW)')
            axes[0, 1].set_xlabel('Hour of Day')
            axes[0, 1].set_ylabel('Average Generation (kW)')
            axes[0, 1].grid(True, alpha=0.3)
            axes[0, 1].fill_between(daily_pattern.index, 0, daily_pattern.values, alpha=0.3)
            axes[0, 1].set_ylim(0, max(daily_pattern.values) * 1.1)
        
        # 3. Monthly pattern (combined)
        if overlap_info and 'aligned_data' in overlap_info:
            aligned_clean = overlap_info['aligned_data'].copy()
            aligned_clean = aligned_clean[aligned_clean['carport_kw'] < 100]
            aligned_clean = aligned_clean[aligned_clean['rooftop_kw'] < 100]
            
            monthly_pattern = aligned_clean.groupby('month').mean()
            axes[1, 0].bar(monthly_pattern.index - 0.2, monthly_pattern['carport_kw'], 
                          width=0.4, alpha=0.7, label='Carport')
            axes[1, 0].bar(monthly_pattern.index + 0.2, monthly_pattern['rooftop_kw'], 
                          width=0.4, alpha=0.7, label='Rooftop')
            axes[1, 0].set_title('Monthly Average Generation')
            axes[1, 0].set_xlabel('Month')
            axes[1, 0].set_ylabel('Average Generation (kW)')
            axes[1, 0].legend()
            axes[1, 0].grid(True, alpha=0.3)
            axes[1, 0].set_xticks(range(1, 13))
        
        # 4. Correlation scatter plot
        if overlap_info and 'aligned_data' in overlap_info:
            sample_data = aligned_clean.sample(min(1000, len(aligned_clean)))
            axes[1, 1].scatter(sample_data['carport_kw'], sample_data['rooftop_kw'], 
                              alpha=0.5, s=10)
            axes[1, 1].set_title(f'Correlation: {overlap_info.get("correlation", 0):.3f}')
            axes[1, 1].set_xlabel('Carport Generation (kW)')
            axes[1, 1].set_ylabel('Rooftop Generation (kW)')
            axes[1, 1].grid(True, alpha=0.3)
        
        # 5. Recommended period timeline
        if overlap_info:
            axes[2, 0].text(0.1, 0.7, 
                           f"WEATHER DATA REQUIREMENTS\n"
                           f"────────────────────\n"
                           f"📍 Location: Calgary, AB\n"
                           f"📅 Period: {overlap_info['start_date'].date()} to {overlap_info['end_date'].date()}\n"
                           f"⏱️  Duration: {overlap_info['duration_days']} days\n"
                           f"🌤️  Season: {overlap_info['season']}\n"
                           f"🕒 Hours needed: {overlap_info['total_hours']:,}\n\n"
                           f"REQUIRED DATA:\n"
                           f"• Solar Irradiance (GHI)\n"
                           f"• Temperature (°C)\n"
                           f"• Cloud Cover (%)\n"
                           f"• Humidity (%)\n"
                           f"• Wind Speed (m/s)",
                           fontsize=10,
                           bbox=dict(boxstyle='round', facecolor='lightyellow', alpha=0.8))
            axes[2, 0].set_title('Weather Data Requirements')
            axes[2, 0].axis('off')
        
        # 6. Data quality notes
        notes_text = "DATA QUALITY ISSUES:\n────────────────────\n"
        notes_text += "1. Unit appears to be Wh, not kW\n"
        notes_text += "   → Divide all values by 1000\n"
        notes_text += "2. Carport has extreme values\n"
        notes_text += "   → Max: 15,391 (needs cleaning)\n"
        notes_text += "3. Carport has stuck values\n"
        notes_text += "   → 16 identical readings found\n"
        notes_text += "4. Rooftop data looks cleaner\n"
        notes_text += "5. Negative values at night: OK\n\n"
        notes_text += "NEXT STEPS:\n"
        notes_text += "1. Clean solar data\n"
        notes_text += "2. Get weather data\n"
        notes_text += "3. Align timestamps\n"
        notes_text += "4. Train model"
        
        axes[2, 1].text(0.1, 0.1, notes_text,
                       fontsize=9,
                       bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
        axes[2, 1].set_title('Data Quality & Next Steps')
        axes[2, 1].axis('off')
        
        plt.tight_layout()
        plt.savefig('solar_weather_requirements.png', dpi=150, bbox_inches='tight')
        print(f"📊 Visualization saved: solar_weather_requirements.png")
        plt.show()
        
    except Exception as e:
        print(f"⚠️  Visualization error: {e}")

def main():
    """Main analysis function"""
    print("Starting solar data analysis for weather integration...\n")
    
    # Step 1: Fetch solar data
    print("1. 📥 FETCHING SOLAR DATA FROM DATABASE")
    print("-" * 50)
    
    carport_data = fetch_solar_data('SaitSolarLab_30000_TL252')
    rooftop_data = fetch_solar_data('SaitSolarLab_30000_TL253')
    
    if carport_data is None or rooftop_data is None:
        print("❌ Failed to fetch solar data")
        return
    
    # Step 2: Analyze individual sensors
    print("\n2. 🔍 ANALYZING SENSOR DATA QUALITY")
    print("=" * 50)
    
    carport_analysis = analyze_sensor_timeline(carport_data, 'Carport Solar (TL252)')
    rooftop_analysis = analyze_sensor_timeline(rooftop_data, 'Rooftop Solar (TL253)')
    
    # Step 3: Find optimal overlap
    overlap_info = find_optimal_overlap(carport_data, rooftop_data)
    
    # Step 4: Generate weather requirements
    if overlap_info:
        generate_weather_data_requirements(overlap_info)
        
        # Step 5: Visualize
        visualize_solar_patterns(carport_data, rooftop_data, overlap_info)
        
        print(f"\n{'='*70}")
        print("✅ ANALYSIS COMPLETE!")
        print("=" * 70)
        
        print(f"\n🎯 CRITICAL FINDINGS:")
        print(f"   1. Data appears to be in Wh, not kW (divide by 1000)")
        print(f"   2. Carport has unrealistic high values (15,391)")
        print(f"   3. Get weather data for: {overlap_info['start_date'].date()} to {overlap_info['end_date'].date()}")
        print(f"   4. Focus on Environment Canada for Calgary weather")
        
    else:
        print("\n❌ Could not find suitable overlap period for weather integration")

if __name__ == "__main__":
    main()