# src/data/organize_components.py
print("📊 ORGANIZING COMPONENT DATA FOR SYSTEMATIC FORECASTING")
print("=" * 70)

import sys
import pandas as pd
import numpy as np
import os
import json
from datetime import datetime, timedelta

# Add src to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

class ComponentDataOrganizer:
    def __init__(self):
        self.data_dir = os.path.join(project_root, "data")
        self.output_dir = os.path.join(project_root, "data", "processed")
        
        # Define component groups based on your tables
        self.components = {
            "consumption": {
                "tl209": {
                    "name": "lighting",
                    "description": "GBT Lighting consumption",
                    "unit": "kWh",
                    "expected_range": (0, 5000)
                },
                "tl212": {
                    "name": "appliances",
                    "description": "GBT Appliances consumption",
                    "unit": "kWh",
                    "expected_range": (0, 3000)
                },
                "tl211": {
                    "name": "equipment_rd",
                    "description": "GBT Equipment/R&D consumption",
                    "unit": "kWh",
                    "expected_range": (0, 8000)
                },
                "tl208": {
                    "name": "space_hvac",
                    "description": "GBT Space heating/cooling consumption",
                    "unit": "kWh",
                    "expected_range": (0, 15000)
                },
                "tl4": {
                    "name": "ventilation",
                    "description": "GBT Ventilation consumption",
                    "unit": "kWh",
                    "expected_range": (0, 4000)
                },
                "tl213": {
                    "name": "panel_usage",
                    "description": "Panel2A-1 Total Usage",
                    "unit": "kWh",
                    "expected_range": (0, 2000)
                }
            },
            
            "generation": {
                "tl3": {
                    "name": "total_generation",
                    "description": "GBT Total Generation",
                    "unit": "kWh",
                    "expected_range": (0, 10000)
                },
                "tl252": {
                    "name": "solar_carport",
                    "description": "PV-Carport Solar Total",
                    "unit": "kWh",
                    "expected_range": (0, 5000)
                },
                "tl253": {
                    "name": "solar_rooftop",
                    "description": "PV-Rooftop Solar Total",
                    "unit": "kWh",
                    "expected_range": (0, 5000)
                }
            },
            
            "aggregate": {
                "tl342": {
                    "name": "site_total",
                    "description": "GBT Site Consumption (Total)",
                    "unit": "kWh",
                    "expected_range": (-20000, 20000)
                },
                "tl335": {
                    "name": "net_energy",
                    "description": "GBT Net Energy",
                    "unit": "kWh",
                    "expected_range": (-20000, 20000)
                }
            }
        }
        
        # Create output directories
        self.create_directories()
    
    def create_directories(self):
        """Create necessary directories"""
        directories = [
            self.output_dir,
            os.path.join(self.output_dir, "individual"),
            os.path.join(self.output_dir, "hourly"),
            os.path.join(self.output_dir, "daily"),
            os.path.join(self.output_dir, "weekly"),
            os.path.join(self.output_dir, "components"),
            os.path.join(self.output_dir, "reports")
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            print(f"✅ Created: {directory}/")
    
    def find_data_file(self, table_code):
        """Find data file for a table code"""
        possible_locations = [
            os.path.join(self.data_dir, "individual", f"{table_code}.csv"),
            os.path.join(self.data_dir, "forecast", f"{table_code}.csv"),
            os.path.join(self.data_dir, "raw", f"{table_code}.csv"),
            os.path.join(self.data_dir, f"{table_code}.csv")
        ]
        
        for location in possible_locations:
            if os.path.exists(location):
                return location
        
        return None
    
    def process_component(self, component_type, table_code, config):
        """Process a single component"""
        print(f"\n📊 Processing: {config['name']} ({table_code})")
        print(f"   Description: {config['description']}")
        
        # Find and load data
        data_file = self.find_data_file(table_code)
        if not data_file:
            print(f"   ❌ Data file not found for {table_code}")
            return None
        
        try:
            df = pd.read_csv(data_file)
            print(f"   ✅ Loaded: {len(df):,} records from {os.path.basename(data_file)}")
            
            # Find timestamp column
            timestamp_col = None
            for col in df.columns:
                if 'time' in col.lower() or 'date' in col.lower() or col.lower() == 'timestamp':
                    timestamp_col = col
                    break
            
            if not timestamp_col:
                print(f"   ⚠️  No timestamp column found. Using first column.")
                timestamp_col = df.columns[0]
            
            # Parse timestamp
            df[timestamp_col] = pd.to_datetime(df[timestamp_col], errors='coerce')
            df = df.dropna(subset=[timestamp_col])
            df.set_index(timestamp_col, inplace=True)
            df.index.name = 'timestamp'
            
            # Find value column
            value_col = None
            for col in df.columns:
                if 'value' in col.lower() or table_code in col.lower():
                    value_col = col
                    break
            
            if not value_col:
                # Take first numeric column
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) > 0:
                    value_col = numeric_cols[0]
                else:
                    print(f"   ❌ No numeric column found")
                    return None
            
            # Create clean dataframe
            df_clean = df[[value_col]].copy()
            df_clean = df_clean.rename(columns={value_col: 'value'})
            
            # Remove duplicates
            df_clean = df_clean[~df_clean.index.duplicated(keep='first')]
            df_clean = df_clean.sort_index()
            
            # Save individual data
            individual_file = os.path.join(self.output_dir, "individual", f"{config['name']}.csv")
            df_clean.to_csv(individual_file)
            print(f"   💾 Saved individual data: {individual_file}")
            
            # Create hourly data
            df_hourly = df_clean.resample('h').mean()
            
            # Handle negative values based on component type
            if component_type == 'consumption':
                # Consumption should be positive
                negative_mask = df_hourly['value'] < 0
                if negative_mask.any():
                    print(f"   ⚠️  Found {negative_mask.sum():,} negative values in consumption")
                    df_hourly.loc[negative_mask, 'value'] = df_hourly.loc[negative_mask, 'value'].abs()
            
            # Interpolate missing values
            df_hourly = df_hourly.interpolate(method='time', limit=24)
            df_hourly = df_hourly.dropna()
            
            # Save hourly data
            hourly_file = os.path.join(self.output_dir, "hourly", f"{config['name']}_hourly.csv")
            df_hourly.to_csv(hourly_file)
            print(f"   💾 Saved hourly data: {hourly_file}")
            
            # Create aggregated datasets
            df_daily = df_hourly.resample('D').mean()
            daily_file = os.path.join(self.output_dir, "daily", f"{config['name']}_daily.csv")
            df_daily.to_csv(daily_file)
            
            df_weekly = df_hourly.resample('W').mean()
            weekly_file = os.path.join(self.output_dir, "weekly", f"{config['name']}_weekly.csv")
            df_weekly.to_csv(weekly_file)
            
            # Calculate statistics
            stats = {
                'name': config['name'],
                'table_code': table_code,
                'description': config['description'],
                'component_type': component_type,
                'unit': config['unit'],
                'records': len(df_clean),
                'hourly_records': len(df_hourly),
                'date_range': {
                    'start': df_hourly.index.min().strftime('%Y-%m-%d %H:%M:%S'),
                    'end': df_hourly.index.max().strftime('%Y-%m-%d %H:%M:%S')
                },
                'statistics': {
                    'mean': float(df_hourly['value'].mean()),
                    'std': float(df_hourly['value'].std()),
                    'min': float(df_hourly['value'].min()),
                    'max': float(df_hourly['value'].max()),
                    'median': float(df_hourly['value'].median())
                },
                'data_quality': {
                    'missing_values': int(df_hourly['value'].isna().sum()),
                    'negative_values': int((df_hourly['value'] < 0).sum()),
                    'zero_values': int((df_hourly['value'] == 0).sum())
                }
            }
            
            print(f"   📅 Hourly range: {stats['date_range']['start']} to {stats['date_range']['end']}")
            print(f"   📈 Statistics: Mean={stats['statistics']['mean']:.2f}, Std={stats['statistics']['std']:.2f}")
            
            return stats
            
        except Exception as e:
            print(f"   ❌ Error processing {table_code}: {e}")
            return None
    
    def create_combined_dataset(self, component_type):
        """Create combined dataset for a component type"""
        print(f"\n🔗 Creating combined {component_type} dataset...")
        
        combined_data = None
        
        for table_code, config in self.components[component_type].items():
            hourly_file = os.path.join(self.output_dir, "hourly", f"{config['name']}_hourly.csv")
            
            if os.path.exists(hourly_file):
                df = pd.read_csv(hourly_file, parse_dates=['timestamp'])
                df.set_index('timestamp', inplace=True)
                
                # Rename column to component name
                df = df.rename(columns={'value': config['name']})
                
                if combined_data is None:
                    combined_data = df
                else:
                    combined_data = pd.merge(
                        combined_data, df,
                        left_index=True, right_index=True,
                        how='outer'
                    )
        
        if combined_data is not None:
            # Fill missing values
            combined_data = combined_data.interpolate(method='time', limit=24)
            
            # Save combined dataset
            combined_file = os.path.join(self.output_dir, "components", f"{component_type}_combined.csv")
            combined_data.to_csv(combined_file)
            
            print(f"   ✅ Saved combined {component_type} data: {combined_file}")
            print(f"   📊 Shape: {combined_data.shape}")
            print(f"   📅 Range: {combined_data.index.min()} to {combined_data.index.max()}")
            
            return combined_data
        
        return None
    
    def create_total_consumption_dataset(self):
        """Create total consumption dataset from components"""
        print(f"\n🧮 Creating total consumption dataset...")
        
        # Check if we have consumption components
        consumption_files = []
        
        for table_code, config in self.components['consumption'].items():
            hourly_file = os.path.join(self.output_dir, "hourly", f"{config['name']}_hourly.csv")
            if os.path.exists(hourly_file):
                consumption_files.append((config['name'], hourly_file))
        
        if len(consumption_files) >= 2:
            print(f"   Found {len(consumption_files)} consumption components")
            
            total_consumption = None
            
            for component_name, file_path in consumption_files:
                df = pd.read_csv(file_path, parse_dates=['timestamp'])
                df.set_index('timestamp', inplace=True)
                
                if total_consumption is None:
                    total_consumption = df.rename(columns={'value': component_name})
                else:
                    total_consumption[component_name] = df['value']
            
            # Calculate total
            total_consumption['total_consumption'] = total_consumption.sum(axis=1)
            
            # Save
            total_file = os.path.join(self.output_dir, "components", "total_consumption_from_components.csv")
            total_consumption.to_csv(total_file)
            
            print(f"   ✅ Created total consumption from components")
            print(f"   💾 Saved: {total_file}")
            print(f"   📊 Mean total consumption: {total_consumption['total_consumption'].mean():.2f} kWh")
            
            return total_consumption
        
        print(f"   ⚠️  Not enough consumption components found")
        return None
    
    def generate_reports(self, all_stats):
        """Generate analysis reports"""
        print(f"\n📄 Generating reports...")
        
        # Create summary dataframe
        summary_data = []
        
        for stats in all_stats:
            if stats:
                summary_data.append({
                    'Component': stats['name'],
                    'Type': stats['component_type'],
                    'Description': stats['description'],
                    'Records': stats['hourly_records'],
                    'Start Date': stats['date_range']['start'][:10],
                    'End Date': stats['date_range']['end'][:10],
                    'Mean (kWh)': f"{stats['statistics']['mean']:.2f}",
                    'Std Dev (kWh)': f"{stats['statistics']['std']:.2f}",
                    'Min (kWh)': f"{stats['statistics']['min']:.2f}",
                    'Max (kWh)': f"{stats['statistics']['max']:.2f}"
                })
        
        if summary_data:
            summary_df = pd.DataFrame(summary_data)
            
            # Save CSV report
            report_file = os.path.join(self.output_dir, "reports", "component_summary.csv")
            summary_df.to_csv(report_file, index=False)
            
            # Save JSON report
            json_file = os.path.join(self.output_dir, "reports", "component_details.json")
            with open(json_file, 'w') as f:
                json.dump(all_stats, f, indent=2, default=str)
            
            # Save markdown report
            md_file = os.path.join(self.output_dir, "reports", "README.md")
            with open(md_file, 'w') as f:
                f.write("# Component Data Summary\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write("## Component Overview\n\n")
                f.write(summary_df.to_markdown(index=False))
                
                # Add data quality section
                f.write("\n\n## Data Quality Notes\n\n")
                f.write("1. **Consumption components**: Negative values were converted to absolute values\n")
                f.write("2. **Missing values**: Interpolated with time-based method (max 24 hours)\n")
                f.write("3. **Frequency**: All data resampled to hourly frequency\n")
                f.write("4. **Units**: All values in kWh\n")
            
            print(f"   ✅ Summary report: {report_file}")
            print(f"   ✅ Detailed report: {json_file}")
            print(f"   ✅ README: {md_file}")
            
            # Print summary
            print(f"\n📈 COMPONENT SUMMARY:")
            print("=" * 70)
            print(summary_df.to_string(index=False))
    
    def run(self):
        """Main execution method"""
        print(f"Starting component data organization...")
        print(f"Total components to process: {sum(len(v) for v in self.components.values())}")
        
        all_stats = []
        
        # Process all components
        for component_type, components in self.components.items():
            print(f"\n{'='*60}")
            print(f"PROCESSING {component_type.upper()} COMPONENTS")
            print(f"{'='*60}")
            
            for table_code, config in components.items():
                stats = self.process_component(component_type, table_code, config)
                all_stats.append(stats)
        
        # Create combined datasets
        print(f"\n{'='*60}")
        print(f"CREATING COMBINED DATASETS")
        print(f"{'='*60}")
        
        for component_type in self.components.keys():
            self.create_combined_dataset(component_type)
        
        # Create total consumption dataset
        self.create_total_consumption_dataset()
        
        # Generate reports
        self.generate_reports([s for s in all_stats if s])
        
        print(f"\n{'='*70}")
        print("🎉 COMPONENT DATA ORGANIZATION COMPLETE!")
        print(f"{'='*70}")
        
        print(f"\n📁 Output structure:")
        print(f"  {self.output_dir}/")
        print(f"  ├── individual/      # Individual component CSVs")
        print(f"  ├── hourly/          # Hourly resampled data")
        print(f"  ├── daily/           # Daily aggregated data")
        print(f"  ├── weekly/          # Weekly aggregated data")
        print(f"  ├── components/      # Combined component datasets")
        print(f"  └── reports/         # Analysis reports")
        
        print(f"\n🎯 Next steps:")
        print(f"  1. Run component-based training: python src/training/train_components.py")
        print(f"  2. Check data quality in: {self.output_dir}/reports/")
        print(f"  3. Use combined datasets for forecasting")

if __name__ == "__main__":
    organizer = ComponentDataOrganizer()
    organizer.run()